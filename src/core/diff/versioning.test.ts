import { describe, expect, it } from 'vitest';
import { compareContentHashes, getVersionStatus } from './versioning';

describe('policy version detection', () => {
  it('detects a changed hash and keeps the previous version id', () => {
    expect(getVersionStatus('new', { id: 'old-record', contentHash: 'old' })).toEqual({
      changed: true,
      previousVersionId: 'old-record',
    });
  });

  it('does not flag first scans or unchanged hashes', () => {
    expect(compareContentHashes('same')).toBe(false);
    expect(compareContentHashes('same', 'same')).toBe(false);
  });
});
