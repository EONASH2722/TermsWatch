import { ArrowLeft, FileSearch, LockKeyhole, Upload } from 'lucide-react';
import { useRef, useState } from 'react';

interface PdfUploadViewProps {
  onChoose: (file: File) => void;
  onBack?: () => void;
}

export function PdfUploadView({ onChoose, onBack }: PdfUploadViewProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const accept = (files: FileList | null) => {
    const file = files?.[0];
    if (file) onChoose(file);
  };

  return (
    <main className="px-5 py-7">
      {onBack && (
        <button type="button" className="mb-4 flex items-center gap-1.5 text-xs text-muted hover:text-cyan" onClick={onBack}>
          <ArrowLeft className="size-4" />Back to Home
        </button>
      )}
      <div className="flex items-start gap-3">
        <div className="grid size-10 shrink-0 place-items-center rounded-xl border border-cyan/20 bg-cyan/5 text-cyan">
          <FileSearch className="size-5" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-white">Analyze a PDF</h1>
          <p className="mt-1 text-xs leading-relaxed text-muted">Extract clauses, page references, and verifiable source excerpts on this device.</p>
        </div>
      </div>

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragEnter={(event) => { event.preventDefault(); setDragging(true); }}
        onDragOver={(event) => event.preventDefault()}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => { event.preventDefault(); setDragging(false); accept(event.dataTransfer.files); }}
        className={`mt-7 flex min-h-56 w-full flex-col items-center justify-center rounded-2xl border border-dashed px-6 text-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan ${dragging ? 'border-cyan bg-cyan/8' : 'border-line bg-panel/45 hover:border-cyan/50 hover:bg-panel/70'}`}
      >
        <div className="grid size-12 place-items-center rounded-2xl bg-raised text-cyan">
          <Upload className="size-5" />
        </div>
        <span className="mt-4 text-sm font-semibold text-white">Choose or drop a PDF</span>
        <span className="mt-1 text-[11px] text-muted">Text and scanned PDFs are supported · up to 20 OCR pages</span>
      </button>
      <input
        ref={inputRef}
        type="file"
        aria-label="Choose PDF document"
        aria-hidden="true"
        tabIndex={-1}
        accept="application/pdf,.pdf"
        className="sr-only"
        onChange={(event) => { accept(event.target.files); event.target.value = ''; }}
      />

      <div className="mt-5 flex items-start gap-2.5 rounded-xl border border-line bg-panel/45 px-3.5 py-3 text-[11px] leading-relaxed text-muted">
        <LockKeyhole className="mt-0.5 size-3.5 shrink-0 text-cyan" />
        The PDF and its results are stored in your browser’s local IndexedDB. Nothing is uploaded.
      </div>
    </main>
  );
}
