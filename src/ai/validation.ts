import type { DocumentAnswer, DocumentBlock, AnswerSource } from '../types/document';
import { verifyEvidence } from '../core/evidence/verify';
import { sourceLocation } from '../core/evidence/location';
import { explainEvidence } from '../core/analysis/explain';

export const INSUFFICIENT = "I couldn't find enough verified information in this document to answer that confidently.";

export function insufficientAnswer(): DocumentAnswer {
  return { status: 'insufficient', answer: INSUFFICIENT, sources: [], provider: 'local-rules' };
}

function composeAnswer(sources: AnswerSource[], question: string): string {
  const facts = sources.map((source) => explainEvidence(source.evidenceText));
  if (facts.length === 1 && /\bban(?:s|ned|ning)?\b/i.test(question)) {
    const match = sources[0].evidenceText.match(/^(.{12,130}?)\s+for\s+(.+?)[.!?]?$/i);
    if (match) {
      const causes = match[2].split(/,\s*(?:or\s+)?|\s+or\s+/i).map((part) => part.trim().replace(/[.!?]$/, '')).filter(Boolean);
      if (causes.length >= 2 && causes.length <= 5 && causes.every((cause) => cause.length <= 90)) {
        return `According to this document, ${match[1]} for:\n• ${causes.join('\n• ')}`;
      }
    }
  }
  return facts.length === 1
    ? `According to this document: ${facts[0]}`
    : `According to this document:\n• ${facts.join('\n• ')}`;
}

// Only exact source quotations are accepted from a model. Answer prose is
// composed from those verified quotations; unchecked model prose is ignored.
export function validateAnswerCandidate(candidate: unknown, blocks: DocumentBlock[], provider: DocumentAnswer['provider'], question = ''): DocumentAnswer {
  if (!candidate || typeof candidate !== 'object' || !('sources' in candidate) || !Array.isArray(candidate.sources)) return insufficientAnswer();
  if (candidate.sources.length === 0 || candidate.sources.length > 3) return insufficientAnswer();
  const sources: AnswerSource[] = [];
  for (const value of candidate.sources) {
    if (!value || typeof value !== 'object' || typeof value.sourceBlockId !== 'string' || typeof value.evidenceText !== 'string') return insufficientAnswer();
    if (value.evidenceText.trim().length < 15 || value.evidenceText.length > 900 || verifyEvidence(value.sourceBlockId, value.evidenceText, blocks).status !== 'verified') return insufficientAnswer();
    const block = blocks.find((entry) => entry.id === value.sourceBlockId)!;
    if (!sources.some((source) => source.sourceBlockId === block.id && source.evidenceText === value.evidenceText)) {
      sources.push({ sourceBlockId: block.id, evidenceText: value.evidenceText, sourceLocation: sourceLocation(block) });
    }
  }
  return { status: 'answered', answer: composeAnswer(sources, question), sources, provider };
}

export function parseModelOutput(text: string): unknown {
  try {
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start < 0 || end <= start) return undefined;
    return JSON.parse(text.slice(start, end + 1));
  } catch { return undefined; }
}
