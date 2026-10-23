import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import type { ShadowState } from './shadow.ts';

export interface DurableEvidenceRevision {
  schemaVersion: 1;
  revisionId: string;
  parentRevisionId: string | null;
  createdAtUtc: string;
  stateSha256: string;
  state: ShadowState;
}

interface PendingTransaction {
  schemaVersion: 1;
  transactionId: string;
  revision: DurableEvidenceRevision;
}

export interface DurableCommitResult {
  revision: DurableEvidenceRevision;
  duplicate: boolean;
  recovered: boolean;
}

export class DurableEvidenceConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DurableEvidenceConflictError';
  }
}

export function loadDurableHead(directory: string): DurableEvidenceRevision | null {
  const root = resolve(directory);
  const headPath = join(root, 'HEAD');
  if (!existsSync(headPath)) return null;
  const revisionId = readFileSync(headPath, 'utf8').trim();
  if (!revisionId) throw new Error('Durable evidence HEAD is empty');
  return readRevision(root, revisionId);
}

export async function recoverDurableEvidenceStore(
  directory: string,
): Promise<DurableCommitResult | null> {
  const root = resolve(directory);
  return withStoreLock(root, async () => recoverUnlocked(root));
}

export async function commitDurableEvidence(input: {
  directory: string;
  state: ShadowState;
  createdAtUtc: string;
  expectedHeadRevisionId?: string | null;
  simulateInterruptionAfter?: 'JOURNAL' | 'REVISION';
}): Promise<DurableCommitResult> {
  if (!validUtc(input.createdAtUtc)) throw new Error('Durable revision time must be UTC');
  const root = resolve(input.directory);
  return withStoreLock(root, async () => {
    await recoverUnlocked(root);
    const head = loadDurableHead(root);
    if (
      Object.prototype.hasOwnProperty.call(input, 'expectedHeadRevisionId') &&
      input.expectedHeadRevisionId !== (head?.revisionId ?? null)
    ) {
      throw new DurableEvidenceConflictError(
        `Durable evidence HEAD changed: expected ${input.expectedHeadRevisionId ?? 'null'}, found ${head?.revisionId ?? 'null'}`,
      );
    }
    const stateSha256 = hashJson(input.state);
    if (head?.stateSha256 === stateSha256)
      return { revision: head, duplicate: true, recovered: false };
    const revisionId = `evidence-${hashText(`${head?.revisionId ?? 'root'}:${stateSha256}`)}`;
    const revision: DurableEvidenceRevision = {
      schemaVersion: 1,
      revisionId,
      parentRevisionId: head?.revisionId ?? null,
      createdAtUtc: input.createdAtUtc,
      stateSha256,
      state: input.state,
    };
    const transaction: PendingTransaction = {
      schemaVersion: 1,
      transactionId: `transaction-${revisionId}`,
      revision,
    };
    writeAtomic(transactionPath(root), transaction);
    if (input.simulateInterruptionAfter === 'JOURNAL')
      throw new Error('Simulated interruption after durable journal write');
    writeRevision(root, revision);
    if (input.simulateInterruptionAfter === 'REVISION')
      throw new Error('Simulated interruption after durable revision write');
    writeHead(root, revision.revisionId);
    verifyHead(root, revision);
    rmSync(transactionPath(root), { force: true });
    return { revision, duplicate: false, recovered: false };
  });
}

export function listDurableRevisions(directory: string): DurableEvidenceRevision[] {
  const revisions: DurableEvidenceRevision[] = [];
  let current = loadDurableHead(directory);
  const seen = new Set<string>();
  while (current) {
    if (seen.has(current.revisionId)) throw new Error('Durable evidence history contains a cycle');
    seen.add(current.revisionId);
    revisions.push(current);
    current = current.parentRevisionId
      ? readRevision(resolve(directory), current.parentRevisionId)
      : null;
  }
  return revisions.reverse();
}

async function recoverUnlocked(root: string): Promise<DurableCommitResult | null> {
  const pendingPath = transactionPath(root);
  if (!existsSync(pendingPath)) return null;
  const transaction = parseTransaction(readFileSync(pendingPath, 'utf8'));
  const head = loadDurableHead(root);
  const revision = transaction.revision;
  if (head?.revisionId === revision.revisionId) {
    verifyHead(root, revision);
    rmSync(pendingPath, { force: true });
    return { revision, duplicate: true, recovered: true };
  }
  if ((head?.revisionId ?? null) !== revision.parentRevisionId) {
    throw new DurableEvidenceConflictError(
      `Cannot recover ${revision.revisionId}; HEAD no longer matches its parent`,
    );
  }
  writeRevision(root, revision);
  writeHead(root, revision.revisionId);
  verifyHead(root, revision);
  rmSync(pendingPath, { force: true });
  return { revision, duplicate: false, recovered: true };
}

