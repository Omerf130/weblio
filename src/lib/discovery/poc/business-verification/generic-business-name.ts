const GENERIC_NAME_PATTERNS = [
  /^beauty house$/i,
  /^beauty salon$/i,
  /^hair studio$/i,
  /^hair boutique$/i,
  /^barber shop$/i,
  /^barbershop$/i,
  /^beauty center$/i,
  /^beauty centre$/i,
  /^מספרה$/i,
  /^מכון יופי$/i,
  /^סלון יופי$/i,
];

/** Tokens too common to prove identity on their own. */
export const GENERIC_IDENTITY_TOKENS = new Set([
  "beauty",
  "house",
  "salon",
  "hair",
  "studio",
  "barber",
  "barbershop",
  "shop",
  "boutique",
  "center",
  "centre",
  "classic",
  "מספרה",
  "יופי",
  "שיער",
  "גברים",
  "נשים",
  "ספר",
  "haifa",
  "חיפה",
  "levi",
  "לוי",
  "shop",
]);

export function isGenericBusinessDisplayName(displayName: string): boolean {
  const trimmed = displayName.trim();
  if (!trimmed) {
    return false;
  }

  for (const pattern of GENERIC_NAME_PATTERNS) {
    if (pattern.test(trimmed)) {
      return true;
    }
  }

  const withoutPunctuation = trimmed.replace(/[|–—-].*$/, "").trim();
  for (const pattern of GENERIC_NAME_PATTERNS) {
    if (pattern.test(withoutPunctuation)) {
      return true;
    }
  }

  return false;
}

export function filterDistinctiveTokens(tokens: readonly string[]): string[] {
  return tokens.filter(
    (token) => token.length >= 2 && !GENERIC_IDENTITY_TOKENS.has(token.toLowerCase())
  );
}

function tokenAppearsAsWord(token: string, text: string): boolean {
  const normalizedToken = token.trim().toLowerCase();
  if (normalizedToken.length < 2) {
    return false;
  }
  const escaped = normalizedToken.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(`(^|[^\\p{L}\\p{N}])${escaped}([^\\p{L}\\p{N}]|$)`, "iu");
  return pattern.test(text.toLowerCase());
}

export function countDistinctiveTokenMatches(
  tokens: readonly string[],
  ...haystacks: readonly string[]
): number {
  const distinctive = filterDistinctiveTokens(tokens);
  if (distinctive.length === 0) {
    return 0;
  }
  const combined = haystacks.join(" ");
  let matches = 0;
  for (const token of distinctive) {
    if (tokenAppearsAsWord(token, combined)) {
      matches += 1;
    }
  }
  return matches;
}
