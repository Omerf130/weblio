/** Comma-separated technologies editor — matches Project admin form semantics. */

export function formatTechnologiesForInput(technologies: string[]): string {
  return technologies.join(", ");
}

export function parseTechnologiesFromInput(value: string): string[] {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 20);
}
