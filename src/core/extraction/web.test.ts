import { describe, expect, it } from 'vitest';
import { extractWebDocument, scanWebDocument } from './web';

describe('web extraction', () => {
  it('preserves headings and paragraphs while removing navigation and footer noise', () => {
    document.title = 'Example Privacy Policy';
    document.body.innerHTML = `
      <nav><p>Home Products Pricing and many unrelated links</p></nav>
      <main>
        <h1>Privacy Policy</h1>
        <section>
          <h2>Data Sharing</h2>
          <p id="sharing">We may share personal data with analytics partners to operate our service.</p>
        </section>
      </main>
      <footer><p>Copyright newsletter links and footer navigation</p></footer>
    `;
    const extracted = extractWebDocument(document);
    expect(extracted.map(({ block }) => block.text)).toEqual([
      'Privacy Policy',
      'Data Sharing',
      'We may share personal data with analytics partners to operate our service.',
    ]);
    expect(extracted[2].block.heading).toBe('Data Sharing');
    expect(extracted[2].block.domSelector).toBe('#sharing');
    expect(extracted[2].block.id).toMatch(/^web-/);
    expect(scanWebDocument(document).legalScore).toBeGreaterThan(0);
  });

  it('produces the same stable block id for unchanged content', () => {
    document.body.innerHTML = '<main><p id="terms">These terms govern your use of this service and your account.</p></main>';
    expect(extractWebDocument(document)[0].block.id).toBe(extractWebDocument(document)[0].block.id);
  });
});
