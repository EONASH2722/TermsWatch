import { Info } from 'lucide-react';

export function Disclaimer() {
  return (
    <footer className="mt-auto flex items-start gap-2 border-t border-line/60 px-5 py-4 text-[11px] leading-relaxed text-muted">
      <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
      <span>TermsWatch explains document content and does not provide legal advice.</span>
    </footer>
  );
}
