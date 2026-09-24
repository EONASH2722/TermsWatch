import type {
  AnalysisResult,
  Attention,
  DocumentBlock,
  Finding,
  FindingCategory,
} from '../../types/document';
import { verifyFinding } from '../evidence/verify';
import { sourceLocation } from '../evidence/location';
import { explainEvidence } from './explain';

export interface AnalysisEngine {
  analyzeDocument(blocks: DocumentBlock[]): Promise<AnalysisResult>;
  analyzeClause(block: DocumentBlock): Promise<Finding[]>;
  summarizeDocument(findings: Finding[], blocks: DocumentBlock[]): string[];
}

interface Rule {
  category: FindingCategory;
  attention: Attention;
  title: string;
  pattern: RegExp;
  confidence: number;
}

const RULES: Rule[] = [
  { category: 'intellectual_property', attention: 'medium', title: 'Intellectual property', pattern: /\b(intellectual property|copyright|you (?:retain|own)|ownership of)\b/i, confidence: 0.88 },
  { category: 'confidentiality', attention: 'medium', title: 'Confidentiality', pattern: /\b(confidential(?:ity| information)?|non-disclosure)\b/i, confidence: 0.88 },
  { category: 'employment_restriction', attention: 'high', title: 'Employment restriction', pattern: /\b(non-compet\w*|non-solicit\w*|competing (?:business|employ\w*)|restrict\w* employment)\b/i, confidence: 0.87 },
  { category: 'user_obligation', attention: 'info', title: 'Your obligations', pattern: /\b(you (?:must|shall|are required to)|your responsibility)\b/i, confidence: 0.84 },
  { category: 'company_obligation', attention: 'info', title: 'Company obligations', pattern: /\b(we (?:must|shall|are required to)|(?:company|provider) (?:must|shall))\b/i, confidence: 0.84 },
  {
    category: 'data_sharing',
    attention: 'high',
    title: 'Data sharing',
    pattern: /\b(share|disclos\w*|transfer)\b.{0,100}\b(third part|partner|advertis|analytics|affiliate)/i,
    confidence: 0.93,
  },
  {
    category: 'automatic_renewal',
    attention: 'high',
    title: 'Automatic renewal',
    pattern: /\b(automatically renew|renew(?:s|ed)? automatically|automatic renewal|auto-renew|recurring subscription)/i,
    confidence: 0.96,
  },
  {
    category: 'cancellation',
    attention: 'medium',
    title: 'Cancellation',
    pattern: /\b(cancel|cancellation)\b/i,
    confidence: 0.9,
  },
  {
    category: 'account_termination',
    attention: 'high',
    title: 'Account termination',
    pattern: /\b(terminate|suspend|disable)\b.{0,100}\b(account|access|service|agreement)/i,
    confidence: 0.92,
  },
  {
    category: 'content_license',
    attention: 'medium',
    title: 'Content license',
    pattern: /\b(license|licence)\b.{0,120}\b(content|post|submission|worldwide|royalty-free|sublicens)/i,
    confidence: 0.9,
  },
  {
    category: 'data_retention',
    attention: 'medium',
    title: 'Data retention',
    pattern: /\b(retain|retention|keep|store)\b.{0,100}\b(data|information|records|account)/i,
    confidence: 0.88,
  },
  {
    category: 'arbitration',
    attention: 'high',
    title: 'Arbitration',
    pattern: /\b(binding arbitration|arbitration|class action waiver)\b/i,
    confidence: 0.97,
  },
  {
    category: 'indemnification',
    attention: 'high',
    title: 'Indemnification',
    pattern: /\b(indemnif\w*|hold harmless|defend us)\b/i,
    confidence: 0.96,
  },
  {
    category: 'liability',
    attention: 'medium',
    title: 'Limits on liability',
    pattern: /\b(limitation of liability|not be liable|maximum liability|liability is limited)\b/i,
    confidence: 0.94,
  },
  {
    category: 'payment',
    attention: 'medium',
    title: 'Payment terms',
    pattern: /\b(fees?|payments?|billing|charged|refund(?:able|s)?)\b[^.!?]{0,100}\b(non-refundable|due|method|price|subscription|purchase)/i,
    confidence: 0.86,
  },
  {
    category: 'governing_law',
    attention: 'low',
    title: 'Governing law',
    pattern: /\b(governed by|governing law|exclusive jurisdiction|venue)\b/i,
    confidence: 0.95,
  },
  {
    category: 'privacy',
    attention: 'low',
    title: 'Personal information',
    pattern: /\b(collect|process|use)\b.{0,100}\b(personal data|personal information|usage data)/i,
    confidence: 0.84,
  },
];

