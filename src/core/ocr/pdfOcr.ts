import { openPdf } from '../pdf/runtime';
import type { DocumentBlock } from '../../types/document';
import { buildOcrBlocks } from './ocrBlocks';
import { recognizeImage, type OcrProgress } from './ocrService';

export const MAX_OCR_PDF_PAGES = 20;

interface PdfOcrProgress extends OcrProgress {
  page: number;
  pageIndex: number;
  pageTotal: number;
}

export async function ocrPdfPages(
  file: File | Blob,
  pages: number[],
  onProgress?: (progress: PdfOcrProgress) => void,
): Promise<DocumentBlock[]> {
  if (pages.length > MAX_OCR_PDF_PAGES) {
    throw new Error(`This PDF has ${pages.length} scanned pages. On-device OCR currently supports up to ${MAX_OCR_PDF_PAGES} pages at a time.`);
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const loadingTask = openPdf(bytes);
  const blocks: DocumentBlock[] = [];
  try {
  const pdf = await loadingTask.promise;
  for (let index = 0; index < pages.length; index += 1) {
    const pageNumber = pages[index];
    const page = await pdf.getPage(pageNumber);
    const viewport = page.getViewport({ scale: 2 });
    if (viewport.width * viewport.height > 30_000_000) throw new Error('This PDF page is too large to OCR safely. Resize or export it at a lower resolution.');
    const canvas = document.createElement('canvas');
    canvas.width = Math.ceil(viewport.width);
    canvas.height = Math.ceil(viewport.height);
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Canvas rendering is unavailable, so this scanned PDF cannot be read.');
    await page.render({ canvas, canvasContext: context, viewport }).promise;

    const data = await recognizeImage(canvas, (progress) => onProgress?.({
      ...progress,
      page: pageNumber,
      pageIndex: index + 1,
      pageTotal: pages.length,
    }));
    blocks.push(...buildOcrBlocks(data, {
      page: pageNumber,
      orderOffset: blocks.length,
      sourceLabel: `Scanned page ${pageNumber}`,
      sourceWidth: canvas.width,
      sourceHeight: canvas.height,
    }));
    canvas.width = 0;
    canvas.height = 0;
    page.cleanup();
  }

  return blocks;
  } finally { await loadingTask.destroy(); }
}
