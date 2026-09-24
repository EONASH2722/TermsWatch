import { ChevronDown, ChevronUp, Minus, PencilLine, Plus } from 'lucide-react';
import { useState } from 'react';
import type { DiffSegment, PolicyChange, PolicyDiff } from '../types/document';

interface PolicyDiffPanelProps {
  diff: PolicyDiff;
  defaultExpanded?: boolean;
}

function SegmentLine({ segments, version }: { segments: DiffSegment[]; version: 'before' | 'after' }) {
  return (
    <p className="whitespace-pre-wrap text-[11px] leading-relaxed text-slate-300">
      {segments
        .filter((segment) => version === 'before' ? segment.kind !== 'added' : segment.kind !== 'removed')
        .map((segment, index) => {
          const changed = version === 'before' ? segment.kind === 'removed' : segment.kind === 'added';
          return (
            <span
              key={`${segment.kind}-${index}`}
              className={changed
                ? version === 'before'
                  ? 'rounded-sm bg-rose-400/15 text-rose-200 line-through decoration-rose-300/70'
                  : 'rounded-sm bg-cyan/15 text-cyan'
                : undefined}
            >
              {segment.text}
            </span>
          );
        })}
    </p>
  );
}

function ChangeCard({ change }: { change: PolicyChange }) {
  const [open, setOpen] = useState(change.kind === 'modified');
  const Icon = change.kind === 'added' ? Plus : change.kind === 'removed' ? Minus : PencilLine;
  const label = change.kind === 'added' ? 'Added' : change.kind === 'removed' ? 'Removed' : 'Updated';
  const accent = change.kind === 'added'
    ? 'text-cyan bg-cyan/8 border-cyan/20'
    : change.kind === 'removed'
      ? 'text-rose-200 bg-rose-400/5 border-rose-400/20'
      : 'text-amber-100 bg-amber-300/5 border-amber-300/20';

  return (
    <div className="overflow-hidden rounded-xl border border-line bg-ink/35">
      <button type="button" onClick={() => setOpen((value) => !value)} className="flex w-full items-center gap-2.5 px-3 py-3 text-left hover:bg-raised/45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-cyan">
        <span className={`inline-flex shrink-0 items-center gap-1 rounded-md border px-1.5 py-1 text-[9px] font-bold uppercase tracking-[0.08em] ${accent}`}>
          <Icon className="size-3" /> {label}
        </span>
        <span className="min-w-0 flex-1 truncate text-[11px] font-semibold text-slate-200">
          {change.heading || change.afterText || change.beforeText || 'Policy clause'}
        </span>
        {open ? <ChevronUp className="size-3.5 text-muted" /> : <ChevronDown className="size-3.5 text-muted" />}
      </button>
      {open && (
        <div className="space-y-3 border-t border-line/70 px-3 py-3">
          {change.kind !== 'added' && (
            <div>
              <p className="mb-1 text-[8px] font-bold uppercase tracking-[0.15em] text-rose-200/75">Before</p>
              <SegmentLine segments={change.segments} version="before" />
            </div>
          )}
          {change.kind !== 'removed' && (
            <div>
              <p className="mb-1 text-[8px] font-bold uppercase tracking-[0.15em] text-cyan/75">After</p>
              <SegmentLine segments={change.segments} version="after" />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function PolicyDiffPanel({ diff, defaultExpanded = false }: PolicyDiffPanelProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const total = diff.added + diff.removed + diff.modified;

  return (
    <section className="mt-4 overflow-hidden rounded-2xl border border-cyan/20 bg-panel/55" aria-labelledby="policy-changes-heading">
      <button type="button" onClick={() => setExpanded((value) => !value)} className="flex w-full items-center gap-3 px-4 py-3.5 text-left hover:bg-raised/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-cyan">
        <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-cyan/10 text-cyan"><PencilLine className="size-4" /></span>
        <span className="min-w-0 flex-1">
          <span id="policy-changes-heading" className="block text-xs font-semibold text-white">What changed</span>
          <span className="mt-0.5 block text-[10px] text-muted">
            {diff.modified} updated · {diff.added} added · {diff.removed} removed
          </span>
        </span>
        {expanded ? <ChevronUp className="size-4 text-cyan" /> : <ChevronDown className="size-4 text-muted" />}
      </button>
      {expanded && (
        <div className="border-t border-line px-3 py-3">
          {total ? (
            <div className="space-y-2">{diff.changes.map((change) => <ChangeCard key={change.id} change={change} />)}</div>
          ) : (
            <p className="px-2 py-3 text-center text-[11px] text-muted">No clause-level changes were found.</p>
          )}
          <p className="mt-3 px-1 text-[9px] leading-relaxed text-muted">Compared locally with the immediately preceding snapshot. Formatting-only changes are ignored.</p>
        </div>
      )}
    </section>
  );
}
