import type { WebScanResult } from '../../types/document';
import type { ExtractedElement } from '../../types/messages';
import { normalizeText } from './normalize';

const BLOCK_SELECTOR = 'h1, h2, h3, h4, h5, h6, p, li, blockquote';
const EXCLUDED_ANCESTOR = [
  'nav',
  'footer',
  'aside',
  'script',
  'style',
  'noscript',
  'form',
  'button',
  '[role="navigation"]',
  '[role="banner"]',
  '[role="complementary"]',
  '[aria-hidden="true"]',
].join(',');
const NOISE_PATTERN = /(cookie|banner|menu|breadcrumb|footer|nav|advert|social|share|related|promo|newsletter)/i;
const LEGAL_PATTERN = /\b(terms|privacy|policy|agreement|arbitration|liability|indemnif|license|terminate|renew|cancel|personal data|third part|governing law|payment)\b/gi;

function stableHash(input: string): string {
  let hash = 0x811c9dc5;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(36);
}

function safeIdentifier(value: string): string {
  return value.replace(/([^a-zA-Z0-9_-])/g, '\\$1');
}

export function getDomSelector(element: Element): string {
  if (element.id) return `#${safeIdentifier(element.id)}`;

  const parts: string[] = [];
  let current: Element | null = element;
  while (current && current.tagName.toLowerCase() !== 'html' && parts.length < 7) {
    let part = current.tagName.toLowerCase();
    const parent: Element | null = current.parentElement;
    if (parent) {
      const siblings = [...parent.children].filter((child) => child.tagName === current?.tagName);
      if (siblings.length > 1) part += `:nth-of-type(${siblings.indexOf(current) + 1})`;
    }
    parts.unshift(part);
    if (current.tagName.toLowerCase() === 'main' || current.tagName.toLowerCase() === 'article') break;
    current = parent;
  }
  return parts.join(' > ');
}

function isVisible(element: Element): boolean {
  const htmlElement = element as HTMLElement;
  const style = globalThis.getComputedStyle?.(htmlElement);
  if (style && (style.display === 'none' || style.visibility === 'hidden')) return false;
  return !htmlElement.hidden;
}

function isNoise(element: Element): boolean {
  if (element.closest(EXCLUDED_ANCESTOR)) return true;
  const signature = `${element.id} ${element.className}`;
  return NOISE_PATTERN.test(signature);
}

function chooseContentRoot(doc: Document): Element {
  const candidates = [...doc.querySelectorAll('main, article, [role="main"]')];
  if (candidates.length === 0) return doc.body;
  return candidates.reduce((best, current) =>
    (current.textContent?.length ?? 0) > (best.textContent?.length ?? 0) ? current : best,
  );
}

export function extractWebDocument(doc: Document = document): ExtractedElement[] {
  const root = chooseContentRoot(doc);
  const seen = new Set<string>();
  const extracted: ExtractedElement[] = [];
  let currentHeading: string | undefined;

  for (const element of root.querySelectorAll(BLOCK_SELECTOR)) {
    if (!isVisible(element) || isNoise(element)) continue;
    const text = normalizeText(element.textContent ?? '');
    const isHeading = /^H[1-6]$/.test(element.tagName);
    if (isHeading) currentHeading = text;
    if ((!isHeading && text.length < 28) || (isHeading && text.length < 3) || seen.has(text)) continue;
    seen.add(text);
    const domSelector = getDomSelector(element);
    const order = extracted.length;
    const id = `web-${stableHash(`${domSelector}|${text}`)}`;
    extracted.push({
      element,
      block: {
        id,
        text,
        heading: isHeading ? text : currentHeading,
        domSelector,
        order,
      },
    });
  }
  return extracted;
}

export function scanWebDocument(doc: Document = document): WebScanResult {
  const extracted = extractWebDocument(doc);
  const completeText = extracted.map(({ block }) => block.text).join(' ');
  const legalMatches = completeText.match(LEGAL_PATTERN)?.length ?? 0;
  return {
    title: normalizeText(doc.title) || 'Untitled legal page',
    url: doc.location?.href ?? '',
    blocks: extracted.map(({ block }) => block),
    legalScore: Math.min(1, legalMatches / 8),
  };
}
