import { Capacitor } from '@capacitor/core';
import { createWorker, OEM, PSM, type ImageLike, type LoggerMessage, type Page, type Worker } from 'tesseract.js';
import { withTimeout } from '../async/withTimeout';

export interface OcrProgress {
  status: string;
  progress: number;
}

let activeProgress: ((progress: OcrProgress) => void) | undefined;
let workerPromise: Promise<Worker> | undefined;

function assetUrl(path: string): string {
  return new URL(path, document.baseURI).href;
}

async function createLocalWorker(): Promise<Worker> {
  const worker = await createWorker('eng', OEM.LSTM_ONLY, {
    workerPath: assetUrl('ocr/worker.min.js'),
    corePath: assetUrl('ocr/core'),
    langPath: assetUrl('ocr/lang'),
    workerBlobURL: false,
    // Android's APK packager expands .gz assets and removes the suffix.
    gzip: Capacitor.getPlatform() !== 'android',
    logger: (message: LoggerMessage) => activeProgress?.({
      status: message.status,
      progress: message.progress,
    }),
  });
  await worker.setParameters({
    tessedit_pageseg_mode: PSM.AUTO,
    preserve_interword_spaces: '1',
  });
  return worker;
}

async function localWorker(): Promise<Worker> {
  workerPromise ??= withTimeout(createLocalWorker(), 45000, 'OCR could not start within 45 seconds. Please reopen the app and try again.').catch((error) => {
    workerPromise = undefined;
    throw error;
  });
  return workerPromise;
}

export async function recognizeImage(
  image: ImageLike,
  onProgress?: (progress: OcrProgress) => void,
): Promise<Page> {
  activeProgress = onProgress;
  try {
    const worker = await localWorker();
    const result = await worker.recognize(image, {}, { text: true, blocks: true });
    return result.data;
  } finally {
    activeProgress = undefined;
  }
}

export async function terminateOcrWorker(): Promise<void> {
  const current = workerPromise;
  workerPromise = undefined;
  if (current) await (await current).terminate();
}
