import { describe, expect, it } from 'vitest';
import { RuleAnalysisProvider } from './provider';
import { parseModelOutput, validateAnswerCandidate } from './validation';
import { demoPolicyBlocks } from '../data/demoPolicy';
import { retrieveBlocks } from '../core/retrieval/retrieve';

describe('grounded answers', () => {
  it('rejects fabricated IDs and non-exact evidence, including mixed valid/invalid sources', () => {
    const valid = { sourceBlockId: demoPolicyBlocks[0].id, evidenceText: demoPolicyBlocks[0].text };
    for (const sources of [
      [{ ...valid, sourceBlockId: 'invented' }],
      [{ ...valid, evidenceText: 'You can always obtain a full refund.' }],
      [valid, { ...valid, sourceBlockId: 'invented' }],
    ]) expect(validateAnswerCandidate({ sources }, demoPolicyBlocks, 'local-model').status).toBe('insufficient');
  });
  it('never displays unchecked prose or model-supplied source locations', () => {
    const block = demoPolicyBlocks[0];
    const answer = validateAnswerCandidate({ answer: 'Invented claim', sources: [{ sourceBlockId: block.id, evidenceText: block.text, sourceLocation: 'Page 999' }] }, demoPolicyBlocks, 'local-model');
    expect(answer.status).toBe('answered');
    expect(answer.answer).not.toContain('Invented');
    expect(answer.sources[0].sourceLocation).not.toContain('999');
  });
  it('accepts a paraphrased answer request when its separate source quote is exact', () => {
    const block = { id: 'spotify', order: 0, text: 'Spotify may suspend or end access for breaches, service changes, or legal requirements.' };
    const answer = validateAnswerCandidate({
      answer: 'Spotify can restrict access if you break the rules or if legal duties apply.',
      sources: [{ sourceBlockId: block.id, evidenceText: block.text }],
    }, [block], 'local-model', 'What can get my account banned?');
    expect(answer.status).toBe('answered');
    expect(answer.answer).toContain('service changes');
    expect(answer.sources[0].evidenceText).toBe(block.text);
  });
  it('answers locally without a model and refuses absent evidence', async () => {
    const provider = new RuleAnalysisProvider();
    expect((await provider.answerQuestion('Does this renew automatically?', retrieveBlocks('Does this renew automatically?', demoPolicyBlocks).map(({ block }) => block))).sources[0].sourceBlockId).toBe('demo-renewal');
    expect((await provider.answerQuestion('Is earthquake insurance included?', retrieveBlocks('Is earthquake insurance included?', demoPolicyBlocks).map(({ block }) => block))).status).toBe('insufficient');
    expect(parseModelOutput('not JSON')).toBeUndefined();
  });
});
