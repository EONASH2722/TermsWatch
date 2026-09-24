import { openPdf } from './runtime';
import type { DocumentBlock } from '../../types/document';
import { buildPdfBlocksFromItems, type PdfTextItemLike } from './pdfBlocks';

export interface PdfExtractionResult {
  title: string;
  blocks: DocumentBlock[];
  pageCount: number;
  emptyPages: number[];
}

export async function extractPdf(
  file: File | Blob,
  onProgress?: (completed: number, total: number) => void,
): Promise<PdfExtractionResult> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  const loadingTask = openPdf(bytes);
  const blocks: DocumentBlock[] = [];
  const emptyPages: number[] = [];
  try {
  const pdf = await loadingTask.promise;
  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const content = await page.getTextContent();
    const items: PdfTextItemLike[] = content.items
      .filter((item) => 'str' in item)
      .map((item) => ({
        str: item.str,
        transform: item.transform,
        width: item.width,
        height: item.height,
      }));
    const pageBlocks = buildPdfBlocksFromItems(pageNumber, items, blocks.length);
    if (pageBlocks.length === 0) emptyPages.push(pageNumber);
    blocks.push(...pageBlocks);
    onProgress?.(pageNumber, pdf.numPages);
  }

  const fileName = file instanceof File ? file.name : 'PDF document';
  const metadata = await pdf.getMetadata().catch(() => undefined);
  const info = metadata?.info as { Title?: string } | undefined;
  const result = {
    title: info?.Title?.trim() || fileName.replace(/\.pdf$/i, '') || 'PDF document',
    blocks,
    pageCount: pdf.numPages,
    emptyPages,
  };
  return result;
  } finally { await loadingTask.destroy(); }
}
