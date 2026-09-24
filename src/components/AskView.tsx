import { useState } from 'react';
import { MessageCircle, Send, ShieldCheck } from 'lucide-react';
import { answerDocumentQuestion } from '../ai';
import type { AnswerSource, DocumentAnswer, DocumentRecord } from '../types/document';

const EXAMPLES = ['Does this renew automatically?', 'How do I cancel?', 'Can my information be shared?', 'Who owns content I upload?', 'Is earthquake insurance included?'];
export function AskView({ record, onShowSource, onDemo }: { record?: DocumentRecord; onShowSource: (source: AnswerSource) => void; onDemo: () => void }) {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState<DocumentAnswer>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function ask(value: string) {
    if (!record || busy || !value.trim()) return;
    setQuestion(value); setBusy(true); setAnswer(undefined); setError('');
    try { setAnswer(await answerDocumentQuestion(value.trim(), record.blocks, 15000, record.findings)); }
    catch { setError('The question could not be processed. Please try again.'); }
    finally { setBusy(false); }
  }
  return <main className="px-5 py-6">
    <h1 className="flex items-center gap-2 text-xl font-semibold"><MessageCircle className="size-5 text-cyan" /> Ask TermsWatch</h1>
    <p className="mt-2 text-xs leading-relaxed text-muted">{record ? record.title : 'Open a document or try the demo to ask questions.'}</p>
    {!record ? <button className="action-button mt-6" onClick={onDemo}>Try demo policy</button> : <>
      <form className="mt-5" onSubmit={(event) => { event.preventDefault(); void ask(question); }}>
        <label htmlFor="document-question" className="mb-2 block text-xs font-semibold text-slate-300">Your question</label>
        <textarea
          id="document-question"
          placeholder="Ask this document..."
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault();
              if (!busy && question.trim()) void ask(question);
            }
          }}
          maxLength={500}
          rows={3}
          className="w-full resize-y rounded-xl border border-line bg-panel p-3 text-sm leading-relaxed text-white placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-cyan"
        />
        <button disabled={busy || !question.trim()} className="action-button action-button-primary mt-3 disabled:opacity-50"><Send className="size-4" />{busy ? 'Finding and verifying evidence…' : 'Ask'}</button>
      </form>
      <div className="mt-4 flex flex-wrap gap-2">{EXAMPLES.map((example) => <button key={example} disabled={busy} onClick={() => void ask(example)} className="rounded-lg border border-line px-2.5 py-2 text-left text-[11px] text-muted hover:border-cyan/40 hover:text-cyan disabled:opacity-50">{example}</button>)}</div>
      {error && <p role="alert" className="mt-5 text-xs text-rose-200">{error}</p>}
      {answer && <section aria-live="polite" className="mt-6 rounded-2xl border border-line bg-panel/70 p-4">
        <h2 className="text-[10px] font-bold uppercase tracking-widest text-cyan">Answer</h2>
        <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-slate-200">{answer.answer}</p>
        {answer.sources.length > 0 && <><h3 className="mb-2 mt-5 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-muted"><ShieldCheck className="size-3.5" /> Verified sources</h3>
          {answer.sources.map((source) => <div key={`${source.sourceBlockId}-${source.evidenceText}`} className="mt-2 flex items-center justify-between gap-3 border-t border-line pt-3"><span className="text-[11px] text-cyan">{source.sourceLocation}</span><button className="source-button shrink-0" onClick={() => onShowSource(source)}>Show source</button></div>)}
          <p className="mt-4 text-[10px] text-muted">{answer.provider === 'local-model' ? 'Local model selected these verified excerpts.' : 'Answered with local evidence retrieval.'}</p></>}
      </section>}
    </>}
  </main>;
}
