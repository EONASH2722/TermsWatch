import { describe, expect, it } from 'vitest';
import { documentText, normalizeForHash, normalizeText, sha256 } from './normalize';

describe('text normalization', () => {
  it('collapses legal-document whitespace without changing words', () => {
    expect(normalizeText('  We\u00a0may\n share   data. ')).toBe('We may share data.');
    expect(normalizeForHash('Terms  ( updated ) ;')).toBe('Terms (updated);');
  });

  it('creates stable hashes for whitespace-equivalent content', async () => {
    await expect(sha256('We may share data.')).resolves.toBe(await sha256(' We   may\nshare data. '));
  });

  it('joins blocks in document order', () => {
    expect(documentText([{ text: 'First' }, { text: 'Second' }])).toBe('First\n\nSecond');
  });
});
