import type { DocumentBlock } from '../../types/document';

export function sourceLocation(block: DocumentBlock): string {
  if (block.capturedPage) return `Captured Page ${block.capturedPage} · Paragraph ${block.order + 1}`;
  if (block.page) return `Page ${block.page}${block.heading ? ` · ${block.heading}` : ''}`;
  return `${block.heading || block.sourceLabel || 'Document'} · Paragraph ${block.order + 1}`;
}
