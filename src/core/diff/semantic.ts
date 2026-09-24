import type { DiffSegment, DocumentBlock, DocumentRecord, PolicyChange, PolicyDiff } from '../../types/document';
import { normalizeText } from '../extraction/normalize';

const STOP_WORDS = new Set([
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from', 'in', 'is', 'it', 'of', 'on', 'or',
  'that', 'the', 'this', 'to', 'was', 'we', 'will', 'with', 'you', 'your',
]);

function comparableText(text?: string): string {
  return normalizeText(text ?? '').toLocaleLowerCase();
}

function meaningfulTokens(text: string): Set<string> {
  const tokens = comparableText(text).match(/[\p{L}\p{N}]+/gu) ?? [];
  return new Set(tokens
    .filter((token) => token.length > 1 && !STOP_WORDS.has(token))
    .map((token) => token.length > 3 && token.endsWith('s') ? token.slice(0, -1) : token));
}

export function textSimilarity(left: string, right: string): number {
  const a = meaningfulTokens(left);
  const b = meaningfulTokens(right);
  if (a.size === 0 && b.size === 0) return comparableText(left) === comparableText(right) ? 1 : 0;
  const intersection = [...a].filter((token) => b.has(token)).length;
  const union = new Set([...a, ...b]).size;
  return union ? intersection / union : 0;
}

function tokenizeWithWhitespace(text: string): string[] {
  return text.match(/\s+|[\p{L}\p{N}’'-]+|[^\s\p{L}\p{N}]/gu) ?? [];
}

function appendSegment(segments: DiffSegment[], kind: DiffSegment['kind'], text: string): void {
  if (!text) return;
  const previous = segments.at(-1);
  if (previous?.kind === kind) previous.text += text;
  else segments.push({ kind, text });
}

export function diffWords(before: string, after: string): DiffSegment[] {
  const left = tokenizeWithWhitespace(before);
  const right = tokenizeWithWhitespace(after);
  if (left.length * right.length > 160_000) {
    return [
      { kind: 'removed', text: before },
      { kind: 'added', text: after },
    ];
  }

  const table = Array.from({ length: left.length + 1 }, () => new Uint16Array(right.length + 1));
  for (let i = left.length - 1; i >= 0; i -= 1) {
    for (let j = right.length - 1; j >= 0; j -= 1) {
      table[i][j] = left[i] === right[j]
        ? table[i + 1][j + 1] + 1
        : Math.max(table[i + 1][j], table[i][j + 1]);
    }
  }

  const segments: DiffSegment[] = [];
  let i = 0;
  let j = 0;
  while (i < left.length || j < right.length) {
    if (i < left.length && j < right.length && left[i] === right[j]) {
      appendSegment(segments, 'equal', left[i]);
      i += 1;
      j += 1;
    } else if (j < right.length && (i === left.length || table[i][j + 1] >= table[i + 1][j])) {
      appendSegment(segments, 'added', right[j]);
      j += 1;
    } else {
      appendSegment(segments, 'removed', left[i]);
      i += 1;
    }
  }
  return segments;
}

function headingMatch(left?: string, right?: string): boolean {
  const a = comparableText(left);
  const b = comparableText(right);
  return Boolean(a && b && (a === b || textSimilarity(a, b) >= 0.7));
}

function bestPreviousMatch(current: DocumentBlock, previous: DocumentBlock[], used: Set<string>) {
  const candidates = previous
    .filter((block) => !used.has(block.id))
    .map((block) => {
      const bodySimilarity = textSimilarity(block.text, current.text);
      const headingBonus = headingMatch(block.heading, current.heading) ? 0.28 : 0;
      const orderDistance = Math.abs(block.order - current.order);
      const orderBonus = Math.max(0, 0.08 - orderDistance * 0.01);
      return { block, score: Math.min(1, bodySimilarity + headingBonus + orderBonus), bodySimilarity };
    })
    .sort((a, b) => b.score - a.score);
  const best = candidates[0];
  if (!best || (best.score < 0.42 && !headingMatch(best.block.heading, current.heading))) return undefined;
  return best;
}

function changeId(kind: PolicyChange['kind'], before?: DocumentBlock, after?: DocumentBlock): string {
  return `${kind}-${before?.id ?? 'none'}-${after?.id ?? 'none'}`;
}

export function buildSemanticDiff(previous: DocumentRecord, current: DocumentRecord): PolicyDiff {
  const usedPrevious = new Set<string>();
  const changes: PolicyChange[] = [];
  let unchanged = 0;

  for (const currentBlock of current.blocks) {
    const exact = previous.blocks.find((block) =>
      !usedPrevious.has(block.id) && comparableText(block.text) === comparableText(currentBlock.text),
    );
    if (exact) {
      usedPrevious.add(exact.id);
      unchanged += 1;
      continue;
    }

    const match = bestPreviousMatch(currentBlock, previous.blocks, usedPrevious);
    if (match) {
      usedPrevious.add(match.block.id);
      changes.push({
        id: changeId('modified', match.block, currentBlock),
        kind: 'modified',
        heading: currentBlock.heading ?? match.block.heading,
        beforeBlockId: match.block.id,
        afterBlockId: currentBlock.id,
        beforeText: match.block.text,
        afterText: currentBlock.text,
        similarity: match.bodySimilarity,
        segments: diffWords(match.block.text, currentBlock.text),
      });
      continue;
    }

    changes.push({
      id: changeId('added', undefined, currentBlock),
      kind: 'added',
      heading: currentBlock.heading,
      afterBlockId: currentBlock.id,
      afterText: currentBlock.text,
      segments: [{ kind: 'added', text: currentBlock.text }],
    });
  }

  previous.blocks
    .filter((block) => !usedPrevious.has(block.id))
    .forEach((block) => changes.push({
      id: changeId('removed', block),
      kind: 'removed',
      heading: block.heading,
      beforeBlockId: block.id,
      beforeText: block.text,
      segments: [{ kind: 'removed', text: block.text }],
    }));

  return {
    previousDocumentId: previous.id,
    currentDocumentId: current.id,
    added: changes.filter((change) => change.kind === 'added').length,
    removed: changes.filter((change) => change.kind === 'removed').length,
    modified: changes.filter((change) => change.kind === 'modified').length,
    unchanged,
    changes,
  };
}
