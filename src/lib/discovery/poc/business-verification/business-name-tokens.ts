const LEGAL_SUFFIX_PATTERN =
  /\b(בע["״']?מ|בעמ|ltd|limited|inc|corp|llc|gmbh|s\.?a\.?)\b/gi;

const TOKEN_SPLIT = /[\s\-_|/\\.,;:(){}'"`]+/;

export function normalizeBusinessNameTokens(displayName: string): string[] {
  let normalized = displayName.trim().toLowerCase();
  normalized = normalized.replace(LEGAL_SUFFIX_PATTERN, " ");
  normalized = normalized.replace(/[^\p{L}\p{N}\s-]/gu, " ");

  const rawTokens = normalized.split(TOKEN_SPLIT).map((t) => t.trim()).filter(Boolean);

  const stop = new Set([
    "the",
    "and",
    "salon",
    "hair",
    "beauty",
    "studio",
    "מספרה",
    "יופי",
  ]);

  const tokens: string[] = [];
  for (const token of rawTokens) {
    if (token.length < 2) {
      continue;
    }
    if (stop.has(token)) {
      continue;
    }
    if (!tokens.includes(token)) {
      tokens.push(token);
    }
  }

  return tokens;
}

export function countTokenMatches(
  tokens: readonly string[],
  ...haystacks: readonly string[]
): number {
  if (tokens.length === 0) {
    return 0;
  }
  const combined = haystacks.join(" ").toLowerCase();
  let matches = 0;
  for (const token of tokens) {
    if (token.length >= 2 && combined.includes(token)) {
      matches += 1;
    }
  }
  return matches;
}

export function hostnameContainsStrongToken(
  tokens: readonly string[],
  hostname: string
): boolean {
  const host = hostname.toLowerCase().replace(/^www\./, "");
  for (const token of tokens) {
    if (token.length >= 4 && host.includes(token)) {
      return true;
    }
  }
  return false;
}
