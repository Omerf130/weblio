/** Comma-separated technologies editor — matches Project admin form semantics. */

export const MAX_TECHNOLOGY_TAG_COUNT = 20;
export const MAX_TECHNOLOGY_TAG_LENGTH = 40;

export function formatTechnologiesForInput(technologies: string[]): string {
  return technologies.join(", ");
}

export function normalizeTechnologiesList(values: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const raw of values) {
    const item = raw.trim();
    if (!item) {
      continue;
    }
    const clipped = item.slice(0, MAX_TECHNOLOGY_TAG_LENGTH);
    const key = clipped.toLowerCase();
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    result.push(clipped);
    if (result.length >= MAX_TECHNOLOGY_TAG_COUNT) {
      break;
    }
  }

  return result;
}

export function parseTechnologiesFromInput(value: string): string[] {
  return normalizeTechnologiesList(value.split(","));
}

/** Commit raw editor text to a normalized list + display string (e.g. on blur/apply). */
export function commitTechnologiesInput(value: string): {
  text: string;
  technologies: string[];
} {
  const technologies = parseTechnologiesFromInput(value);
  return {
    text: formatTechnologiesForInput(technologies),
    technologies,
  };
}
