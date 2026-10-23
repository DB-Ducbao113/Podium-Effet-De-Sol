import { readFileSync } from 'node:fs';

export type SourceCategory =
  | 'INDEPENDENT_SOFTWARE'
  | 'SYNTHETIC_REPLAY'
  | 'THIRD_PARTY_DATASET'
  | 'OFFICIAL_DOCUMENT_METADATA';
export type RightsStatus = 'PROJECT_OWNED' | 'SYNTHETIC' | 'REVIEW_REQUIRED';

export interface ObservationSourceRecord {
  sourceId: string;
  name: string;
  category: SourceCategory;
  rightsStatus: RightsStatus;
  defaultUse: 'ENABLED' | 'DISABLED';
  networkAccess: boolean;
  publicationAllowed: boolean;
  evidence: string;
  eligibility: {
    observation: 'PERMITTED_OFFLINE' | 'REVIEW_REQUIRED';
    storage: 'PERMITTED_OFFLINE' | 'REVIEW_REQUIRED';
    publicRedistribution: 'NOT_APPLICABLE' | 'PROHIBITED_WITHOUT_PERMISSION';
    commercialUse: 'NOT_APPLICABLE' | 'PROHIBITED_WITHOUT_PERMISSION';
  };
  evidenceUrls: readonly string[];
}

export interface ObservationPermission {
  schemaVersion: 2;
  sourceId: string;
  permission: 'MANUAL_NETWORK_OBSERVATION_APPROVED';
  scope: string;
  evidenceReference: string;
  providerAuthorizationReference: string;
  acknowledgement: 'LOCAL_RECORD_IS_NOT_PROVIDER_AUTHORIZATION';
  reviewedAtUtc: string;
  approvedBy: string;
}

