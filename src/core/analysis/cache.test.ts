import 'fake-indexeddb/auto';
import { describe, it, expect, vi } from 'vitest';
import { analysisCacheKey, analyzeWithCache } from './cache';
import { demoPolicyBlocks } from '../../data/demoPolicy';
import * as storage from '../storage/db';

describe('analysis cache', () => {
  it('isolates analysis and model versions', () => {
    expect(analysisCacheKey('hash', 'a', 'm1')).not.toBe(analysisCacheKey('hash', 'a', 'm2'));
    expect(analysisCacheKey('hash', 'a', 'm1')).not.toBe(analysisCacheKey('hash', 'b', 'm1'));
  });
  it('reuses unchanged text with references rebound to this document and supports force reanalysis', async () => {
    const first = await analyzeWithCache('cache-test', demoPolicyBlocks, true);
    const blocks = demoPolicyBlocks.map((block) => ({ ...block, id: `new-${block.id}`, page: 7 }));
    const reused = await analyzeWithCache('cache-test', blocks);
    expect(first.cacheHit).toBe(false);
    expect(reused.cacheHit).toBe(true);
    expect(reused.findings.every((finding) => finding.sourceBlockId.startsWith('new-') && finding.sourceLocation.includes('Page 7'))).toBe(true);
    expect((await analyzeWithCache('cache-test', blocks, true)).cacheHit).toBe(false);
  });
  it('returns verified rule results when IndexedDB never responds', async () => {
    const read = vi.spyOn(storage, 'readAnalysisCache').mockImplementationOnce(() => new Promise(() => {}));
    const write = vi.spyOn(storage, 'writeAnalysisCache');
    try {
      const result = await analyzeWithCache('storage-stall-test', demoPolicyBlocks, false, 20);
      expect(result.cacheHit).toBe(false);
      expect(result.findings.length).toBeGreaterThan(0);
      expect(result.findings.every((finding) => finding.verification.status === 'verified')).toBe(true);
      expect(write).not.toHaveBeenCalled();
    } finally { read.mockRestore(); write.mockRestore(); }
  });
});
