import type { DocumentBlock } from '../../types/document';
import { normalizeText } from '../extraction/normalize';

export interface PdfTextItemLike {
  str: string;
  transform: number[];
  width?: number;
  height?: number;
}

interface TextLine {
  text: string;
  y: number;
  height: number;
  isHeading: boolean;
}

function median(values: number[]): number {
  if (values.length === 0) return 10;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

function toLines(items: PdfTextItemLike[]): TextLine[] {
  const meaningful = items.filter((item) => normalizeText(item.str));
  const bodyHeight = median(meaningful.map((item) => Math.abs(item.transform[3] || item.height || 10)));
  const rows = new Map<number, PdfTextItemLike[]>();

  meaningful.forEach((item) => {
    const y = item.transform[5] ?? 0;
    const existingKey = [...rows.keys()].find((key) => Math.abs(key - y) <= 2.5);
    const key = existingKey ?? y;
    rows.set(key, [...(rows.get(key) ?? []), item]);
  });

  return [...rows.entries()]
    .sort(([a], [b]) => b - a)
    .map(([y, rowItems]) => {
      const sorted = rowItems.sort((a, b) => (a.transform[4] ?? 0) - (b.transform[4] ?? 0));
      const height = Math.max(...sorted.map((item) => Math.abs(item.transform[3] || item.height || bodyHeight)));
      return {
        text: normalizeText(sorted.map((item) => item.str).join(' ')),
        y,
        height,
        isHeading: height >= bodyHeight * 1.15,
      };
    });
}

export function buildPdfBlocksFromItems(
  page: number,
  items: PdfTextItemLike[],
  startOrder = 0,
): DocumentBlock[] {
  const lines = toLines(items);
  if (lines.length === 0) return [];

  const groups: Array<{ lines: TextLine[]; heading?: string }> = [];
  let current: { lines: TextLine[]; heading?: string } | undefined;
  let activeHeading: string | undefined;

  lines.forEach((line, index) => {
    const previous = lines[index - 1];
    const largeGap = previous ? previous.y - line.y > Math.max(previous.height, line.height) * 1.65 : true;
    if (line.isHeading && line.text.length <= 140) activeHeading = line.text;
    if (!current || largeGap || line.isHeading) {
      current = { lines: [], heading: activeHeading };
      groups.push(current);
    }
    current.lines.push(line);
  });

  return groups
    .map((group) => ({
      text: normalizeText(group.lines.map((line) => line.text).join(' ')),
      heading: group.heading,
    }))
    .filter(({ text }) => text.length >= 3)
    .map(({ text, heading }, index) => ({
      id: `pdf-p${page}-b${index + 1}`,
      page,
      text,
      heading,
      order: startOrder + index,
    }));
}

export function findMatchingTextItemIndices(items: PdfTextItemLike[], evidenceText: string): Set<number> {
  const evidence = normalizeText(evidenceText);
  if (!evidence) return new Set();
  const tokens = items.map((item) => normalizeText(item.str));
  let full = '';
  const ranges = tokens.map((token) => {
    if (full && token) full += ' ';
    const start = full.length;
    full += token;
    return { start, end: full.length };
  });
  const start = full.indexOf(evidence);
  if (start < 0) return new Set();
  const end = start + evidence.length;
  return new Set(ranges.flatMap((range, index) => range.end > start && range.start < end && tokens[index] ? [index] : []));
}
