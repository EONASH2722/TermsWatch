import { describe, it, expect } from 'vitest';
import { retrieveBlocks } from './retrieve';
import { demoPolicyBlocks } from '../../data/demoPolicy';
import type { DocumentBlock } from '../../types/document';

const spotifyBlocks: DocumentBlock[] = [
  { id: 'spotify-termination', order: 0, page: 1, heading: '5. Rules, suspension & termination', text: 'Spotify may suspend or end access for breaches, service changes, or legal requirements.' },
  { id: 'spotify-unrelated', order: 1, heading: 'Premium plan', text: 'A Premium plan includes offline listening and payment options.' },
];

describe('retrieval before generation', () => {
  it('finds renewal and sharing clauses using question vocabulary', () => {
    expect(retrieveBlocks('Does this renew automatically?', demoPolicyBlocks)[0].block.id).toBe('demo-renewal');
    expect(retrieveBlocks('Can my information be shared?', demoPolicyBlocks)[0].block.id).toBe('demo-data-sharing');
    expect(retrieveBlocks('How do I cancel?', demoPolicyBlocks)[0].block.id).toBe('demo-cancellation');
  });
  it('abstains when the document has no relevant evidence', () => {
    expect(retrieveBlocks('Does insurance cover earthquake damage?', demoPolicyBlocks)).toEqual([]);
    expect(retrieveBlocks('What is the weather in Paris?', demoPolicyBlocks)).toEqual([]);
    expect(retrieveBlocks('', demoPolicyBlocks)).toEqual([]);
  });
  it('maps account bans to suspension while refusing an unsupported specific cause', () => {
    expect(retrieveBlocks('What all can cause my Spotify account to get banned?', spotifyBlocks)[0]?.block.id).toBe('spotify-termination');
    expect(retrieveBlocks('What all can cause my account to get banned?', spotifyBlocks)[0]?.block.id).toBe('spotify-termination');
    expect(retrieveBlocks('What can cause my account to get banned?', demoPolicyBlocks).map(({ block }) => block.id)).toEqual(['demo-termination']);
    expect(retrieveBlocks('Can my account be banned for wearing red socks?', spotifyBlocks)).toEqual([]);
  });
  it('recognizes common legal-query synonyms', () => {
    const clauses: DocumentBlock[] = [
      { id: 'cancel', order: 0, text: 'Cancellation must be requested before the next billing date.' },
      { id: 'share', order: 1, text: 'We disclose personal data to advertising partners.' },
      { id: 'renew', order: 2, text: 'Your subscription has automatic renewal each month.' },
      { id: 'payment', order: 3, text: 'Billing fees are due at the start of each month.' },
      { id: 'license', order: 4, text: 'You grant a content license for material you upload.' },
      { id: 'retention', order: 5, text: 'We retain account data for twelve months after closure.' },
    ];
    for (const [question, id] of [
      ['How can I cancel?', 'cancel'],
      ['Is my data shared?', 'share'],
      ['Will the plan renew?', 'renew'],
      ['Will I be charged?', 'payment'],
      ['Who owns my content?', 'license'],
      ['When do you delete data?', 'retention'],
    ]) expect(retrieveBlocks(question, clauses)[0]?.block.id).toBe(id);
  });
});
