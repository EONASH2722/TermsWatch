import { expect, it } from 'vitest';
import { sourceLocation } from './location';
import { verifyEvidence } from './verify';
import type { DocumentBlock } from '../../types/document';

it('keeps captured-page and original OCR coordinates attached to verified evidence after serialization', () => {
  const source: DocumentBlock = { id: 'ocr-page-2-7', order: 6, text: 'You must provide notice before cancelling.', page: 2, capturedPage: 2, sourceRegion: { x: 10, y: 60, width: 420, height: 40, sourceWidth: 500, sourceHeight: 700 }, ocrConfidence: 86 };
  const restored = JSON.parse(JSON.stringify(source)) as DocumentBlock;
  expect(sourceLocation(restored)).toContain('Captured Page 2');
  expect(verifyEvidence(restored.id, source.text, [restored]).status).toBe('verified');
  expect(restored.sourceRegion).toEqual(source.sourceRegion);
});
