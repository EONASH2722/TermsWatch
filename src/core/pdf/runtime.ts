import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist/legacy/build/pdf.mjs';
import PdfWorker from 'pdfjs-dist/legacy/build/pdf.worker.min.mjs?worker';

// Supply the packaged worker directly: PDF.js otherwise uses a blob wrapper
// for extension origins, which is incompatible with MV3's strict script policy.
export function openPdf(data: Uint8Array) {
  GlobalWorkerOptions.workerPort ??= new PdfWorker();
  return getDocument({ data });
}
