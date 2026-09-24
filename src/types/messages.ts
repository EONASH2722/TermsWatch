import type { DocumentBlock, WebScanResult } from './document';

export interface ScanPageMessage {
  type: 'TW_SCAN_PAGE';
}

export interface HighlightSourceMessage {
  type: 'TW_HIGHLIGHT_SOURCE';
  blockId: string;
  domSelector?: string;
  evidenceText: string;
}

export type ContentMessage = ScanPageMessage | HighlightSourceMessage;

export type ContentResponse =
  | { ok: true; scan: WebScanResult }
  | { ok: true; highlighted: boolean }
  | { ok: false; error: string };

export interface ExtractedElement {
  block: DocumentBlock;
  element: Element;
}
