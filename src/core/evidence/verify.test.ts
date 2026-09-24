import { describe, expect, it } from 'vitest';
import type { DocumentBlock } from '../../types/document';
import { mapFindingToSource, verifyEvidence, verifyFinding } from './verify';

const block: DocumentBlock = {
  id: 'block-23',
  heading: 'Data Sharing',
  order: 23,
  text: 'We may share information with analytics partners.',
};

describe('evidence verification', () => {
  it('accepts an exact source excerpt and maps it back to the block', () => {
    const finding = verifyFinding({
      id: 'finding-1',
      sourceBlockId: block.id,
      category: 'data_sharing',
      attention: 'high',
      title: 'Data sharing',
      explanation: 'This section states that information may be shared.',
      evidenceText: 'share information with analytics partners',
      confidence: 0.93,
      sourceLocation: 'Data Sharing',
    }, [block]);
    expect(finding.verification.status).toBe('verified');
    expect(mapFindingToSource(finding, [block])).toBe(block);
  });

  it('marks invented evidence unsupported', () => {
    expect(verifyEvidence(block.id, 'We sell all personal data.', [block])).toEqual({
      status: 'unsupported',
      reason: 'Evidence text is not an exact excerpt of its source block.',
    });
  });

  it('marks a missing source unsupported', () => {
    expect(verifyEvidence('missing', 'text', [block]).status).toBe('unsupported');
  });
});
