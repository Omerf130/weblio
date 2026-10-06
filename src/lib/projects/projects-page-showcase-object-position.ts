/** Allowed CSS object-position tokens (subset safe for inline styles). */
const KEYWORD = "(?:left|right|center|top|bottom)";
const PERCENT = "(?:\\d{1,3}(?:\\.\\d{1,2})?)%";
const AXIS = `(?:${PERCENT}|${KEYWORD})`;

const SAFE_OBJECT_POSITION = new RegExp(`^${AXIS}\\s+${AXIS}$`, "i");

export function isValidProjectsPageShowcaseObjectPosition(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > 40) {
    return false;
  }
  return SAFE_OBJECT_POSITION.test(trimmed);
}

/** Returns normalized value or undefined when empty/invalid. */
const DEFAULT_POSITION = { x: 50, y: 50 } as const;

export function formatProjectsPageShowcaseObjectPositionFromPercents(
  x: number,
  y: number
): string {
  const clampedX = Math.min(100, Math.max(0, Math.round(x)));
  const clampedY = Math.min(100, Math.max(0, Math.round(y)));
  return `${clampedX}% ${clampedY}%`;
}

export function parseProjectsPageShowcaseObjectPositionToPercents(
  value: string | undefined
): { x: number; y: number } | null {
  if (!value?.trim()) {
    return null;
  }
  const sanitized = sanitizeProjectsPageShowcaseObjectPosition(value);
  if (!sanitized) {
    return null;
  }
  const match = sanitized.match(/^(\d{1,3}(?:\.\d{1,2})?)%\s+(\d{1,3}(?:\.\d{1,2})?)%$/i);
  if (!match) {
    return null;
  }
  return {
    x: Number(match[1]),
    y: Number(match[2]),
  };
}

export function getDefaultProjectsPageShowcaseObjectPositionPercents(): {
  x: number;
  y: number;
} {
  return { ...DEFAULT_POSITION };
}

export function sanitizeProjectsPageShowcaseObjectPosition(
  value: string | undefined
): string | undefined {
  if (value === undefined) {
    return undefined;
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return undefined;
  }
  if (!isValidProjectsPageShowcaseObjectPosition(trimmed)) {
    return undefined;
  }
  return trimmed;
}
