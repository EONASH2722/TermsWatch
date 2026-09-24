import { ArrowRight, Camera, FileSearch, FileText, Image, Puzzle, ScanText, TestTube2, History } from 'lucide-react';
import { useRef } from 'react';
import type { DocumentRecord } from '../types/document';

interface HomeViewProps {
  recent: DocumentRecord[];
  onScan: () => void;
  onPdf: () => void;
  onImage: (file: File) => void;
  onDemo: () => void;
  onCapture: () => void;
  onDiffDemo: () => void;
  android?: boolean;
  website?: boolean;
  onPaste: () => void;
  onInstall: () => void;
  onOpenRecent: (record: DocumentRecord) => void;
}

function recentMeta(record: DocumentRecord): string {
  const pageCount = record.blocks.at(-1)?.page ?? 1;
  let website = 'Webpage';
  if (record.url) {
    try { website = new URL(record.url).hostname || website; }
    catch { /* Older saved scans can contain malformed URLs. */ }
  }
  const source = record.type === 'pdf'
    ? `${pageCount} ${pageCount === 1 ? 'page' : 'pages'}`
    : record.type === 'image'
      ? 'Image · OCR'
      : record.type === 'capture' ? `${record.capturedImages?.length ?? 0} captured ${(record.capturedImages?.length ?? 0) === 1 ? 'page' : 'pages'}`
        : record.type === 'text' ? 'Document text' : record.url ? website : 'Demo';
  const when = new Intl.RelativeTimeFormat('en', { numeric: 'auto' }).format(
    Math.round((new Date(record.createdAt).getTime() - Date.now()) / 86_400_000),
    'day',
  );
  return `${source} · ${when}`;
}

export function HomeView({ recent, onScan, onPdf, onImage, onDemo, onCapture, onDiffDemo, android = false, website = false, onPaste, onInstall, onOpenRecent }: HomeViewProps) {
  const imageInputRef = useRef<HTMLInputElement>(null);

  return (
    <main className="px-5 py-7">
      <h1 className="max-w-[330px] text-[28px] font-semibold leading-[1.12] tracking-[-0.035em] text-white">
        Make sense of the fine print.
      </h1>

      <div className="mt-7 space-y-3">
        <button type="button" onClick={android ? onCapture : website ? onPaste : onScan} className="action-button action-button-primary group">
          {android ? <Camera className="size-5" /> : website ? <FileText className="size-5" /> : <ScanText className="size-5" aria-hidden="true" />}
          <span>{android ? 'Scan Paper Document' : website ? 'Paste document text' : 'Scan current page'}</span>
          <ArrowRight className="ml-auto size-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
        </button>
        <button type="button" onClick={onPdf} className="action-button group">
          <FileSearch className="size-5" aria-hidden="true" />
          <span>{android ? 'Open PDF' : 'Analyze PDF'}</span>
          <ArrowRight className="ml-auto size-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
        </button>
        <button type="button" onClick={() => imageInputRef.current?.click()} className="action-button group">
          <Image className="size-5" aria-hidden="true" />
          <span>{android ? 'Open Image' : 'Analyze image'}</span>
          <ArrowRight className="ml-auto size-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
        </button>
        <input
          ref={imageInputRef}
          type="file"
          aria-label={android ? 'Open Image' : 'Analyze image'}
          aria-hidden="true"
          tabIndex={-1}
          accept="image/png,image/jpeg,image/webp,image/bmp,.png,.jpg,.jpeg,.webp,.bmp"
          className="sr-only"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) onImage(file);
            event.target.value = '';
          }}
        />
      </div>

      {website && <div className="mt-5 text-xs leading-relaxed text-muted"><p>Private, local analysis. No account or API key needed.</p><button onClick={onInstall} className="mt-3 flex items-center gap-2 font-semibold text-cyan hover:underline"><Puzzle className="size-4" />Get the browser extension<ArrowRight className="size-3.5" /></button></div>}

      <section className="mt-8" aria-labelledby="recent-scans-heading">
        <div className="mb-3 flex items-center justify-between">
          <h2 id="recent-scans-heading" className="text-xs font-bold uppercase tracking-[0.16em] text-slate-300">
            Recent scans
          </h2>
          <span className="text-[10px] text-muted">Stored locally</span>
        </div>
        <div className="overflow-hidden rounded-2xl border border-line bg-panel/60">
          {recent.length ? (
            recent.slice(0, 3).map((record) => (
              <button
                key={record.id}
                type="button"
                onClick={() => onOpenRecent(record)}
                className="group flex w-full items-center gap-3 border-b border-line/60 px-4 py-3.5 text-left last:border-b-0 hover:bg-raised/55 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-cyan"
              >
                <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-raised text-cyan">
                  {record.type === 'pdf' ? <FileSearch className="size-4" /> : record.type === 'image' ? <Image className="size-4" /> : record.type === 'capture' ? <Camera className="size-4" /> : <ScanText className="size-4" />}
                </div>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-slate-100">{record.title}</span>
                  <span className="mt-0.5 block truncate text-[11px] text-muted">{recentMeta(record)}</span>
                </span>
                <ArrowRight className="size-4 text-muted transition-transform group-hover:translate-x-0.5 group-hover:text-cyan" />
              </button>
            ))
          ) : (
            <div className="px-4 py-5 text-center text-xs leading-relaxed text-muted">
              Your analyzed pages, PDFs, and images will appear here.
            </div>
          )}
        </div>
      </section>

      <button type="button" onClick={onDemo} className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl border border-cyan/25 px-4 py-3 text-xs font-bold text-cyan transition-colors hover:bg-cyan/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan">
        <TestTube2 className="size-4" aria-hidden="true" />
        Try demo policy
        <ArrowRight className="size-3.5" aria-hidden="true" />
      </button>
      <button type="button" onClick={onDiffDemo} className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-line px-4 py-3 text-xs font-semibold text-muted hover:text-cyan"><History className="size-4" />Try policy-history demo</button>
      {android && <p className="mt-4 text-center text-[11px] leading-relaxed text-muted">From another app, choose Share → TermsWatch to open PDFs, images, text, or a webpage link.</p>}
    </main>
  );
}
