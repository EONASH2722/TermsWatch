import { AlertTriangle, ArrowLeft, Camera, ExternalLink, FileSearch, Image, RefreshCw, Scale, ScanText, MessageCircle } from 'lucide-react';
import type { DocumentRecord, Finding, PolicyDiff } from '../types/document';
import { FindingCard } from './FindingCard';
import { PolicyDiffPanel } from './PolicyDiffPanel';

interface ResultsViewProps {
  record: DocumentRecord;
  policyDiff?: PolicyDiff;
  onBack: () => void;
  onShowSource: (finding: Finding) => void;
  onAsk: () => void;
  onReanalyze: () => void;
}

export function ResultsView({ record, policyDiff, onBack, onShowSource, onAsk, onReanalyze }: ResultsViewProps) {
  const verified = record.findings.filter((finding) => finding.verification.status === 'verified');
  const unsupportedCount = record.findings.length - verified.length;
  const host = record.url ? new URL(record.url).hostname : record.fileName ?? (record.type === 'capture' ? 'Captured document' : record.type === 'text' ? 'Document text' : 'Built-in sample');
  const TypeIcon = record.type === 'pdf' ? FileSearch : record.type === 'capture' ? Camera : record.type === 'image' ? Image : ScanText;

  return (
    <main className="px-4 py-5">
      <button type="button" onClick={onBack} className="mb-4 inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-[11px] font-semibold text-muted hover:bg-raised hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan">
        <ArrowLeft className="size-3.5" /> Back
      </button>

      <section className="rounded-2xl border border-line bg-panel/70 px-4 py-4">
        <div className="flex items-start gap-3">
          <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-raised text-cyan">
            <TypeIcon className="size-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="line-clamp-2 text-lg font-semibold leading-tight text-white">{record.title}</h1>
            <p className="mt-1 truncate text-[11px] text-muted">{host}</p>
            {record.ocr && (
              <p className="mt-1 text-[9px] font-semibold uppercase tracking-[0.1em] text-cyan/75">
                On-device OCR · {Math.round(record.ocr.confidence)}% confidence
              </p>
            )}
          </div>
          {record.url && (
            <a href={record.url} target="_blank" rel="noreferrer" aria-label="Open original page" className="rounded-lg p-1.5 text-muted hover:bg-raised hover:text-cyan focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan">
              <ExternalLink className="size-4" />
            </a>
          )}
        </div>
        {record.changeDetected && (
          <div className="mt-3 flex items-center gap-2 rounded-xl border border-cyan/25 bg-cyan/5 px-3 py-2.5 text-[11px] leading-relaxed text-cyan">
            <RefreshCw className="size-3.5 shrink-0" />
            TermsWatch detected that this policy changed.
          </div>
        )}
      </section>

      {policyDiff && <PolicyDiffPanel diff={policyDiff} />}
      <div className="mt-4 flex gap-2"><button className="action-button action-button-primary flex-1" onClick={onAsk}><MessageCircle className="size-4" />Ask this document</button><button className="rounded-xl border border-line px-3 text-[10px] font-semibold text-muted hover:text-cyan" onClick={onReanalyze} title="Run fresh analysis">Reanalyze</button></div>
      {record.cacheHit && <p className="mt-2 text-right text-[9px] text-muted">Reused verified local analysis</p>}

      <section className="mt-4 rounded-2xl border border-line bg-panel/55 px-4 py-4" aria-labelledby="summary-heading">
        <h2 id="summary-heading" className="flex items-center gap-2 text-sm font-semibold text-white">
          <ScanText className="size-4 text-cyan" /> Quick summary
        </h2>
        <ul className="mt-3 space-y-2.5">
          {record.summary.slice(0, 5).map((item, index) => (
            <li key={`${item}-${index}`} className="flex gap-2.5 text-xs leading-relaxed text-slate-300">
              <span className="mt-[6px] size-1.5 shrink-0 rounded-full bg-cyan" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-5" aria-labelledby="findings-heading">
        <p className="mb-3 px-1 text-[10px] leading-relaxed text-muted">Attention highlights clauses worth reading. It is not a legal risk score.</p>
        <div className="mb-3 flex items-center justify-between px-1">
          <h2 id="findings-heading" className="flex items-center gap-2 text-sm font-semibold text-white">
            <Scale className="size-4 text-cyan" /> Clauses to review
          </h2>
          <span className="text-[10px] text-muted">{verified.length} {verified.length === 1 ? 'finding' : 'findings'}</span>
        </div>
        {verified.length ? (
          <div className="space-y-3">
            {verified.map((finding, index) => (
              <FindingCard key={finding.id} finding={finding} defaultExpanded={index === 0} onShowSource={onShowSource} />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-line bg-panel/55 px-5 py-7 text-center">
            <ScanText className="mx-auto size-6 text-cyan" />
            <p className="mt-3 text-sm font-semibold text-slate-100">No common clauses detected</p>
            <p className="mt-1 text-xs leading-relaxed text-muted">The local rules did not find one of the supported patterns. This is not a legal assessment.</p>
          </div>
        )}
        {unsupportedCount > 0 && (
          <div className="mt-3 flex items-start gap-2 rounded-xl border border-amber-300/20 bg-amber-300/5 px-3 py-2.5 text-[10px] leading-relaxed text-amber-100/80">
            <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
            {unsupportedCount} result{unsupportedCount === 1 ? '' : 's'} hidden because the source evidence could not be verified.
          </div>
        )}
      </section>
    </main>
  );
}
