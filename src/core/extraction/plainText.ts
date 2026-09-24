import { normalizeText } from './normalize';
import type { DocumentBlock } from '../../types/document';

export const MAX_PASTED_CHARACTERS = 500_000;

export function extractPlainText(text: string, sourceLabel = 'Shared text'): DocumentBlock[] {
  if (text.length > MAX_PASTED_CHARACTERS) throw new Error('Text is too long. Use at most 500,000 characters or import a document instead.');
  const blocks = text.split(/\n\s*\n|\n/).map(normalizeText).filter(Boolean)
    .map((value, order) => ({ id: `shared-${order}`, text: value, order, sourceLabel }));
  if (!blocks.length) throw new Error('Paste some document text to begin.');
  return blocks;
}
