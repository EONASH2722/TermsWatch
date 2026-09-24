import type { AnalysisResult, DocumentBlock } from '../../types/document';
import { ANALYSIS_VERSION, analyzeDocument, fallbackProvider } from '../../ai';
import { sourceLocation } from '../evidence/location';
import { verifyFinding } from '../evidence/verify';
import { readAnalysisCache, writeAnalysisCache } from '../storage/db';
import { withTimeout } from '../async/withTimeout';

export function analysisCacheKey(contentHash: string, version = ANALYSIS_VERSION, modelVersion = fallbackProvider.version) {
  return `${contentHash}:${version}:${modelVersion}`;
}
export async function analyzeWithCache(contentHash: string, blocks: DocumentBlock[], force = false, storageTimeoutMs = 1500): Promise<AnalysisResult & { cacheHit: boolean }> {
  const key = analysisCacheKey(contentHash);
  let cacheAvailable = true;
  try {
    const cached = force ? undefined : await withTimeout(readAnalysisCache(key), storageTimeoutMs, 'Local analysis cache did not respond.');
    if (cached) {
      const findings = cached.entries.map(({ finding, sourceText }) => {
        const block = blocks.find((candidate) => candidate.text === sourceText);
        if (!block || block.heading === block.text) return undefined;
        return verifyFinding({ ...finding, id: `cached-${block.id}-${finding.category}`, sourceBlockId: block.id, sourceLocation: sourceLocation(block) }, blocks);
      }).filter((finding) => finding !== undefined);
      if (findings.length === cached.entries.length && findings.every((finding) => finding.verification.status === 'verified')) {
        return { findings, summary: cached.summary.slice(0, 5), cacheHit: true };
      }
    }
  } catch { cacheAvailable = false; }
  const result = await analyzeDocument(blocks);
  if (cacheAvailable) {
    try {
      await withTimeout(writeAnalysisCache({ key, createdAt: new Date().toISOString(), summary: result.summary, entries: result.findings.map((finding) => ({ finding, sourceText: blocks.find((block) => block.id === finding.sourceBlockId)!.text })) }), storageTimeoutMs, 'Local analysis cache did not respond.');
    } catch { /* A full or stalled cache must not discard the result. */ }
  }
  return { ...result, cacheHit: false };
}
