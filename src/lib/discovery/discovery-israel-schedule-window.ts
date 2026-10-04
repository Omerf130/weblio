const ISRAEL_TIMEZONE = "Asia/Jerusalem";

export type IsraelLocalClock = {
  hour: number;
  minute: number;
};

/** Hour/minute in Asia/Jerusalem for the given instant. */
export function getIsraelLocalClock(reference = new Date()): IsraelLocalClock {
  const formatter = new Intl.DateTimeFormat("en-GB", {
    timeZone: ISRAEL_TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const parts = formatter.formatToParts(reference);
  const hour = Number(parts.find((part) => part.type === "hour")?.value ?? "0");
  const minute = Number(parts.find((part) => part.type === "minute")?.value ?? "0");
  return { hour, minute };
}

/** Daily discovery window: 02:20–02:40 inclusive (Asia/Jerusalem). */
export function isWithinDiscoveryScheduleWindow(reference = new Date()): boolean {
  const { hour, minute } = getIsraelLocalClock(reference);
  if (hour !== 2) {
    return false;
  }
  return minute >= 20 && minute <= 40;
}
