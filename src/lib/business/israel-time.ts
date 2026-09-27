const ISRAEL_TIMEZONE = "Asia/Jerusalem";

type DateParts = {
  year: number;
  month: number;
  day: number;
};

function getDatePartsInTimeZone(date: Date, timeZone: string): DateParts {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  const parts = formatter.formatToParts(date);
  const year = Number(parts.find((part) => part.type === "year")?.value);
  const month = Number(parts.find((part) => part.type === "month")?.value);
  const day = Number(parts.find((part) => part.type === "day")?.value);

  return { year, month, day };
}

function getTimeZoneOffsetMs(date: Date, timeZone: string): number {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    timeZoneName: "shortOffset",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  const timeZoneName =
    formatter.formatToParts(date).find((part) => part.type === "timeZoneName")?.value ??
    "GMT";

  const match = timeZoneName.match(/GMT([+-]\d{1,2})(?::(\d{2}))?/);
  if (!match) {
    return 0;
  }

  const hours = Number(match[1]);
  const minutes = Number(match[2] ?? "0");
  return (hours * 60 + Math.sign(hours) * minutes) * 60_000;
}

function zonedTimeToUtc(parts: DateParts, hour = 0, minute = 0, second = 0, ms = 0): Date {
  const utcGuess = new Date(
    Date.UTC(parts.year, parts.month - 1, parts.day, hour, minute, second, ms)
  );
  const offset = getTimeZoneOffsetMs(utcGuess, ISRAEL_TIMEZONE);
  return new Date(utcGuess.getTime() - offset);
}

export function getIsraelTodayRange(reference = new Date()): { start: Date; end: Date } {
  const parts = getDatePartsInTimeZone(reference, ISRAEL_TIMEZONE);
  const start = zonedTimeToUtc(parts, 0, 0, 0, 0);
  const end = zonedTimeToUtc(parts, 23, 59, 59, 999);
  return { start, end };
}

export function getIsraelDaysFromNow(days: number, reference = new Date()): Date {
  const parts = getDatePartsInTimeZone(reference, ISRAEL_TIMEZONE);
  const todayEnd = zonedTimeToUtc(parts, 23, 59, 59, 999);
  return new Date(todayEnd.getTime() + days * 24 * 60 * 60 * 1000);
}

export function formatIsraelDate(iso: string): string {
  return new Intl.DateTimeFormat("he-IL", {
    timeZone: ISRAEL_TIMEZONE,
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(iso));
}
