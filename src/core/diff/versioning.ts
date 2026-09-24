import type { DocumentRecord } from '../../types/document';

export interface VersionStatus {
  changed: boolean;
  previousVersionId?: string;
}

export function compareContentHashes(currentHash: string, previousHash?: string): boolean {
  return Boolean(previousHash && currentHash !== previousHash);
}

export function getVersionStatus(
  currentHash: string,
  previous?: Pick<DocumentRecord, 'id' | 'contentHash'>,
): VersionStatus {
  return {
    changed: compareContentHashes(currentHash, previous?.contentHash),
    previousVersionId: previous?.id,
  };
}
