export function normalizeText(text: string): string {
  return text
    .normalize('NFKC')
    .replace(/[\u00a0\u2007\u202f]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function normalizeForHash(text: string): string {
  return normalizeText(text)
    .replace(/\s+([,.;:!?])/g, '$1')
    .replace(/([([{])\s+/g, '$1')
    .replace(/\s+([)\]}])/g, '$1');
}

export async function sha256(text: string): Promise<string> {
  const bytes = new TextEncoder().encode(normalizeForHash(text));
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

export function documentText(blocks: { text: string }[]): string {
  return blocks.map((block) => normalizeText(block.text)).filter(Boolean).join('\n\n');
}
