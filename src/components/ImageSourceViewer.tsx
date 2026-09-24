import { X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { SourceRegion } from '../types/document';

interface ImageSourceViewerProps {
  blob: Blob;
  evidenceText: string;
  region?: SourceRegion;
  onClose: () => void;
}

export function ImageSourceViewer({ blob, evidenceText, region, onClose }: ImageSourceViewerProps) {
  const [source, setSource] = useState('');
  const regionRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const url = URL.createObjectURL(blob);
    setSource(url);
    return () => URL.revokeObjectURL(url);
  }, [blob]);

  useEffect(() => {
    if (source && region) {
      const timer = window.setTimeout(() => {
        regionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
      }, 100);
      return () => window.clearTimeout(timer);
    }
  }, [source, region]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-ink/95 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Image source">
      <div className="flex items-center justify-between border-b border-line px-4 py-3">
        <div>
          <p className="text-xs font-semibold text-white">Verified image source</p>
          <p className="mt-0.5 text-[10px] text-muted">OCR can make mistakes. Compare the excerpt with the original.</p>
        </div>
        <button type="button" onClick={onClose} aria-label="Close image source" className="rounded-lg p-2 text-muted hover:bg-raised hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan">
          <X className="size-4" />
        </button>
      </div>
      <div className="flex-1 overflow-auto p-3">
        <div className="relative mx-auto w-fit max-w-full overflow-hidden rounded-lg bg-white shadow-2xl">
          {source && <img src={source} alt="Uploaded document" className="block h-auto max-w-full" />}
          {region && (
            <span
              ref={regionRef}
              className="pointer-events-none absolute rounded-sm bg-cyan/35 ring-2 ring-cyan"
              style={{
                left: `${(region.x / region.sourceWidth) * 100}%`,
                top: `${(region.y / region.sourceHeight) * 100}%`,
                width: `${(region.width / region.sourceWidth) * 100}%`,
                height: `${(region.height / region.sourceHeight) * 100}%`,
              }}
              aria-hidden="true"
            />
          )}
        </div>
      </div>
      <div className="border-t border-line bg-panel px-4 py-3">
        <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-cyan">Highlighted source</p>
        <p className="mt-1.5 max-h-20 overflow-auto text-[11px] leading-relaxed text-slate-300">“{evidenceText}”</p>
      </div>
    </div>
  );
}
