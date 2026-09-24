import { describe, expect, it } from 'vitest';
import { extractPlainText, MAX_PASTED_CHARACTERS } from './plainText';

describe('plain text documents', () => {
  it('keeps paragraph evidence and stable order without rendering pasted HTML', () => {
    const blocks = extractPlainText('  Your subscription renews automatically.\n\nCancel 48 hours before renewal.\n<script>alert(1)</script>', 'Pasted text');
    expect(blocks).toHaveLength(3);
    expect(blocks[0]).toEqual({ id: 'shared-0', text: 'Your subscription renews automatically.', order: 0, sourceLabel: 'Pasted text' });
    expect(blocks[2].text).toBe('<script>alert(1)</script>');
  });
  it('rejects blank and oversized input instead of truncating evidence', () => {
    expect(() => extractPlainText(' \n\t ')).toThrow('Paste some');
    expect(() => extractPlainText('a'.repeat(MAX_PASTED_CHARACTERS + 1))).toThrow('too long');
    expect(extractPlainText('a'.repeat(MAX_PASTED_CHARACTERS))[0].text).toHaveLength(MAX_PASTED_CHARACTERS);
  });
});
