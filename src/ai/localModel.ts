import type { DocumentBlock } from '../types/document';
import type { ModelState } from './modelConfig';

let worker: Worker | undefined;
let counter = 0;
let generation = 0;
let state: ModelState = { status: 'off', progress: 0, message: 'Local rules are ready. Optional model is off.' };
const listeners = new Set<() => void>();
const pending = new Map<number, { resolve: (value: string) => void; reject: (reason: Error) => void; timer: ReturnType<typeof setTimeout> }>();
export const getModelState = () => state;
export function subscribeModel(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener); }; }
function update(next: ModelState) { state = next; listeners.forEach((listener) => listener()); }
function failPending(message: string) {
  for (const call of pending.values()) { clearTimeout(call.timer); call.reject(new Error(message)); }
  pending.clear();
}
export function disableLocalModel() {
  generation += 1;
  worker?.postMessage({ type: 'dispose', id: ++counter });
  const old = worker;
  worker = undefined;
  setTimeout(() => old?.terminate(), 500);
  failPending('Local model disabled.');
  update({ status: 'off', progress: 0, message: 'Local rules are ready. Optional model is off.' });
}
function request(type: string, payload: object, timeout: number): Promise<string> {
  const id = ++counter;
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      pending.delete(id);
      reject(new Error('Local model timed out; local rules remain available.'));
      worker?.terminate(); worker = undefined;
      failPending('Local model timed out.');
      update({ status: 'error', progress: 0, message: 'Local model timed out. Using local rules.' });
    }, timeout);
    pending.set(id, { resolve, reject, timer });
    worker!.postMessage({ id, type, ...payload });
  });
}
export async function enableLocalModel(): Promise<void> {
  if (state.status === 'ready' || state.status === 'loading') return;
  const attempt = ++generation;
  update({ status: 'loading', progress: 0, message: 'Preparing optional local model…' });
  try {
    worker = new Worker(new URL('./model.worker.ts', import.meta.url), { type: 'module' });
    worker.onmessage = ({ data }) => {
      if (attempt !== generation) return;
      if (data.type === 'progress') {
        update({ status: 'loading', progress: Math.max(0, Math.min(100, data.progress || 0)), message: data.message });
        return;
      }
      const call = pending.get(data.id);
      if (!call) return;
      clearTimeout(call.timer); pending.delete(data.id);
      if (data.type === 'error') call.reject(new Error(data.message));
      else call.resolve(data.text ?? '');
    };
    worker.onerror = () => { failPending('The local model worker could not start.'); };
    await request('initialize', {}, 600_000);
    if (attempt !== generation) return;
    update({ status: 'ready', progress: 100, message: 'SmolLM2 is ready on this device.' });
  } catch (error) {
    if (attempt !== generation) return;
    worker?.terminate(); worker = undefined;
    update({ status: 'error', progress: 0, message: error instanceof Error ? error.message : 'Local model unavailable. Local rules remain ready.' });
  }
}
export async function askLocalModel(question: string, blocks: DocumentBlock[]): Promise<string> {
  if (!worker || state.status !== 'ready' || pending.size) throw new Error('Local model unavailable or busy.');
  return request('answer', { question, blocks }, 25_000);
}
