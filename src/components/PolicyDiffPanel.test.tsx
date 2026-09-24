import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { PolicyDiff } from '../types/document';
import { PolicyDiffPanel } from './PolicyDiffPanel';

describe('PolicyDiffPanel', () => {
  it('renders counts and exact before/after word changes', () => {
    const diff: PolicyDiff = {
      previousDocumentId: 'before',
      currentDocumentId: 'after',
      added: 1,
      removed: 0,
      modified: 1,
      unchanged: 3,
      changes: [{
        id: 'modified-retention',
        kind: 'modified',
        heading: 'Retention',
        beforeBlockId: 'old-retention',
        afterBlockId: 'new-retention',
        beforeText: 'We retain data for 30 days.',
        afterText: 'We retain data for 90 days.',
        segments: [
          { kind: 'equal', text: 'We retain data for ' },
          { kind: 'removed', text: '30' },
          { kind: 'added', text: '90' },
          { kind: 'equal', text: ' days.' },
        ],
      }],
    };

    const markup = renderToStaticMarkup(<PolicyDiffPanel diff={diff} defaultExpanded />);
    expect(markup).toContain('1 updated · 1 added · 0 removed');
    expect(markup).toContain('Before');
    expect(markup).toContain('30');
    expect(markup).toContain('After');
    expect(markup).toContain('90');
  });
});
