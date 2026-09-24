import { extractWebDocument, scanWebDocument } from '../core/extraction/web';
import { normalizeText } from '../core/extraction/normalize';
import type { ContentMessage, ContentResponse } from '../types/messages';

declare global {
  interface Window {
    __termsWatchInjected?: boolean;
  }
}

const HIGHLIGHT_CLASS = 'termswatch-source-highlight';
const STYLE_ID = 'termswatch-highlight-style';
let highlightTimer: number | undefined;

function ensureStyles(): void {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    .${HIGHLIGHT_CLASS} {
      background: rgba(65, 230, 223, 0.18) !important;
      box-shadow: 0 0 0 3px rgba(65, 230, 223, 0.7), 0 12px 35px rgba(0, 0, 0, 0.24) !important;
      border-radius: 4px !important;
      transition: background 180ms ease, box-shadow 180ms ease !important;
    }
  `;
  document.documentElement.append(style);
}

function highlightSource(blockId: string, domSelector?: string, evidenceText?: string): boolean {
  ensureStyles();
  document.querySelectorAll(`.${HIGHLIGHT_CLASS}`).forEach((element) => element.classList.remove(HIGHLIGHT_CLASS));
  const extracted = extractWebDocument();
  const mapped = extracted.find(({ block }) => block.id === blockId);
  if (!evidenceText?.trim()) return false;
  const matches = (element?: Element) => Boolean(element && normalizeText(element.textContent ?? '').includes(evidenceText));
  let target = mapped && matches(mapped.element) ? mapped.element : undefined;
  if (!target && domSelector) {
    try {
      const selected = document.querySelector(domSelector) ?? undefined;
      target = matches(selected) ? selected : undefined;
    } catch {
      target = undefined;
    }
  }
  if (!target && evidenceText) {
    target = extracted.find(({ block }) => block.text.includes(evidenceText))?.element;
  }
  if (!target) return false;
  target.classList.add(HIGHLIGHT_CLASS);
  target.scrollIntoView({ behavior: 'smooth', block: 'center' });
  if (highlightTimer) window.clearTimeout(highlightTimer);
  highlightTimer = window.setTimeout(() => target?.classList.remove(HIGHLIGHT_CLASS), 6500);
  return true;
}

if (!window.__termsWatchInjected) {
  window.__termsWatchInjected = true;
  chrome.runtime.onMessage.addListener((message: ContentMessage, _sender, sendResponse: (response: ContentResponse) => void) => {
    try {
      if (message.type === 'TW_SCAN_PAGE') {
        sendResponse({ ok: true, scan: scanWebDocument() });
      } else if (message.type === 'TW_HIGHLIGHT_SOURCE') {
        sendResponse({
          ok: true,
          highlighted: highlightSource(message.blockId, message.domSelector, message.evidenceText),
        });
      }
    } catch (error) {
      sendResponse({ ok: false, error: error instanceof Error ? error.message : 'Unexpected content-script error.' });
    }
    return false;
  });
}
