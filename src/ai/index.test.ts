import { afterEach, describe, expect, it, vi } from 'vitest';
import { demoPolicyBlocks } from '../data/demoPolicy';
import { answerDocumentQuestion, analyzeDocument, fallbackProvider, setAnalysisProvider } from './index';
import { askLocalModel, getModelState } from './localModel';
import type { DocumentBlock } from '../types/document';

const spotifyBlocks: DocumentBlock[] = [{ id: 'spotify-termination', order: 0, page: 1, heading: '5. Rules, suspension & termination', text: 'Spotify may suspend or end access for breaches, service changes, or legal requirements.' }];

vi.mock('./localModel', () => ({ askLocalModel: vi.fn(), getModelState: vi.fn(() => ({ status: 'off' })) }));
afterEach(() => { vi.clearAllMocks(); setAnalysisProvider(fallbackProvider); });
describe('provider fallback', () => {
  it('answers while the optional model is still loading', async () => {
    vi.mocked(getModelState).mockReturnValue({ status: 'loading', progress: 10, message: 'Loading' });
    const answer = await answerDocumentQuestion('Does this renew automatically?', demoPolicyBlocks);
    expect(answer.provider).toBe('local-rules');
    expect(answer.answer).toContain('48 hours');
    expect(askLocalModel).not.toHaveBeenCalled();
  });
  it('rejects fabricated model references and keeps the local answer', async () => {
    vi.mocked(getModelState).mockReturnValue({ status: 'ready', progress: 100, message: 'Ready' });
    vi.mocked(askLocalModel).mockResolvedValue('{"sources":[{"sourceBlockId":"fake","evidenceText":"You receive free lifetime service."}]}');
    expect((await answerDocumentQuestion('Does this renew automatically?', demoPolicyBlocks)).provider).toBe('local-rules');
    expect((await answerDocumentQuestion('Does this cover earthquake damage?', demoPolicyBlocks)).status).toBe('insufficient');
  });
  it('handles model errors without losing verified results', async () => {
    vi.mocked(getModelState).mockReturnValue({ status: 'ready', progress: 100, message: 'Ready' });
    vi.mocked(askLocalModel).mockRejectedValue(new Error('Unavailable'));
    const answer = await answerDocumentQuestion('How do I cancel?', demoPolicyBlocks);
    expect(answer.status).toBe('answered');
    expect(answer.provider).toBe('local-rules');
    setAnalysisProvider({ id: 'broken', version: 'test', initialize: async () => {}, summarize: () => [], answerQuestion: async () => answer, analyzeBlocks: async () => { throw new Error('Unavailable'); } });
    expect((await analyzeDocument(demoPolicyBlocks)).findings.length).toBeGreaterThan(0);
  });
  it('falls back to verified local evidence when a ready model never answers', async () => {
    vi.mocked(getModelState).mockReturnValue({ status: 'ready', progress: 100, message: 'Ready' });
    vi.mocked(askLocalModel).mockImplementation(() => new Promise(() => {}));
    const answer = await answerDocumentQuestion('Does this renew automatically?', demoPolicyBlocks, 20);
    expect(answer.provider).toBe('local-rules');
    expect(answer.answer).toContain('48 hours');
  });
  it('answers the exact reported banned question with supported causes and a verified source', async () => {
    vi.mocked(getModelState).mockReturnValue({ status: 'off', progress: 0, message: '' });
    const answer = await answerDocumentQuestion('What all can cause my Spotify account to get banned', spotifyBlocks);
    expect(answer.status).toBe('answered');
    expect(answer.answer).toMatch(/breaches/i);
    expect(answer.answer).toMatch(/service changes/i);
    expect(answer.answer).toMatch(/legal requirements/i);
    expect(answer.sources[0]).toMatchObject({ sourceBlockId: 'spotify-termination', evidenceText: spotifyBlocks[0].text });
    expect((await answerDocumentQuestion('Can I be banned for wearing red socks?', spotifyBlocks)).status).toBe('insufficient');
  });
  it('does not include account settings cancellation in a ban answer', async () => {
    const answer = await answerDocumentQuestion('What can cause my account to get banned?', demoPolicyBlocks);
    expect(answer.status).toBe('answered');
    expect(answer.sources.map((source) => source.sourceBlockId)).toEqual(['demo-termination']);
    expect(answer.answer).not.toMatch(/cancel|billing/i);
  });
  it('does not cite a pasted section heading as a second ban cause', async () => {
    const blocks: DocumentBlock[] = [
      { id: 'heading', order: 0, text: '5. Rules, suspension & termination' },
      { id: 'clause', order: 1, text: spotifyBlocks[0].text },
    ];
    const answer = await answerDocumentQuestion('What all can cause my Spotify account to get banned', blocks);
    expect(answer.sources.map((source) => source.sourceBlockId)).toEqual(['clause']);
    expect(answer.answer).toMatch(/breaches.*service changes.*legal requirements/is);
  });
});
