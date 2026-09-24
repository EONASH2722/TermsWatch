export const MODEL_ID = 'onnx-community/SmolLM2-360M-Instruct-ONNX';
export const MODEL_REVISION = 'fe7c7db4c8921c9e3fa1c65cfd296fb3b1b1a8f9';
export const MODEL_VERSION = `smollm2-360m-q8-${MODEL_REVISION.slice(0, 8)}`;
export const MODEL_DOWNLOAD_MB = 365;
export interface ModelState {
  status: 'off' | 'loading' | 'ready' | 'error';
  progress: number;
  message: string;
}
