import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ContentMessage, ContentResponse } from '../types/messages';

let receive: (message: ContentMessage, sender: object, response: (value: ContentResponse) => void) => void;
beforeEach(async () => {
  vi.resetModules();
  document.body.innerHTML = '<main><h1>Terms</h1><p id="clause">We may share information with advertising partners.</p></main>';
  delete window.__termsWatchInjected;
  vi.stubGlobal('chrome', { runtime: { onMessage: { addListener: (listener: typeof receive) => { receive = listener; } } } });
  Element.prototype.scrollIntoView = vi.fn();
  await import('./index');
});
describe('live webpage source grounding', () => {
  it('scans and highlights the real clause', () => {
    const scan = vi.fn(); receive({ type: 'TW_SCAN_PAGE' }, {}, scan);
    const result = scan.mock.calls[0][0];
    const block = result.scan.blocks.find((value: { text: string }) => value.text.startsWith('We may share'));
    const response = vi.fn();
    receive({ type: 'TW_HIGHLIGHT_SOURCE', blockId: block.id, domSelector: '#clause', evidenceText: block.text }, {}, response);
    expect(response).toHaveBeenCalledWith({ ok: true, highlighted: true });
    expect(document.querySelector('#clause')?.classList.contains('termswatch-source-highlight')).toBe(true);
  });
  it('refuses a stale positional ID and selector after page content changes', () => {
    const scan = vi.fn(); receive({ type: 'TW_SCAN_PAGE' }, {}, scan);
    const block = scan.mock.calls[0][0].scan.blocks.find((value: { text: string }) => value.text.startsWith('We may share'));
    document.querySelector('#clause')!.textContent = 'Completely different document content.';
    const response = vi.fn();
    receive({ type: 'TW_HIGHLIGHT_SOURCE', blockId: block.id, domSelector: '#clause', evidenceText: block.text }, {}, response);
    expect(response).toHaveBeenCalledWith({ ok: true, highlighted: false });
  });
});
