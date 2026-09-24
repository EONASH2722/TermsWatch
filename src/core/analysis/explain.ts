// Preserve the clause's actual conditions instead of substituting a category label.
export function explainEvidence(evidenceText: string): string {
  const sentence = evidenceText.replace(/\s+/g, ' ').trim();
  const attributed = /^We\b/.test(sentence)
    ? sentence.replace(/^We\b/, 'The provider').replace(/\bour\b/gi, 'its').replace(/\bus\b/gi, 'it')
    : sentence.replace(/\bgrant us\b/i, 'grant the provider');
  const plain = attributed
    .replace(/\bshall\b/gi, 'must')
    .replace(/\bprior to\b/gi, 'before')
    .replace(/\binformation about you\b/gi, 'your information');
  const termination = plain.match(/^(.{2,60}?)\s+may\s+(?:(?:suspend|terminate|end|disable)\s+or\s+)?(?:suspend|terminate|end|disable)\s+(?:your\s+)?(?:account|access)\s+for\s+([^.!?]+)[.!?]?$/i);
  if (termination) return `${termination[1]} may suspend or end access because of ${termination[2].trim().replace(/[.!?]$/, '')}.`;
  return plain.replace(/\bwill automatically renew for another monthly term\b/i, 'renews each month');
}
