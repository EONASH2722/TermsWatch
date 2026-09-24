import { describe, expect, it } from 'vitest';
import { LocalRuleAnalysisEngine } from './engine';

describe('local analysis engine', () => {
  it('recognizes the common renews-automatically word order', async () => {
    const findings = await new LocalRuleAnalysisEngine().analyzeClause({ id: 'renewal', order: 0, text: 'Your subscription renews automatically each month unless you cancel 48 hours before renewal.' });
    expect(findings.map((finding) => finding.category)).toContain('automatic_renewal');
  });
  it('creates structured findings linked to verified source blocks', async () => {
    const engine = new LocalRuleAnalysisEngine();
    const result = await engine.analyzeDocument([{
      id: 'block-1',
      heading: 'Partners',
      order: 0,
      text: 'We may share your information with advertising partners to show relevant offers.',
    }]);
    expect(result.findings[0]).toMatchObject({
      sourceBlockId: 'block-1',
      category: 'data_sharing',
      attention: 'high',
      verification: { status: 'verified' },
    });
    expect(result.findings[0].evidenceText).toBe('We may share your information with advertising partners to show relevant offers.');
    expect(result.summary).toHaveLength(1);
  });

  it('does not treat a standalone section heading as a clause', async () => {
    const engine = new LocalRuleAnalysisEngine();
    await expect(engine.analyzeClause({
      id: 'heading-1',
      heading: 'Automatic Renewal',
      order: 0,
      text: 'Automatic Renewal',
    })).resolves.toEqual([]);
  });
  it('explains and summarizes the actual termination conditions rather than a category template', async () => {
    const text = 'Spotify may suspend or end access for breaches, service changes, or legal requirements.';
    const result = await new LocalRuleAnalysisEngine().analyzeDocument([{ id: 'spotify', order: 0, text }]);
    const finding = result.findings.find((entry) => entry.category === 'account_termination');
    expect(finding?.verification.status).toBe('verified');
    expect(finding?.explanation).toContain('service changes');
    expect(finding?.explanation).toContain('legal requirements');
    expect(finding?.explanation).toContain('because of');
    expect(finding?.explanation).not.toBe(text);
    expect(finding?.explanation).not.toMatch(/^This section/);
    expect(result.summary[0]).toContain('breaches');
  });
  it('uses the payment sentence for a payment finding and keeps provider pronouns consistent', async () => {
    const engine = new LocalRuleAnalysisEngine();
    const result = await engine.analyzeDocument([
      { id: 'billing', order: 0, text: 'You may cancel from account settings before your next billing date. Payments already made are non-refundable except where required by law.' },
      { id: 'sharing', order: 1, text: 'We may share information about you with our advertising partners.' },
    ]);
    expect(result.findings.find((finding) => finding.category === 'payment')?.explanation).toContain('Payments already made are non-refundable');
    expect(result.findings.find((finding) => finding.category === 'data_sharing')?.explanation).toContain('with its advertising partners');
  });
});
