import { useState } from 'react';
import { ArrowLeft, FileText } from 'lucide-react';
import { MAX_PASTED_CHARACTERS } from '../core/extraction/plainText';

export function PasteTextView({ onAnalyze, onBack }: { onAnalyze: (text: string, title: string) => void; onBack: () => void }) {
  const [text, setText] = useState('');
  const [title, setTitle] = useState('');
  const tooLong = text.length > MAX_PASTED_CHARACTERS;
  return <main className="px-5 py-6">
    <button type="button" className="mb-5 flex items-center gap-1.5 text-xs text-muted hover:text-cyan" onClick={onBack}><ArrowLeft className="size-4" />Back to Home</button>
    <h1 className="text-xl font-semibold">Paste document text</h1>
    <p id="paste-help" className="mt-2 text-xs leading-relaxed text-muted">Copy the terms or privacy policy you want to understand. Analysis runs in this browser; your text is not uploaded.</p>
    <form className="mt-5 space-y-4" onSubmit={(event) => { event.preventDefault(); if (text.trim() && !tooLong) onAnalyze(text, title.trim() || 'Pasted document'); }}>
      <div><label htmlFor="paste-title" className="mb-2 block text-xs font-semibold text-slate-300">Document title (optional)</label>
        <input id="paste-title" maxLength={160} value={title} onChange={(event) => setTitle(event.target.value)} placeholder="e.g. My subscription terms" className="w-full rounded-xl border border-line bg-panel p-3 text-sm text-white placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-cyan" /></div>
      <div><label htmlFor="paste-text" className="mb-2 block text-xs font-semibold text-slate-300">Document text</label>
        <textarea id="paste-text" aria-describedby="paste-help paste-count" aria-invalid={tooLong} rows={11} value={text} onChange={(event) => setText(event.target.value)} placeholder="Paste the actual document text here, not just its URL…" className="w-full resize-y rounded-xl border border-line bg-panel p-3 text-sm leading-relaxed text-white placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-cyan" />
        <p id="paste-count" className={`mt-2 text-[11px] ${tooLong ? 'text-rose-200' : 'text-muted'}`}>{text.length.toLocaleString()} / 500,000 characters{tooLong ? ' — shorten the text to continue.' : ''}</p></div>
      <button disabled={!text.trim() || tooLong} className="action-button action-button-primary disabled:opacity-50"><FileText className="size-5" />Analyze text</button>
    </form>
  </main>;
}
