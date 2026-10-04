import { getIsraelNowParts } from "@/lib/admin/dashboard-time";

/** Stable `YYYY-MM-DD` calendar key in Asia/Jerusalem. */
export function getIsraelCalendarDateKey(reference = new Date()): string {
  const { year, month, day } = getIsraelNowParts(reference);
  const mm = String(month).padStart(2, "0");
  const dd = String(day).padStart(2, "0");
  return `${year}-${mm}-${dd}`;
}

/** Deterministic non-negative integer for rotation from an Israel calendar day. */
export function getIsraelCalendarDayNumber(reference = new Date()): number {
  const { year, month, day } = getIsraelNowParts(reference);
  return year * 372 + month * 31 + day;
}