const ATTENTION_WEIGHT: Record<Attention, number> = { info: 0, low: 1, medium: 2, high: 3 };

function exactSentence(text: string, matchIndex: number): string {
  const before = text.slice(0, matchIndex);
  const startBoundary = Math.max(before.lastIndexOf('. '), before.lastIndexOf('! '), before.lastIndexOf('? '), before.lastIndexOf('\n'));
  const start = startBoundary < 0 ? 0 : startBoundary + (text[startBoundary] === '\n' ? 1 : 2);
  const after = text.slice(matchIndex);
  const candidates = ['. ', '! ', '? ', '\n']
    .map((boundary) => after.indexOf(boundary))
    .filter((index) => index >= 0);
  const relativeEnd = candidates.length ? Math.min(...candidates) + 1 : after.length;
  return text.slice(start, Math.min(text.length, matchIndex + relativeEnd)).trim().slice(0, 520);
}

function findingFromRule(block: DocumentBlock, rule: Rule, match: RegExpExecArray, index: number): Finding {
  const base = {
    id: `finding-${block.id}-${rule.category}-${index}`,
    sourceBlockId: block.id,
    category: rule.category,
    attention: rule.attention,
    title: rule.title,
    evidenceText: exactSentence(block.text, match.index),
    confidence: rule.confidence,
    sourceLocation: sourceLocation(block),
  };
  return verifyFinding({ ...base, explanation: explainEvidence(base.evidenceText) }, [block]);
}

export class LocalRuleAnalysisEngine implements AnalysisEngine {
  async analyzeClause(block: DocumentBlock): Promise<Finding[]> {
    if (block.heading === block.text && block.text.length < 160) return [];
    const findings: Finding[] = [];
    RULES.forEach((rule, index) => {
      const match = new RegExp(rule.pattern.source, rule.pattern.flags).exec(block.text);
      if (match) findings.push(findingFromRule(block, rule, match, index));
    });
    return findings;
  }

  async analyzeDocument(blocks: DocumentBlock[]): Promise<AnalysisResult> {
    const nested: Finding[][] = [];
    for (let index = 0; index < blocks.length; index += 1) {
      nested.push(await this.analyzeClause(blocks[index]));
      if (index % 40 === 39) await new Promise((resolve) => setTimeout(resolve, 0));
    }
    const sourceOrder = new Map(blocks.map((block) => [block.id, block.order]));
    const findings = nested
      .flat()
      .sort((a, b) =>
        ATTENTION_WEIGHT[b.attention] - ATTENTION_WEIGHT[a.attention]
        || (sourceOrder.get(a.sourceBlockId) ?? 0) - (sourceOrder.get(b.sourceBlockId) ?? 0)
        || b.confidence - a.confidence,
      );
    return { findings, summary: this.summarizeDocument(findings, blocks) };
  }

  summarizeDocument(findings: Finding[], blocks: DocumentBlock[]): string[] {
    const unique = new Map<FindingCategory, Finding>();
    findings
      .filter((finding) => finding.verification.status === 'verified')
      .forEach((finding) => {
        if (!unique.has(finding.category)) unique.set(finding.category, finding);
      });
    const summary = [...new Set([...unique.values()].map((finding) => finding.explanation))].slice(0, 5);
    if (summary.length === 0 && blocks.length > 0) {
      summary.push('No common attention patterns were detected by the local rule-based analysis.');
    }
    return summary;
  }
}
