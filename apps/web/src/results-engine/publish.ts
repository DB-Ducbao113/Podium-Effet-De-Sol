import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import type { ResultRevision } from './types.ts';

export interface PublicationOptions {
  outputDirectory?: string;
}

/**
 * Publication is deliberately opt-in. Only an approved source may produce an
 * immutable revision file; synthetic, restricted, and unknown sources are blocked.
 */
export function publishRevision(
  revision: ResultRevision,
  options: PublicationOptions = {},
): string {
  const license = revision.result.source.license;
  if (license !== 'APPROVED') {
    throw new Error(`${license} source results cannot be published`);
  }
  const outputDirectory = resolve(options.outputDirectory ?? '.results-engine/publications');
  mkdirSync(outputDirectory, { recursive: true });
  const path = join(outputDirectory, `${revision.sessionId}-${revision.revisionId}.json`);
  writeFileSync(path, `${JSON.stringify(revision, null, 2)}\n`, { encoding: 'utf8', flag: 'wx' });
  return path;
}
