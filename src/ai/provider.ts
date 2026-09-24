import type { AnalysisResult, DocumentAnswer, DocumentBlock, Finding } from '../types/document';
import { LocalRuleAnalysisEngine } from '../core/analysis/engine';
import { queryTokens, retrieveBlocks } from '../core/retrieval/retrieve';
import { insufficientAnswer, validateAnswerCandidate } from './validation';

export interface AnalysisProvider {
  readonly id: string;
  readonly version: string;
  initialize(): Promise<void>;
  summarize(findings: Finding[], blocks: DocumentBlock[]): string[];
  analyzeBlocks(blocks: DocumentBlock[]): Promise<AnalysisResult>;
  answerQuestion(question: string, retrievedBlocks: DocumentBlock[]): Promise<DocumentAnswer>;
}

export class RuleAnalysisProvider implements AnalysisProvider {
  readonly id = 'local-rules';
  readonly version = 'rules-1.0.0';
  private engine = new LocalRuleAnalysisEngine();
  async initialize(): Promise<void> { /* Immediately available; no download. */ }
  summarize(findings: Finding[], blocks: DocumentBlock[]) { return this.engine.summarizeDocument(findings, blocks).slice(0, 5); }
  analyzeBlocks(blocks: DocumentBlock[]) { return this.engine.analyzeDocument(blocks); }
  async answerQuestion(question: string, blocks: DocumentBlock[]): Promise<DocumentAnswer> {
    if (!blocks.length) return insufficientAnswer();
    const originalTokens = queryTokens(question);
    const sources = blocks.slice(0, 2).map((block) => {
      // Keep qualifiers in a complete source sentence; never rewrite the citation.
      const sentences = (block.text.match(/[^.!?]+(?:[.!?]+|$)/g) ?? [block.text]).map((text) => text.trim()).filter((text) => text.length >= 15);
      const sentence = sentences.map((text) => {
        const candidate = { ...block, heading: undefined, text };
        return { text, semantic: retrieveBlocks(question, [candidate], 1).length > 0, overlap: queryTokens(text).filter((token) => originalTokens.includes(token)).length };
      }).sort((a, b) => Number(b.semantic) - Number(a.semantic) || b.overlap - a.overlap)[0]?.text;
      return sentence ? { sourceBlockId: block.id, evidenceText: sentence } : undefined;
    }).filter((source) => source !== undefined && source.evidenceText.length <= 900);
    if (!sources.length) return insufficientAnswer();
    return validateAnswerCandidate({ sources }, blocks, 'local-rules', question);
  }
}
