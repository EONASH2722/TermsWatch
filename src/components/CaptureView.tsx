import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Camera, ImagePlus, Trash2 } from 'lucide-react';
import { captureDocumentImage, isAndroid } from '../services/platform';

export function CaptureView({ onAnalyze, onBack }: { onAnalyze: (files: File[]) => void; onBack?: () => void }) {
  const [pages, setPages] = useState<Array<{ file: File; url: string }>>([]);
  const urls = useRef<string[]>([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => () => { urls.current.forEach((url) => URL.revokeObjectURL(url)); }, []);
  function add(file: File) {
    const url = URL.createObjectURL(file); urls.current.push(url);
    setPages((current) => current.length < 20 ? [...current, { file, url }] : current);
  }
  async function capture() {
    if (!isAndroid()) { input.current?.click(); return; }
    setBusy(true); setError('');
    try { add(await captureDocumentImage()); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Camera unavailable. Choose an image instead.'); }
    finally { setBusy(false); }
  }
  return <main className="px-5 py-6">
    {onBack && <button type="button" className="mb-4 flex items-center gap-1.5 text-xs text-muted hover:text-cyan" onClick={onBack}><ArrowLeft className="size-4" />Back to Home</button>}
    <h1 className="text-xl font-semibold">Scan paper document</h1><p className="mt-2 text-xs leading-relaxed text-muted">Photograph each page in good light. Keep the text flat and in focus.</p>
    <button disabled={busy || pages.length >= 20} onClick={() => void capture()} className="action-button action-button-primary mt-5"><Camera className="size-5" />{busy ? 'Opening camera…' : pages.length ? 'Capture another page' : 'Capture page 1'}</button>
    <button disabled={pages.length >= 20} onClick={() => input.current?.click()} className="action-button mt-3"><ImagePlus className="size-5" />Choose document images</button>
    <input ref={input} aria-label="Choose captured document images" aria-hidden="true" tabIndex={-1} type="file" className="sr-only" accept="image/png,image/jpeg,image/webp,image/bmp" multiple onChange={(event) => { [...(event.target.files ?? [])].slice(0, 20 - pages.length).forEach(add); event.target.value = ''; }} />
    {error && <p role="alert" className="mt-3 text-xs text-rose-200">{error}</p>}
    <div className="mt-5 space-y-3">{pages.map((page, index) => <div key={page.url} className="flex items-center gap-3 rounded-xl border border-line bg-panel p-3"><img alt={`Captured page ${index + 1}`} src={page.url} className="h-16 w-12 rounded object-cover" /><span className="flex-1 text-xs">Captured page {index + 1} ✓</span><button aria-label={`Remove page ${index + 1}`} onClick={() => { URL.revokeObjectURL(page.url); setPages((current) => current.filter((item) => item !== page)); }} className="p-2 text-muted hover:text-rose-200"><Trash2 className="size-4" /></button></div>)}</div>
    {pages.length > 0 && <button className="action-button action-button-primary mt-5" onClick={() => onAnalyze(pages.map((page) => page.file))}>Analyze {pages.length} {pages.length === 1 ? 'page' : 'pages'}</button>}
  </main>;
}
