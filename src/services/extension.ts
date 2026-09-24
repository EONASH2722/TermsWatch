import type { ContentResponse, HighlightSourceMessage } from '../types/messages';
import type { AnswerSource, WebScanResult } from '../types/document';

export function isBrowserExtension(): boolean {
  return typeof chrome !== 'undefined' && Boolean(chrome.tabs && chrome.runtime?.id);
}

async function activeTab(): Promise<chrome.tabs.Tab> {
  if (!isBrowserExtension()) throw new Error('Page scanning is available when TermsWatch is loaded as an extension.');
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) throw new Error('No active browser tab is available.');
  return tab;
}

async function sendToTab<T>(tabId: number, message: object): Promise<T> {
  return chrome.tabs.sendMessage(tabId, message) as Promise<T>;
}

export async function scanCurrentPage(): Promise<WebScanResult> {
  const tab = await activeTab();
  let response: ContentResponse;
  try {
    response = await sendToTab<ContentResponse>(tab.id!, { type: 'TW_SCAN_PAGE' });
  } catch {
    await chrome.scripting.executeScript({ target: { tabId: tab.id! }, files: ['content.js'] });
    response = await sendToTab<ContentResponse>(tab.id!, { type: 'TW_SCAN_PAGE' });
  }
  if (!response.ok || !('scan' in response)) throw new Error(response.ok ? 'The page could not be scanned.' : response.error);
  return response.scan;
}

export async function highlightWebSource(finding: AnswerSource, domSelector?: string, expectedUrl?: string): Promise<void> {
  const tab = await activeTab();
  if (expectedUrl && tab.url?.split('#')[0] !== expectedUrl.split('#')[0]) throw new Error('Open the original document tab to highlight its source.');
  const message: HighlightSourceMessage = {
    type: 'TW_HIGHLIGHT_SOURCE',
    blockId: finding.sourceBlockId,
    domSelector,
    evidenceText: finding.evidenceText,
  };
  const response = await sendToTab<ContentResponse>(tab.id!, message);
  if (!response.ok || !('highlighted' in response) || !response.highlighted) {
    throw new Error(response.ok ? 'The original source is no longer available on this page.' : response.error);
  }
}
