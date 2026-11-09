import identity from './asset-identity.json';
import type { QualityProfile } from './types';

const hashed = (file: string) => `/__itm-i2/${identity.namespace}/${file}`;

export const ASSET_URLS: Record<QualityProfile, string> = {
  HIGH: hashed(identity.assets.HIGH.file),
  BALANCED: hashed(identity.assets.BALANCED.file),
  PERFORMANCE: hashed(identity.assets.PERFORMANCE.file),
};

export const MANIFEST_URL = hashed(identity.assets.manifest.file);
export const POSTER_URL = hashed(identity.assets.poster.file);
