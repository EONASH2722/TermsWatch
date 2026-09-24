import { ChevronDown, FileText, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import type { Finding } from '../types/document';

const tone = {
  high: {
    label: 'High attention',
    rail: 'border-l-rose-500',
    badge: 'border-rose-400/50 bg-rose-400/8 text-rose-300',
  },
  medium: {
    label: 'Medium attention',
    rail: 'border-l-amber-400',
    badge: 'border-amber-300/50 bg-amber-300/8 text-amber-200',
  },
  low: {
    label: 'Low attention',
    rail: 'border-l-sky-400',
    badge: 'border-sky-300/50 bg-sky-300/8 text-sky-200',
  },
  info: {
    label: 'Info',
    rail: 'border-l-slate-500',
    badge: 'border-slate-400/40 bg-slate-300/5 text-slate-300',
  },
};

interface FindingCardProps {
  finding: Finding;
  defaultExpanded?: boolean;
  onShowSource: (finding: Finding) => void;
}

export function FindingCard({ finding, defaultExpanded = false, onShowSource }: FindingCardProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const appearance = tone[finding.attention];

  return (
    <article className={`overflow-hidden rounded-2xl border border-line border-l-[3px] bg-panel/80 shadow-panel ${appearance.rail}`}>
      <div className="px-4 py-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <span className={`inline-flex rounded-md border px-2 py-1 text-[9px] font-extrabold uppercase tracking-[0.14em] ${appearance.badge}`}>
              {appearance.label}
            </span>
            <h3 className="mt-2.5 text-base font-semibold text-white">{finding.title}</h3>
          </div>
          <button
            type="button"
            onClick={() => setExpanded((value) => !value)}
            aria-expanded={expanded}
            aria-label={`${expanded ? 'Collapse' : 'Expand'} ${finding.title}`}
            className="rounded-lg p-1.5 text-muted hover:bg-raised hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan"
          >
            <ChevronDown className={`size-4 transition-transform ${expanded ? 'rotate-180' : ''}`} />
          </button>
        </div>

        <p className="mt-2 text-[13px] leading-relaxed text-slate-300">{finding.explanation}</p>
        <div className="mt-3 flex items-center justify-between gap-3">
          <span className="flex min-w-0 items-center gap-1.5 text-[11px] text-cyan">
            <FileText className="size-3.5 shrink-0" aria-hidden="true" />
            <span className="truncate">{finding.sourceLocation}</span>
          </span>
          <button type="button" onClick={() => onShowSource(finding)} className="source-button">
            {finding.sourceLocation.includes('Page') ? 'View source' : 'Show source'}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-line/70 bg-ink/35 px-4 py-4">
          <div className="flex items-center justify-between gap-3">
            <span className="text-[9px] font-bold uppercase tracking-[0.16em] text-slate-400">Local explanation</span>
            <span className="text-[10px] text-muted" title="Heuristic rule-match strength, not a probability of correctness or legal risk">
              Rule match <strong className="font-semibold text-cyan">{Math.round(finding.confidence * 100)}%</strong>
            </span>
          </div>
          <p className="mt-2 text-xs leading-relaxed text-slate-300">{finding.explanation}</p>
          <div className="mt-4 border-t border-line/60 pt-4">
            <div className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.16em] text-slate-400">
              <ShieldCheck className="size-3.5 text-cyan" aria-hidden="true" />
              Verified source
            </div>
            <blockquote className="mt-2 rounded-xl border border-line/70 bg-raised/60 px-3 py-3 text-xs leading-relaxed text-slate-200">
              “{finding.evidenceText}”
            </blockquote>
          </div>
        </div>
      )}
    </article>
  );
}
