import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { HomeView } from './HomeView';
import type { DocumentRecord } from '../types/document';

const noop = () => {};
const props = { recent: [], onScan: noop, onPdf: noop, onImage: noop, onDemo: noop, onCapture: noop, onDiffDemo: noop, onPaste: noop, onInstall: noop, onOpenRecent: noop };
describe('platform-specific home actions', () => {
  it('provides working website entry points instead of extension-only scanning', () => {
    const html = renderToStaticMarkup(<HomeView {...props} website />);
    expect(html).toContain('Paste document text');
    expect(html).toContain('Get the browser extension');
    expect(html).not.toContain('Scan current page');
  });
  it('preserves extension page scanning and Android capture', () => {
    expect(renderToStaticMarkup(<HomeView {...props} />)).toContain('Scan current page');
    expect(renderToStaticMarkup(<HomeView {...props} android />)).toContain('Scan Paper Document');
  });
  it('shows singular pages and tolerates an older saved scan with a malformed URL', () => {
    const pdf = { id: 'one-page', type: 'pdf', title: 'One-page PDF', createdAt: new Date().toISOString(), blocks: [{ page: 1 }] } as DocumentRecord;
    const web = { ...pdf, id: 'old-url', type: 'web', title: 'Older page', url: 'not a URL' } as DocumentRecord;
    const html = renderToStaticMarkup(<HomeView {...props} recent={[pdf, web]} />);
    expect(html).toContain('1 page ·');
    expect(html).not.toContain('1 pages');
    expect(html).toContain('Webpage ·');
  });
});
