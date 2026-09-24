import type { DocumentBlock, Finding, FindingCategory } from '../../types/document';

const STOP = new Set('a an the this that these those is are was were be been do does did can could should would will may i me my we our us you your they their them it its to of for from at on in and or with as how what when where which who whom about document policy terms say states tell please enough information all get cause causes reason reasons'.split(' '));
const ALIASES: Record<string, string> = {
  banned: 'ban', banning: 'ban', bans: 'ban',
  suspended: 'suspend', suspension: 'suspend', suspending: 'suspend',
  terminated: 'terminate', termination: 'terminate', terminating: 'terminate',
  disabled: 'disable', restrictions: 'restrict', restricted: 'restrict',
  cancelled: 'cancel', canceled: 'cancel', cancellation: 'cancel', cancelling: 'cancel',
  shared: 'share', sharing: 'share', disclosed: 'disclose', disclosure: 'disclose',
  deleted: 'delete', deletion: 'delete', erased: 'erase', retained: 'retain', retention: 'retain',
  renewed: 'renew', renewal: 'renew', recurring: 'recur',
  charged: 'charge', charging: 'charge', billing: 'bill',
  owns: 'own', owned: 'own', ownership: 'own', licenses: 'license', licensing: 'license',
  breaches: 'breach', services: 'service', partners: 'partner',
};

interface Intent {
  category: FindingCategory;
  question: RegExp;
  evidence: RegExp;
  terms: string[];
}

const INTENTS: Intent[] = [
  { category: 'account_termination', question: /\b(?:ban(?:s|ned|ning)?|suspend\w*|terminat\w*|disabl\w*|(?:end|clos\w*|restrict\w*).{0,20}(?:account|access))\b/i, evidence: /\b(?:suspend(?:s|ed|ing)?|terminate(?:s|d)?|ban(?:s|ned|ning)?|disabl\w*|end|clos\w*|restrict\w*)\b.{0,100}\b(?:account|access|service|subscription)\b|\b(?:account|access|service|subscription)\b.{0,50}\b(?:suspended|terminated|banned|disabled|closed|restricted)\b/i, terms: ['ban', 'suspend', 'termination', 'terminate', 'disable', 'account', 'access'] },
  { category: 'cancellation', question: /\b(?:cancel\w*|unsubscribe|stop.{0,20}subscription|end.{0,20}subscription)\b/i, evidence: /\b(?:cancel\w*|unsubscribe|end.{0,20}subscription)\b/i, terms: ['cancel', 'cancellation', 'unsubscribe', 'subscription'] },
  { category: 'data_sharing', question: /\b(?:shar\w*|disclos\w*|giv\w*|sell).{0,35}(?:data|information)|(?:data|information).{0,35}(?:shar\w*|disclos\w*|giv\w*|sell)\b/i, evidence: /\b(?:shar\w*|disclos\w*|transfer\w*|sell).{0,100}(?:data|information|partner|third.part)|(?:data|information).{0,100}(?:shar\w*|disclos\w*)\b/i, terms: ['share', 'sharing', 'data', 'disclose', 'disclosure', 'partner', 'advertising'] },
  { category: 'data_retention', question: /\b(?:delet\w*|eras\w*|retain\w*|retention|how long.{0,30}(?:data|information)|keep.{0,20}(?:data|information))\b/i, evidence: /\b(?:delet\w*|eras\w*|retain\w*|retention|keep|stor\w*).{0,80}(?:data|information|record|account)|(?:data|information).{0,80}(?:delet\w*|eras\w*|retain\w*|stor\w*)\b/i, terms: ['delete', 'deletion', 'erase', 'retain', 'retention', 'data'] },
  { category: 'content_license', question: /(?:content|upload|post).{0,30}(?:own\w*|licen[sc]\w*|use)|(?:own\w*|licen[sc]\w*|use).{0,30}(?:content|upload|post)/i, evidence: /\b(?:licen[sc]\w*|own\w*|intellectual property|copyright)\b/i, terms: ['content', 'license', 'ownership', 'intellectual', 'property'] },
  { category: 'automatic_renewal', question: /\b(?:renew\w*|recurr\w*|auto.?renew\w*)\b/i, evidence: /\b(?:renew\w*|recurr\w*|auto.?renew\w*)\b/i, terms: ['renew', 'renewal', 'automatic', 'subscription'] },
  { category: 'payment', question: /\b(?:pay\w*|charg\w*|bill\w*|fee\w*|refund\w*|cost\w*|price\w*)\b/i, evidence: /\b(?:pay\w*|charg\w*|bill\w*|fee\w*|refund\w*|cost\w*|price\w*)\b/i, terms: ['payment', 'billing', 'fee', 'charge', 'refund'] },
  { category: 'arbitration', question: /\b(?:arbitrat\w*|class action|dispute|sue)\b/i, evidence: /\b(?:arbitrat\w*|class action|dispute|court)\b/i, terms: ['arbitration', 'dispute', 'court'] },
  { category: 'liability', question: /\b(?:liab\w*|damages)\b/i, evidence: /\b(?:liab\w*|damages|losses)\b/i, terms: ['liability', 'liable', 'damages'] },
  { category: 'confidentiality', question: /\b(?:confidential\w*|disclos\w*.{0,20}secret)\b/i, evidence: /\b(?:confidential\w*|non.disclosure|secret)\b/i, terms: ['confidential', 'confidentiality', 'disclosure'] },
  { category: 'employment_restriction', question: /\b(?:non.?compet\w*|employ\w*|solicit\w*)\b/i, evidence: /\b(?:non.?compet\w*|employ\w*|solicit\w*)\b/i, terms: ['employment', 'compete', 'solicitation'] },
];

