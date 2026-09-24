import { describe, expect, it } from 'vitest';
import { buildPdfBlocksFromItems, findMatchingTextItemIndices } from './pdfBlocks';

describe('PDF block generation', () => {
  it('groups text items into ordered, page-linked blocks', () => {
    const blocks = buildPdfBlocksFromItems(7, [
      { str: 'Automatic Renewal', transform: [1, 0, 0, 18, 40, 720] },
      { str: 'Your subscription renews', transform: [1, 0, 0, 10, 40, 690] },
      { str: 'automatically unless cancelled.', transform: [1, 0, 0, 10, 40, 678] },
    ], 41);
    expect(blocks[0]).toMatchObject({ id: 'pdf-p7-b1', page: 7, order: 41, heading: 'Automatic Renewal' });
    expect(blocks.map((block) => block.text).join(' ')).toContain('automatically unless cancelled.');
  });

  it('maps exact evidence across PDF text items', () => {
    const items = [
      { str: 'We may', transform: [1, 0, 0, 10, 0, 0] },
      { str: 'share data', transform: [1, 0, 0, 10, 0, 0] },
      { str: 'with partners.', transform: [1, 0, 0, 10, 0, 0] },
    ];
    expect([...findMatchingTextItemIndices(items, 'share data with partners.')]).toEqual([1, 2]);
    expect([...findMatchingTextItemIndices(items, 'data with partners.')]).toEqual([1, 2]);
    expect([...findMatchingTextItemIndices(items, 'invented text')]).toEqual([]);
  });
});
