import type { DocumentBlock, DocumentRecord } from '../types/document';
import { extractPdf } from '../core/pdf/pdfService';
import { ocrPdfPages } from '../core/ocr/pdfOcr';
import { averageOcrConfidence, buildOcrBlocks } from '../core/ocr/ocrBlocks';
import { recognizeImage } from '../core/ocr/ocrService';
import { extractPlainText } from '../core/extraction/plainText';
import { scanWebDocument } from '../core/extraction/web';
import { ShareInbox } from './platform';

export type NewDocument = Pick<DocumentRecord, 'type' | 'title' | 'blocks'> & Partial<Pick<DocumentRecord, 'url' | 'fileName' | 'pdfBlob' | 'imageBlob' | 'capturedImages' | 'ocr'>>;
type Progress = (message: string) => void;
const MAX_FILE_SIZE = 25 * 1024 * 1024;
export function checkFile(file: File) {
  if (file.size > MAX_FILE_SIZE) throw new Error('Choose a file smaller than 25 MB for this release.');
}
export async function readPdf(file: File, progress: Progress): Promise<NewDocument> {
  checkFile(file);
  progress('Extracting PDF text…');
  const extracted = await extractPdf(file, (page, total) => progress(`Reading PDF page ${page} of ${total}…`));
  const ocrBlocks = extracted.emptyPages.length ? await ocrPdfPages(file, extracted.emptyPages, ({ page, progress: value }) => progress(`Reading scanned page ${page} · ${Math.round(value * 100)}%…`)) : [];
  const blocks = [...extracted.blocks, ...ocrBlocks].sort((a, b) => (a.page ?? 0) - (b.page ?? 0) || a.order - b.order).map((block, order) => ({ ...block, order }));
  if (!blocks.length) throw new Error('No readable text was found. Try a clearer, higher-resolution document.');
  return { type: 'pdf', title: extracted.title, blocks, fileName: file.name, pdfBlob: file, ocr: ocrBlocks.length ? { language: 'eng', confidence: averageOcrConfidence(ocrBlocks), sourceKind: 'scanned_pdf', pagesProcessed: extracted.emptyPages.length } : undefined };
}
export async function readImages(files: File[], captured: boolean, progress: Progress): Promise<NewDocument> {
  if (!files.length || files.length > 20) throw new Error('Choose between 1 and 20 document images.');
  if (files.reduce((total, file) => total + file.size, 0) > 50 * 1024 * 1024) throw new Error('Choose at most 50 MB of document images at a time.');
  const blocks: DocumentBlock[] = [];
  for (let index = 0; index < files.length; index += 1) {
    const file = files[index]; checkFile(file);
    if (!/\.(png|jpe?g|webp|bmp)$/i.test(file.name) && !/^image\/(png|jpeg|webp|bmp)$/.test(file.type)) throw new Error('Choose a PNG, JPEG, WebP, or BMP image.');
    const bitmap = await createImageBitmap(file);
    const { width, height } = bitmap; bitmap.close();
    if (width * height > 30_000_000) throw new Error('This image is too large. Resize it below 30 megapixels.');
    const data = await recognizeImage(file, ({ progress: value }) => progress(`Reading image ${index + 1} of ${files.length} · ${Math.round(value * 100)}%…`));
    const pageBlocks = buildOcrBlocks(data, { page: captured ? index + 1 : undefined, orderOffset: blocks.length, sourceLabel: captured ? `Captured Page ${index + 1}` : file.name, sourceWidth: width, sourceHeight: height });
    if (!pageBlocks.length) throw new Error(`No readable text on image ${index + 1}. Retake this page in better light.`);
    blocks.push(...pageBlocks.map((block) => ({ ...block, capturedPage: captured ? index + 1 : undefined })));
  }
  return { type: captured ? 'capture' : 'image', title: captured ? `Captured document · ${files.length} ${files.length === 1 ? 'page' : 'pages'}` : files[0].name.replace(/\.[^.]+$/, ''), blocks, imageBlob: captured ? undefined : files[0], capturedImages: captured ? files : undefined, fileName: captured ? undefined : files[0].name, ocr: { language: 'eng', confidence: averageOcrConfidence(blocks), sourceKind: 'image', pagesProcessed: files.length } };
}
export function readSharedText(text: string): NewDocument {
  return { type: 'text', title: 'Shared document text', blocks: extractPlainText(text) };
}
export async function readSharedUrl(url: string, progress: Progress): Promise<NewDocument> {
  const parsed = new URL(url);
  if (!['https:', 'http:'].includes(parsed.protocol)) throw new Error('Only public HTTP or HTTPS links can be opened.');
  progress('Retrieving the shared webpage…');
  const response = await ShareInbox.fetchPage({ url: parsed.href });
  const doc = new DOMParser().parseFromString(response.html, 'text/html');
  const scan = scanWebDocument(doc);
  if (scan.blocks.filter((block) => block.text !== block.heading).reduce((sum, block) => sum + block.text.length, 0) < 120) throw new Error('This webpage did not provide readable document text. It may require sign-in or JavaScript. Share selected text, a PDF, or a screenshot instead.');
  return { type: 'web', title: scan.title, url: response.url, blocks: scan.blocks };
}
