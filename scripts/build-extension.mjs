import { build as bundle } from 'esbuild';
import { build as viteBuild } from 'vite';
import { copyFile, mkdir } from 'node:fs/promises';

await viteBuild();

await bundle({
  entryPoints: {
    background: 'src/background/index.ts',
    content: 'src/content/index.ts',
  },
  outdir: 'dist',
  bundle: true,
  format: 'iife',
  platform: 'browser',
  target: 'chrome116',
  sourcemap: false,
  minify: true,
  logLevel: 'info',
});

await mkdir('dist/ocr/core', { recursive: true });
await mkdir('dist/ocr/lang', { recursive: true });
await copyFile('node_modules/tesseract.js/dist/worker.min.js', 'dist/ocr/worker.min.js');
for (const file of [
  'tesseract-core-lstm.wasm.js',
  'tesseract-core-simd-lstm.wasm.js',
  'tesseract-core-relaxedsimd-lstm.wasm.js',
]) {
  await copyFile(`node_modules/tesseract.js-core/${file}`, `dist/ocr/core/${file}`);
}
await copyFile(
  'node_modules/@tesseract.js-data/eng/4.0.0_best_int/eng.traineddata.gz',
  'dist/ocr/lang/eng.traineddata.gz',
);

await mkdir('dist/ort', { recursive: true });
for (const file of [
  'ort-wasm-simd-threaded.mjs', 'ort-wasm-simd-threaded.wasm',
  'ort-wasm-simd-threaded.jsep.mjs', 'ort-wasm-simd-threaded.jsep.wasm',
]) await copyFile(`node_modules/onnxruntime-web/dist/${file}`, `dist/ort/${file}`);

await mkdir('dist/licenses', { recursive: true });
for (const [name, source] of [
  ['react', 'react/LICENSE'], ['react-dom', 'react-dom/LICENSE'],
  ['lucide-react', 'lucide-react/LICENSE'], ['idb', 'idb/LICENSE'],
  ['pdfjs', 'pdfjs-dist/LICENSE'], ['transformers-js', '@huggingface/transformers/LICENSE'],
  ['tesseract-js', 'tesseract.js/LICENSE.md'], ['tesseract-core', 'tesseract.js-core/LICENSE'],
  ['tesseract-worker-notices', 'tesseract.js/dist/worker.min.js.LICENSE.txt'],
  ['capacitor-core', '@capacitor/core/LICENSE'], ['capacitor-android', '@capacitor/android/LICENSE'],
  ['capacitor-camera', '@capacitor/camera/LICENSE'],
]) await copyFile(`node_modules/${source}`, `dist/licenses/${name}.txt`);
