import { getIsraelLocalClock } from "@/lib/discovery/discovery-israel-schedule-window";

/** `HH:mm` in Asia/Jerusalem for diagnostics (no secrets). */
export function formatIsraelLocalTimeForDiagnostics(reference = new Date()): string {
  const { hour, minute } = getIsraelLocalClock(reference);
  const hh = String(hour).padStart(2, "0");
  const mm = String(minute).padStart(2, "0");
  return `${hh}:${mm}`;
}
