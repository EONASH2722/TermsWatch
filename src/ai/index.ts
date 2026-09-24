import type { DocumentAnswer, DocumentBlock, Finding } from '../types/document';
import { RuleAnalysisProvider, type AnalysisProvider } from './provider';
import { retrieveBlocks } from '../core/retrieval/retrieve';
import { insufficientAnswer, parseModelOutput, validateAnswerCandidate } from './validation';
import { askLocalModel, getModelState } from './localModel';
import { withTimeout } from '../core/async/withTimeout';

export const ANALYSIS_VERSION = 'analysis-1.0.0-r6';
export const fallbackProvider = new RuleAnalysisProvider();
let activeProvider: AnalysisProvider = fallbackProvider;
export function setAnalysisProvider(provider: AnalysisProvider) { activeProvider = provider; }
export async function analyzeDocument(blocks: DocumentBlock[]) {
  try { return await activeProvider.analyzeBlocks(blocks); }
  catch { return fallbackProvider.analyzeBlocks(blocks); }
}
export function summarizeDocument(findings: Finding[], blocks: DocumentBlock[]) { return fallbackProvider.summarize(findings, blocks); }
export async function answerDocumentQuestion(question: string, blocks: DocumentBlock[], modelTimeoutMs = 15000, findings: Finding[] = []): Promise<DocumentAnswer> {
  const selected = retrieveBlocks(question, blocks, 4, findings).map(({ block }) => block);
  if (!selected.length) return insufficientAnswer();
  if (getModelState().status === 'ready') {
    try {
      const text = await withTimeout(askLocalModel(question, selected), modelTimeoutMs, 'The local model took too long.');
      const answer = validateAnswerCandidate(parseModelOutput(text), selected, 'local-model', question);
      if (answer.status === 'answered') return answer;
    } catch { /* The evidence-backed local fallback is always available. */ }
  }
  return fallbackProvider.answerQuestion(question, selected);
}
