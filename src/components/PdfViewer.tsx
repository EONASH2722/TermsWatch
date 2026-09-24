import { X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Util, type PDFDocumentLoadingTask, type RenderTask } from 'pdfjs-dist/legacy/build/pdf.mjs';
import { openPdf } from '../core/pdf/runtime';
import { findMatchingTextItemIndices, type PdfTextItemLike } from '../core/pdf/pdfBlocks';
import type { SourceRegion } from '../types/document';

interface PositionedText {
  id: number;
  text: string;
  left: number;
  top: number;
  width: number;
  height: number;
  highlighted: boolean;
}

interface PdfViewerProps {
  blob: Blob;
  pageNumber: number;
  evidenceText: string;
  sourceRegion?: SourceRegion;
  onClose: () => void;
}

export function PdfViewer({ blob, pageNumber, evidenceText, sourceRegion, onClose }: PdfViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const highlightRef = useRef<HTMLSpanElement>(null);
  const [texts, setTexts] = useState<PositionedText[]>([]);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [error, setError] = useState('');

  useEffect(() => {
    if (texts.some((t) => t.highlighted) || sourceRegion) {
      const timer = window.setTimeout(() => {
        highlightRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
      }, 120);
      return () => window.clearTimeout(timer);
    }
  }, [texts, sourceRegion]);

  useEffect(() => {
    let cancelled = false;
    let task: PDFDocumentLoadingTask | undefined;
    let renderTask: RenderTask | undefined;
    setError(''); setTexts([]);
    const render = async () => {
      try {
        const bytes = new Uint8Array(await blob.arrayBuffer());
        if (cancelled) return;
        task = openPdf(bytes);
        const pdf = await task.promise;
        const page = await pdf.getPage(Math.min(pageNumber, pdf.numPages));
        const viewport = page.getViewport({ scale: 1.25 });
        const canvas = canvasRef.current;
        if (!canvas || cancelled) return;
        const context = canvas.getContext('2d');
        if (!context) throw new Error('Canvas rendering is not available.');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        setSize({ width: viewport.width, height: viewport.height });
        renderTask = page.render({ canvas, canvasContext: context, viewport });
        await renderTask.promise;

        if (sourceRegion) {
          setTexts([]);
          return;
        }

        const content = await page.getTextContent();
        const items = content.items.filter((item): item is typeof item & PdfTextItemLike => 'str' in item);
        const matches = findMatchingTextItemIndices(items, evidenceText);
        if (!cancelled) {
          setTexts(items.map((item, index) => {
            const transform = Util.transform(viewport.transform, item.transform);
            const height = Math.max(8, Math.hypot(transform[2], transform[3]));
            return {
              id: index,
              text: item.str,
              left: transform[4],
              top: transform[5] - height,
              width: Math.max(2, (item.width ?? 1) * viewport.scale),
              height,
              highlighted: matches.has(index),
            };
          }));
        }
      } catch (cause) {
        if (!cancelled) setError(cause instanceof Error ? cause.message : 'Could not render this PDF page.');
      }
    };
    void render();
    return () => { cancelled = true; renderTask?.cancel(); void task?.destroy(); };
  }, [blob, evidenceText, pageNumber, sourceRegion]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-ink/95 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label={`PDF source on page ${pageNumber}`}>
      <div className="flex items-center justify-between border-b border-line px-4 py-3">
        <div>
          <p className="text-xs font-semibold text-white">Verified PDF source</p>
          <p className="mt-0.5 text-[10px] text-muted">Page {pageNumber}</p>
        </div>
        <button type="button" onClick={onClose} aria-label="Close PDF source" className="rounded-lg p-2 text-muted hover:bg-raised hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan">
          <X className="size-4" />
        </button>
      </div>
      <div className="flex-1 overflow-auto p-3">
        {error ? (
          <div className="rounded-xl border border-rose-400/25 bg-rose-400/5 p-4 text-xs text-rose-200">{error}</div>
        ) : (
          <div className="mx-auto overflow-hidden rounded-lg bg-white shadow-2xl" style={{ position: 'relative', width: size.width || '100%', height: size.height || 480 }}>
            <canvas ref={canvasRef} className="block" />
            <div className="pointer-events-none absolute inset-0" aria-hidden="true">
              {texts.filter((text) => text.highlighted).map((text, idx) => (
                <span
                  key={text.id}
                  ref={idx === 0 && !sourceRegion ? highlightRef : undefined}
                  title={text.text}
                  className="absolute rounded-sm bg-cyan/45 ring-1 ring-cyan"
                  style={{ left: text.left, top: text.top, width: text.width, height: text.height }}
                />
              ))}
              {sourceRegion && (
                <span
                  ref={highlightRef}
                  className="absolute rounded-sm bg-cyan/35 ring-2 ring-cyan"
                  style={{
                    left: `${(sourceRegion.x / sourceRegion.sourceWidth) * 100}%`,
                    top: `${(sourceRegion.y / sourceRegion.sourceHeight) * 100}%`,
                    width: `${(sourceRegion.width / sourceRegion.sourceWidth) * 100}%`,
                    height: `${(sourceRegion.height / sourceRegion.sourceHeight) * 100}%`,
                  }}
                />
              )}
            </div>
          </div>
        )}
      </div>
      <div className="border-t border-line bg-panel px-4 py-3">
        <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-cyan">Highlighted source</p>
        <p className="mt-1.5 max-h-20 overflow-auto text-[11px] leading-relaxed text-slate-300">“{evidenceText}”</p>
      </div>
    </div>
  );
}
