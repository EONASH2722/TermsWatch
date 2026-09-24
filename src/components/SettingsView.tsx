import { Database, ShieldCheck, Trash2 } from 'lucide-react';
import { useSyncExternalStore } from 'react';
import { disableLocalModel, enableLocalModel, getModelState, subscribeModel } from '../ai/localModel';
import { MODEL_DOWNLOAD_MB } from '../ai/modelConfig';

interface SettingsViewProps {
  recordCount: number;
  onClear: () => void;
}

export function SettingsView({ recordCount, onClear }: SettingsViewProps) {
  const model = useSyncExternalStore(subscribeModel, getModelState);
  return (
    <main className="px-5 py-7">
      <h1 className="text-xl font-semibold text-white">Settings</h1>
      <p className="mt-1 text-xs leading-relaxed text-muted">LOCAL-FIRST · TermsWatch processes supported documents locally whenever possible.</p>

      <div className="mt-6 space-y-3">
        <section className="rounded-2xl border border-line bg-panel/55 px-4 py-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-white"><ShieldCheck className="size-4 text-cyan" /> Analysis engine</div>
          <p className="mt-2 text-xs leading-relaxed text-muted">Local deterministic rules. No document text is sent to a remote AI provider.</p>
          <span className="mt-3 inline-flex rounded-md border border-cyan/20 bg-cyan/5 px-2 py-1 text-[9px] font-bold uppercase tracking-wider text-cyan">Local mode</span>
          <p className="mt-4 text-xs font-semibold text-white">Optional local model · SmolLM2 360M</p>
          <p className="mt-2 text-[11px] leading-relaxed text-muted">Download approximately {MODEL_DOWNLOAD_MB} MB from Hugging Face. The model runs on this device and selects evidence for Ask. Document text is not uploaded. Local rules stay available throughout.</p>
          <p role="status" className="mt-3 break-words text-[11px] text-cyan">{model.message}</p>
          {model.status === 'loading' && <progress aria-label="Model download progress" value={model.progress} max="100" className="mt-2 w-full accent-cyan" />}
          <button onClick={() => model.status === 'ready' || model.status === 'loading' ? disableLocalModel() : void enableLocalModel()} className="mt-3 rounded-lg border border-cyan/30 px-3 py-2 text-xs font-semibold text-cyan">{model.status === 'ready' ? 'Use local rules only' : model.status === 'loading' ? 'Cancel model loading' : 'Enable optional local model'}</button>
        </section>
        <section className="rounded-2xl border border-line bg-panel/55 px-4 py-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-white"><Database className="size-4 text-cyan" /> Local storage</div>
          <p className="mt-2 text-xs text-muted">{recordCount} saved {recordCount === 1 ? 'document' : 'documents'} in IndexedDB.</p>
          <p className="mt-2 text-[11px] leading-relaxed text-muted">Saved source files remain here until cleared. Analysis cache holds up to 20 entries. No account or sync.</p>
          <p className="mt-2 text-[11px] leading-relaxed text-muted">Optional model weights use a separate browser cache. Turning the model off releases it from memory; clear this app’s site data or Android app storage to remove downloaded weights too.</p>
          <button type="button" onClick={onClear} disabled={recordCount === 0} className="mt-4 inline-flex items-center gap-2 rounded-lg border border-rose-400/25 px-3 py-2 text-[11px] font-semibold text-rose-300 hover:bg-rose-400/5 disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400">
            <Trash2 className="size-3.5" /> Clear local history
          </button>
        </section>
        <section className="rounded-2xl border border-line bg-panel/55 px-4 py-4"><h2 className="text-sm font-semibold">Privacy</h2><p className="mt-2 text-xs leading-relaxed text-muted">OCR assets are bundled. Android shared links contact the original website. Camera and file selection use Android system apps, whose own permissions and privacy settings apply. The optional model download contacts Hugging Face; inference stays local.</p><p className="mt-3 text-[10px] text-muted">TermsWatch v1.0.0</p></section>
      </div>
    </main>
  );
}
