import { describe, expect, it } from 'vitest';
import { averageOcrConfidence, buildOcrBlocks } from './ocrBlocks';

describe('OCR block conversion', () => {
  it('preserves paragraph regions, confidence, headings, and page references', () => {
    const blocks = buildOcrBlocks({
      text: 'DATA RETENTION\nWe retain data for 90 days.',
      confidence: 89,
      blocks: [{ paragraphs: [
        { text: 'DATA RETENTION', confidence: 94, bbox: { x0: 10, y0: 20, x1: 210, y1: 50 } },
        { text: 'We retain data for 90 days.', confidence: 86, bbox: { x0: 10, y0: 60, x1: 430, y1: 100 } },
      ] }],
    }, { page: 2, sourceWidth: 500, sourceHeight: 700, sourceLabel: 'Scanned page 2' });

    expect(blocks).toHaveLength(2);
    expect(blocks[1]).toMatchObject({
      heading: 'DATA RETENTION',
      page: 2,
      ocrConfidence: 86,
      sourceLabel: 'Scanned page 2',
      sourceRegion: { x: 10, y: 60, width: 420, height: 40, sourceWidth: 500, sourceHeight: 700 },
    });
    expect(averageOcrConfidence(blocks)).toBe(90);
  });

  it('falls back to text when structured OCR output is unavailable', () => {
    const blocks = buildOcrBlocks({ text: 'Cancellation\nYou may cancel at any time.', confidence: 72, blocks: null }, {
      sourceWidth: 800,
      sourceHeight: 600,
    });
    expect(blocks.map((block) => block.text)).toEqual(['Cancellation', 'You may cancel at any time.']);
    expect(blocks.every((block) => block.ocrConfidence === 72)).toBe(true);
  });
});
