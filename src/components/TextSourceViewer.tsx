import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import type { AnswerSource, DocumentRecord } from '../types/document';

export function TextSourceViewer({ record, source, onClose }: { record: DocumentRecord; source: AnswerSource; onClose: () => void }) {
  const selected = useRef<HTMLElement>(null);
  useEffect(() => { selected.current?.scrollIntoView({ block: 'center' }); }, []);
  return <div className="fixed inset-0 z-50 flex flex-col bg-ink" role="dialog" aria-modal="true" aria-label="Document source">
    <div className="flex items-center justify-between border-b border-line p-4"><div><h2 className="text-sm font-semibold">{record.title}</h2><p className="mt-1 text-[10px] text-muted">{record.type === 'demo' ? 'Built-in demo document' : 'Saved source snapshot'}</p></div><button aria-label="Close source" onClick={onClose} className="rounded-lg p-2 hover:bg-raised"><X className="size-5" /></button></div>
    <div className="flex-1 space-y-5 overflow-auto px-5 py-6">{record.blocks.map((block) => {
      const index = block.id === source.sourceBlockId ? block.text.indexOf(source.evidenceText) : -1;
      return <section key={block.id} ref={index >= 0 ? selected : undefined} className="scroll-mt-5">
        {block.heading && <h3 className="mb-2 text-xs font-semibold text-cyan">{block.heading}</h3>}
        <p className="text-sm leading-relaxed text-slate-300">{index >= 0 ? <>{block.text.slice(0, index)}<mark className="rounded bg-cyan/25 text-white ring-1 ring-cyan">{source.evidenceText}</mark>{block.text.slice(index + source.evidenceText.length)}</> : block.text}</p>
      </section>;
    })}</div>
    <p className="border-t border-line p-4 text-xs text-cyan">{source.sourceLocation}</p>
  </div>;
}
