import { describe, expect, it } from 'vitest';
import type { DocumentRecord } from '../../types/document';
import { buildSemanticDiff, diffWords, textSimilarity } from './semantic';

function record(id: string, texts: Array<{ text: string; heading?: string }>): DocumentRecord {
  return {
    id,
    type: 'web',
    title: 'Policy',
    url: 'https://example.com/policy',
    createdAt: new Date().toISOString(),
    contentHash: id,
    blocks: texts.map((item, order) => ({ id: `${id}-${order}`, order, ...item })),
    findings: [],
    summary: [],
    changeDetected: id === 'current',
  };
}

describe('semantic policy diff', () => {
  it('matches a rewritten clause by heading and exposes exact word changes', () => {
    const previous = record('previous', [{ heading: 'Retention', text: 'We keep account data for 30 days.' }]);
    const current = record('current', [{ heading: 'Retention', text: 'We keep account data for 90 days after closure.' }]);
    const diff = buildSemanticDiff(previous, current);
    expect(diff).toMatchObject({ added: 0, removed: 0, modified: 1, unchanged: 0 });
    expect(diff.changes[0].segments.some((segment) => segment.kind === 'removed' && segment.text.includes('30'))).toBe(true);
    expect(diff.changes[0].segments.some((segment) => segment.kind === 'added' && segment.text.includes('90'))).toBe(true);
  });

  it('reports added, removed, and unchanged clauses', () => {
    const previous = record('previous', [
      { heading: 'Shared', text: 'This clause remains exactly the same.' },
      { heading: 'Old', text: 'This older clause is removed from the policy.' },
    ]);
    const current = record('current', [
      { heading: 'Shared', text: 'This clause remains exactly the same.' },
      { heading: 'New', text: 'A brand new cancellation clause was added.' },
    ]);
    expect(buildSemanticDiff(previous, current)).toMatchObject({ added: 1, removed: 1, modified: 0, unchanged: 1 });
  });

  it('keeps diff segments reconstructable from source text', () => {
    const before = 'We retain data for one year.';
    const after = 'We retain account data for two years.';
    const segments = diffWords(before, after);
    expect(segments.filter((segment) => segment.kind !== 'added').map((segment) => segment.text).join('')).toBe(before);
    expect(segments.filter((segment) => segment.kind !== 'removed').map((segment) => segment.text).join('')).toBe(after);
    expect(textSimilarity(before, after)).toBeGreaterThan(0.3);
  });
});