function writeRevision(root: string, revision: DurableEvidenceRevision): void {
  const path = revisionPath(root, revision.revisionId);
  mkdirSync(dirname(path), { recursive: true });
  if (existsSync(path)) {
    const existing = parseRevision(readFileSync(path, 'utf8'));
    if (JSON.stringify(existing) !== JSON.stringify(revision))
      throw new DurableEvidenceConflictError(`Revision identity collision: ${revision.revisionId}`);
    return;
  }
  writeFileSync(path, `${JSON.stringify(revision, null, 2)}\n`, { encoding: 'utf8', flag: 'wx' });
}

function readRevision(root: string, revisionId: string): DurableEvidenceRevision {
  const revision = parseRevision(readFileSync(revisionPath(root, revisionId), 'utf8'));
  if (revision.revisionId !== revisionId)
    throw new Error(`Durable revision identity mismatch: ${revisionId}`);
  if (hashJson(revision.state) !== revision.stateSha256)
    throw new Error(`Durable revision state hash mismatch: ${revisionId}`);
  return revision;
}

function writeHead(root: string, revisionId: string): void {
  writeTextAtomic(join(root, 'HEAD'), `${revisionId}\n`);
}

function verifyHead(root: string, expected: DurableEvidenceRevision): void {
  const actual = loadDurableHead(root);
  if (!actual || JSON.stringify(actual) !== JSON.stringify(expected))
    throw new Error(`Durable evidence read-back failed for ${expected.revisionId}`);
}

function parseRevision(text: string): DurableEvidenceRevision {
  const value: unknown = JSON.parse(text);
  if (!isRecord(value) || value.schemaVersion !== 1 || !isRecord(value.state))
    throw new Error('Durable evidence revision schema is invalid');
  const revision = value as unknown as DurableEvidenceRevision;
  if (
    !revision.revisionId ||
    (revision.parentRevisionId !== null && !revision.parentRevisionId) ||
    !validUtc(revision.createdAtUtc) ||
    !/^[a-f0-9]{64}$/.test(revision.stateSha256)
  ) {
    throw new Error('Durable evidence revision is incomplete');
  }
  return revision;
}

function parseTransaction(text: string): PendingTransaction {
  const value: unknown = JSON.parse(text);
  if (!isRecord(value) || value.schemaVersion !== 1 || !isRecord(value.revision))
    throw new Error('Durable evidence transaction schema is invalid');
  const transaction = value as unknown as PendingTransaction;
  const revision = parseRevision(JSON.stringify(transaction.revision));
  if (transaction.transactionId !== `transaction-${revision.revisionId}`)
    throw new Error('Durable evidence transaction identity mismatch');
  return { ...transaction, revision };
}

async function withStoreLock<T>(root: string, action: () => Promise<T>): Promise<T> {
  const lockPath = join(root, 'store.lock');
  mkdirSync(root, { recursive: true });
  const deadline = Date.now() + 5_000;
  while (true) {
    try {
      writeFileSync(lockPath, `${process.pid}\n`, { encoding: 'utf8', flag: 'wx' });
      break;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'EEXIST') throw error;
      if (Date.now() >= deadline)
        throw new DurableEvidenceConflictError(
          'Durable evidence store is locked; verify the writer before recovery',
        );
      await new Promise((resolveDelay) => setTimeout(resolveDelay, 20));
    }
  }
  try {
    return await action();
  } finally {
    rmSync(lockPath, { force: true });
  }
}

function writeAtomic(path: string, value: unknown): void {
  writeTextAtomic(path, `${JSON.stringify(value, null, 2)}\n`);
}

function writeTextAtomic(path: string, value: string): void {
  mkdirSync(dirname(path), { recursive: true });
  const temporary = `${path}.${process.pid}.tmp`;
  writeFileSync(temporary, value, 'utf8');
  renameSync(temporary, path);
}

function transactionPath(root: string): string {
  return join(root, 'transactions', 'pending.json');
}

function revisionPath(root: string, revisionId: string): string {
  if (!/^evidence-[a-f0-9]{24}$/.test(revisionId))
    throw new Error(`Invalid durable revision ID: ${revisionId}`);
  return join(root, 'revisions', `${revisionId}.json`);
}

function hashJson(value: unknown): string {
  return createHash('sha256').update(JSON.stringify(value)).digest('hex');
}

function hashText(value: string): string {
  return createHash('sha256').update(value).digest('hex').slice(0, 24);
}

function validUtc(value: unknown): value is string {
  return typeof value === 'string' && value.endsWith('Z') && Number.isFinite(Date.parse(value));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}
