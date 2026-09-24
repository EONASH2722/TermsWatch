import { Camera, Clock3, FileSearch, Image, ScanText } from 'lucide-react';
import type { DocumentRecord } from '../types/document';

interface HistoryViewProps {
  records: DocumentRecord[];
  onOpen: (record: DocumentRecord) => void;
}

export function HistoryView({ records, onOpen }: HistoryViewProps) {
  return (
    <main className="px-5 py-7">
      <h1 className="text-xl font-semibold text-white">Local history</h1>
      <p className="mt-1 text-xs leading-relaxed text-muted">Your 30 most recent snapshots, stored locally on this device.</p>
      <div className="mt-6 overflow-hidden rounded-2xl border border-line bg-panel/55">
        {records.length ? records.map((record) => {
          const Icon = record.type === 'pdf' ? FileSearch : record.type === 'capture' ? Camera : record.type === 'image' ? Image : ScanText;
          return (
            <button key={record.id} type="button" onClick={() => onOpen(record)} className="flex w-full items-center gap-3 border-b border-line/60 px-4 py-4 text-left last:border-0 hover:bg-raised/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-cyan">
              <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-raised text-cyan"><Icon className="size-4" /></div>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-slate-100">{record.title}</span>
                <span className="mt-1 flex items-center gap-1 text-[10px] text-muted">
                  <Clock3 className="size-3" /> {new Date(record.createdAt).toLocaleString()}
                </span>
              </span>
              {record.changeDetected && <span className="size-2 shrink-0 rounded-full bg-cyan" title="Changed since previous scan" />}
            </button>
          );
        }) : (
          <div className="px-5 py-10 text-center">
            <Clock3 className="mx-auto size-6 text-cyan" />
            <p className="mt-3 text-sm font-semibold text-slate-100">No scans yet</p>
            <p className="mt-1 text-xs text-muted">Scan a page or analyze a PDF or image to begin.</p>
          </div>
        )}
      </div>
    </main>
  );
}
