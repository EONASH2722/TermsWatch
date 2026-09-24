import type { DocumentBlock, EvidenceVerification, Finding } from '../../types/document';

export function verifyEvidence(
  sourceBlockId: string,
  evidenceText: string,
  blocks: DocumentBlock[],
): EvidenceVerification {
  const source = blocks.find((block) => block.id === sourceBlockId);
  if (!source) return { status: 'unsupported', reason: 'Source block was not found.' };
  if (!evidenceText.trim()) return { status: 'unsupported', reason: 'Evidence text is empty.' };
  if (!source.text.includes(evidenceText)) {
    return { status: 'unsupported', reason: 'Evidence text is not an exact excerpt of its source block.' };
  }
  return { status: 'verified' };
}

export function verifyFinding(finding: Omit<Finding, 'verification'>, blocks: DocumentBlock[]): Finding {
  return {
    ...finding,
    verification: verifyEvidence(finding.sourceBlockId, finding.evidenceText, blocks),
  };
}

export function mapFindingToSource(finding: Finding, blocks: DocumentBlock[]): DocumentBlock | undefined {
  return blocks.find((block) => block.id === finding.sourceBlockId);
}
