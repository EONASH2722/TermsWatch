import { LoaderCircle } from 'lucide-react';

export function LoadingState({ message }: { message: string }) {
  return (
    <div className="grid min-h-[360px] place-items-center px-6 text-center" role="status">
      <div>
        <LoaderCircle className="mx-auto size-8 animate-spin text-cyan" aria-hidden="true" />
        <p className="mt-4 text-sm font-semibold text-slate-100">{message}</p>
        <p className="mt-1 text-xs text-muted">Local-first document processing.</p>
      </div>
    </div>
  );
}
