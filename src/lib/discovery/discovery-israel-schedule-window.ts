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

/** Daily discovery window: entire local hour 02:00–02:59 (Asia/Jerusalem). */
export function isWithinDiscoveryScheduleWindow(reference = new Date()): boolean {
  const { hour } = getIsraelLocalClock(reference);
  return hour === 2;
}
