import type { DocumentBlock, SourceRegion } from '../../types/document';
import { normalizeText } from '../extraction/normalize';

interface OcrBox {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

interface OcrParagraph {
  text: string;
  confidence: number;
  bbox: OcrBox;
}

export interface OcrPageData {
  text: string;
  confidence: number;
  blocks: Array<{ paragraphs: OcrParagraph[] }> | null;
}

interface OcrBlockOptions {
  page?: number;
  orderOffset?: number;
  sourceLabel?: string;
  sourceWidth: number;
  sourceHeight: number;
}

function isHeading(text: string): boolean {
  if (text.length < 3 || text.length > 90 || /[.!?]$/.test(text)) return false;
  const letters = text.match(/[\p{L}]/gu) ?? [];
  const capitals = text.match(/[\p{Lu}]/gu) ?? [];
  const words = text.split(/\s+/);
  const titleWords = words.filter((word) => /^\p{Lu}/u.test(word)).length;
  return (letters.length > 0 && capitals.length / letters.length > 0.72)
    || (words.length <= 8 && titleWords / words.length > 0.65);
}

function regionFromBox(box: OcrBox, sourceWidth: number, sourceHeight: number): SourceRegion {
  const x = Math.max(0, Math.min(sourceWidth, box.x0));
  const y = Math.max(0, Math.min(sourceHeight, box.y0));
  return {
    x,
    y,
    width: Math.max(1, Math.min(sourceWidth - x, box.x1 - box.x0)),
    height: Math.max(1, Math.min(sourceHeight - y, box.y1 - box.y0)),
    sourceWidth,
    sourceHeight,
  };
}

export function buildOcrBlocks(data: OcrPageData, options: OcrBlockOptions): DocumentBlock[] {
  const prefix = options.page ? `ocr-p${options.page}` : 'ocr-image';
  const paragraphs = (data.blocks ?? [])
    .flatMap((block) => block.paragraphs ?? [])
    .filter((paragraph) => normalizeText(paragraph.text).length > 0);
  let activeHeading: string | undefined;

  if (paragraphs.length > 0) {
    return paragraphs.map((paragraph, index) => {
      const text = normalizeText(paragraph.text);
      const heading = isHeading(text);
      if (heading) activeHeading = text;
      return {
        id: `${prefix}-b${index + 1}`,
        text,
        order: (options.orderOffset ?? 0) + index,
        heading: heading ? text : activeHeading,
        page: options.page,
        sourceLabel: options.sourceLabel,
        ocrConfidence: paragraph.confidence,
        sourceRegion: regionFromBox(paragraph.bbox, options.sourceWidth, options.sourceHeight),
      };
    });
  }

  return data.text
    .split(/\n\s*\n|\n(?=[A-Z\d])/)
    .map(normalizeText)
    .filter(Boolean)
    .map((text, index) => {
      const heading = isHeading(text);
      if (heading) activeHeading = text;
      return {
        id: `${prefix}-b${index + 1}`,
        text,
        order: (options.orderOffset ?? 0) + index,
        heading: heading ? text : activeHeading,
        page: options.page,
        sourceLabel: options.sourceLabel,
        ocrConfidence: data.confidence,
      };
    });
}

export function averageOcrConfidence(blocks: DocumentBlock[]): number {
  const values = blocks
    .map((block) => block.ocrConfidence)
    .filter((value): value is number => typeof value === 'number');
  if (!values.length) return 0;
  return values.reduce((total, value) => total + value, 0) / values.length;
}