export const observationSourceRegistry: readonly ObservationSourceRecord[] = [
  {
    sourceId: 'podium-results-engine',
    name: 'Podium EDS Results Engine software and validation logic',
    category: 'INDEPENDENT_SOFTWARE',
    rightsStatus: 'PROJECT_OWNED',
    defaultUse: 'ENABLED',
    networkAccess: false,
    publicationAllowed: false,
    evidence: 'Repository-authored source and tests under src/results-engine/.',
    eligibility: {
      observation: 'PERMITTED_OFFLINE',
      storage: 'PERMITTED_OFFLINE',
      publicRedistribution: 'NOT_APPLICABLE',
      commercialUse: 'NOT_APPLICABLE',
    },
    evidenceUrls: [],
  },
  {
    sourceId: 'synthetic-openf1-replay',
    name: 'Synthetic OpenF1-shaped replay snapshots',
    category: 'SYNTHETIC_REPLAY',
    rightsStatus: 'SYNTHETIC',
    defaultUse: 'ENABLED',
    networkAccess: false,
    publicationAllowed: false,
    evidence: 'Repository fixtures contain invented participants and observations.',
    eligibility: {
      observation: 'PERMITTED_OFFLINE',
      storage: 'PERMITTED_OFFLINE',
      publicRedistribution: 'NOT_APPLICABLE',
      commercialUse: 'NOT_APPLICABLE',
    },
    evidenceUrls: [],
  },
  {
    sourceId: 'synthetic-cross-source-replay',
    name: 'Synthetic secondary classification replay',
    category: 'SYNTHETIC_REPLAY',
    rightsStatus: 'SYNTHETIC',
    defaultUse: 'ENABLED',
    networkAccess: false,
    publicationAllowed: false,
    evidence: 'Repository fixture uses invented comparison classifications.',
    eligibility: {
      observation: 'PERMITTED_OFFLINE',
      storage: 'PERMITTED_OFFLINE',
      publicRedistribution: 'NOT_APPLICABLE',
      commercialUse: 'NOT_APPLICABLE',
    },
    evidenceUrls: [],
  },
  {
    sourceId: 'openf1-community-api',
    name: 'OpenF1 community API observations',
    category: 'THIRD_PARTY_DATASET',
    rightsStatus: 'REVIEW_REQUIRED',
    defaultUse: 'DISABLED',
    networkAccess: true,
    publicationAllowed: false,
    evidence: 'Historical access is documented, but the repository license is CC BY-NC-SA 4.0.',
    eligibility: {
      observation: 'REVIEW_REQUIRED',
      storage: 'REVIEW_REQUIRED',
      publicRedistribution: 'PROHIBITED_WITHOUT_PERMISSION',
      commercialUse: 'PROHIBITED_WITHOUT_PERMISSION',
    },
    evidenceUrls: [
      'https://openf1.org/docs/',
      'https://openf1.org/account',
      'https://github.com/br-g/openf1/blob/main/LICENSE',
    ],
  },
  {
    sourceId: 'jolpica-ergast-api',
    name: 'Jolpica Ergast-compatible results dataset',
    category: 'THIRD_PARTY_DATASET',
    rightsStatus: 'REVIEW_REQUIRED',
    defaultUse: 'DISABLED',
    networkAccess: true,
    publicationAllowed: false,
    evidence:
      'Terms permit non-commercial use under CC BY-NC-SA 4.0; commercial use requires contact.',
    eligibility: {
      observation: 'REVIEW_REQUIRED',
      storage: 'REVIEW_REQUIRED',
      publicRedistribution: 'PROHIBITED_WITHOUT_PERMISSION',
      commercialUse: 'PROHIBITED_WITHOUT_PERMISSION',
    },
    evidenceUrls: [
      'https://github.com/jolpica/jolpica-f1/blob/main/TERMS.md',
      'https://github.com/jolpica/jolpica-f1/blob/main/docs/rate_limits.md',
    ],
  },
  {
    sourceId: 'fia-document-metadata',
    name: 'Operator-reviewed FIA document metadata',
    category: 'OFFICIAL_DOCUMENT_METADATA',
    rightsStatus: 'REVIEW_REQUIRED',
    defaultUse: 'DISABLED',
    networkAccess: false,
    publicationAllowed: false,
    evidence: 'Metadata-only review interface; documents are neither scraped nor mirrored.',
    eligibility: {
      observation: 'REVIEW_REQUIRED',
      storage: 'REVIEW_REQUIRED',
      publicRedistribution: 'PROHIBITED_WITHOUT_PERMISSION',
      commercialUse: 'PROHIBITED_WITHOUT_PERMISSION',
    },
    evidenceUrls: ['https://api.fia.com/file/25107/download'],
  },
];

export function requireObservationPermission(input: {
  sourceId: string;
  permissionPath: string | undefined;
  manuallyAuthorized: boolean;
}): ObservationPermission {
  const source = observationSourceRegistry.find((item) => item.sourceId === input.sourceId);
  if (!source || !source.networkAccess)
    throw new Error(`Unknown network source: ${input.sourceId}`);
  if (!input.manuallyAuthorized)
    throw new Error('Network observation requires --authorize-network-observation');
  if (!input.permissionPath)
    throw new Error('Network observation requires --source-permission <reviewed-json>');
  const raw: unknown = JSON.parse(readFileSync(input.permissionPath, 'utf8'));
  if (!isRecord(raw)) throw new Error('Source permission must be a JSON object');
  const permission = raw as unknown as ObservationPermission;
  if (
    permission.schemaVersion !== 2 ||
    permission.sourceId !== input.sourceId ||
    permission.permission !== 'MANUAL_NETWORK_OBSERVATION_APPROVED' ||
    !permission.scope ||
    !permission.evidenceReference ||
    typeof permission.providerAuthorizationReference !== 'string' ||
    !permission.providerAuthorizationReference.startsWith('https://') ||
    permission.acknowledgement !== 'LOCAL_RECORD_IS_NOT_PROVIDER_AUTHORIZATION' ||
    !permission.approvedBy ||
    !validUtc(permission.reviewedAtUtc)
  ) {
    throw new Error('Source permission is incomplete or does not authorize this source');
  }
  return permission;
}

function validUtc(value: string): boolean {
  return typeof value === 'string' && value.endsWith('Z') && Number.isFinite(Date.parse(value));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}
