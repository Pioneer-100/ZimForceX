/**
 * Utility to compare candidate profile name with certificate recipient name.
 * Normalizes strings, splits into alphabetic tokens, and requires at least 
 * a minimum threshold of token overlap (e.g. at least 2 tokens match, like First & Last name).
 */
export function namesMatch(profileName: string, certName: string): boolean {
  if (!profileName || !certName) return false;

  const norm1 = profileName.toLowerCase().replace(/[^a-z0-9 ]/g, "").split(/\s+/).filter(Boolean);
  const norm2 = certName.toLowerCase().replace(/[^a-z0-9 ]/g, "").split(/\s+/).filter(Boolean);

  if (norm1.length === 0 || norm2.length === 0) return false;

  // Check token intersection
  const set1 = new Set(norm1);
  const set2 = new Set(norm2);

  const intersection = [...set1].filter((x) => set2.has(x));
  
  // Require that at least 2 words match if both are multi-token.
  // If one of the names is very short (1 word), match that 1 word.
  const requiredMatches = Math.min(2, Math.min(norm1.length, norm2.length));
  
  return intersection.length >= requiredMatches;
}