export function queryTokens(text: string): string[] {
  return [...new Set((text.toLowerCase().match(/[a-z0-9]+/g) ?? [])
    .filter((word) => word.length > 1 && !STOP.has(word))
    .map((word) => ALIASES[word] ?? word))];
}

export interface RetrievedBlock { block: DocumentBlock; score: number }

export function retrieveBlocks(question: string, blocks: DocumentBlock[], limit = 4, findings: Finding[] = []): RetrievedBlock[] {
  const original = queryTokens(question);
  if (!original.length || question.length > 500) return [];
  const intents = INTENTS.filter((intent) => intent.question.test(question));
  const intentTerms = new Set(intents.flatMap((intent) => intent.terms.flatMap(queryTokens)));
  const expanded = [...new Set([...original, ...intentTerms])];
  const specific = original.filter((token) => !intentTerms.has(token));
  const candidates = blocks.filter((block) => block.text !== block.heading && block.text.length >= 15);
  const docs = candidates.map((block) => queryTokens(`${block.heading ?? ''} ${block.text}`));
  const averageLength = docs.reduce((sum, doc) => sum + doc.length, 0) / Math.max(1, docs.length);
  const frequencies = new Map(expanded.map((token) => [token, docs.filter((doc) => doc.includes(token)).length]));
  const verifiedCategories = new Map<string, Set<FindingCategory>>();
  for (const finding of findings) {
    if (finding.verification.status !== 'verified') continue;
    const categories = verifiedCategories.get(finding.sourceBlockId) ?? new Set<FindingCategory>();
    categories.add(finding.category);
    verifiedCategories.set(finding.sourceBlockId, categories);
  }
  return candidates.map((block, index) => {
    const tokens = docs[index];
    const matched = original.filter((word) => tokens.includes(word));
    const specificMatches = specific.filter((word) => tokens.includes(word)).length;
    const matchedIntents = intents.filter((intent) => verifiedCategories.get(block.id)?.has(intent.category) || intent.evidence.test(block.text));
    const categoryMatch = matchedIntents.length > 0;
    // A broad category must not answer a question about an absent specific fact.
    if (specific.length >= 2 && specificMatches < Math.ceil(specific.length / 2)) return { block, score: 0 };
    // When the question names a clause type, shared words such as "account" or
    // "subscription" are not enough to make a different clause an answer.
    if (intents.length > 0 && !categoryMatch) return { block, score: 0 };
    if (!categoryMatch && matched.length / original.length < 0.5) return { block, score: 0 };
    let score = 0;
    for (const token of expanded) {
      if (!tokens.includes(token)) continue;
      const idf = Math.log(1 + (candidates.length - (frequencies.get(token) ?? 0) + 0.5) / ((frequencies.get(token) ?? 0) + 0.5));
      score += (original.includes(token) ? 1.5 : 1) * idf * 2.2 / (1 + 1.2 * (0.25 + 0.75 * tokens.length / Math.max(1, averageLength)));
    }
    if (categoryMatch) score += 3 + (matchedIntents.some((intent) => intent.evidence.test(block.heading ?? '')) ? 2 : 0);
    return { block, score };
  }).filter((entry) => entry.score >= 0.7)
    .sort((a, b) => b.score - a.score || a.block.order - b.block.order)
    .slice(0, limit);
}
