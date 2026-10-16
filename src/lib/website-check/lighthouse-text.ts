const MARKDOWN_LINK_PATTERN = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g;
const BARE_URL_PATTERN = /https?:\/\/[^\s)\]"'<>]+/g;

export type LighthouseTextSegment =
  | { type: "text"; value: string }
  | { type: "link"; label: string; href: string };

export function extractPrimaryDocumentationUrl(text: string): string | null {
  const trimmed = text.trim();
  if (!trimmed) return null;

  const markdown = trimmed.match(/\[([^\]]*)\]\((https?:\/\/[^\s)]+)\)/);
  if (markdown?.[2]) {
    return markdown[2];
  }

  const bare = trimmed.match(/https?:\/\/[^\s)\]"'<>]+/);
  return bare?.[0] ?? null;
}

export function stripMarkdownLinksForSummary(text: string): string {
  return text
    .replace(MARKDOWN_LINK_PATTERN, "$1")
    .replace(BARE_URL_PATTERN, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

export function parseLighthouseTextSegments(text: string): LighthouseTextSegment[] {
  if (!text.trim()) {
    return [];
  }

  const segments: LighthouseTextSegment[] = [];
  let lastIndex = 0;
  const pattern = new RegExp(MARKDOWN_LINK_PATTERN.source, "g");
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ type: "text", value: text.slice(lastIndex, match.index) });
    }
    segments.push({
      type: "link",
      label: match[1]?.trim() || "Learn more",
      href: match[2],
    });
    lastIndex = pattern.lastIndex;
  }

  if (lastIndex < text.length) {
    const tail = text.slice(lastIndex);
    const barePattern = new RegExp(BARE_URL_PATTERN.source, "g");
    let bareLast = 0;
    let bareMatch: RegExpExecArray | null;
    while ((bareMatch = barePattern.exec(tail)) !== null) {
      if (bareMatch.index > bareLast) {
        segments.push({ type: "text", value: tail.slice(bareLast, bareMatch.index) });
      }
      segments.push({
        type: "link",
        label: bareMatch[0],
        href: bareMatch[0],
      });
      bareLast = barePattern.lastIndex;
    }
    if (bareLast < tail.length) {
      segments.push({ type: "text", value: tail.slice(bareLast) });
    }
  }

  return segments.filter((segment) => segment.type === "link" || segment.value.trim().length > 0);
}
