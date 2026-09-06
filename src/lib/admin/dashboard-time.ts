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

export function zonedTimeToUtc(
  parts: DateParts,
  hour = 0,
  minute = 0,
  second = 0,
  millisecond = 0,
  timeZone = ISRAEL_TIMEZONE
): Date {
  const utcGuess = new Date(
    Date.UTC(parts.year, parts.month - 1, parts.day, hour, minute, second, millisecond)
  );
  const offset = getTimeZoneOffsetMs(utcGuess, timeZone);
  return new Date(utcGuess.getTime() - offset);
}

export function getIsraelNowParts(reference = new Date()): DateParts {
  return getDatePartsInTimeZone(reference, ISRAEL_TIMEZONE);
}

export function getIsraelMonthStart(reference = new Date()): Date {
  const { year, month } = getIsraelNowParts(reference);
  return zonedTimeToUtc({ year, month, day: 1 });
}

export function getIsraelPreviousMonthStart(reference = new Date()): Date {
  const { year, month } = getIsraelNowParts(reference);
  const previousMonth = month === 1 ? 12 : month - 1;
  const previousYear = month === 1 ? year - 1 : year;
  return zonedTimeToUtc({ year: previousYear, month: previousMonth, day: 1 });
}

export function getIsraelDaysAgo(days: number, reference = new Date()): Date {
  const parts = getIsraelNowParts(reference);
  const start = zonedTimeToUtc(parts);
  return new Date(start.getTime() - days * 24 * 60 * 60 * 1000);
}

export function formatIsraelDayLabel(dateKey: string): string {
  const [year, month, day] = dateKey.split("-").map(Number);
  const date = zonedTimeToUtc({ year, month, day });
  return new Intl.DateTimeFormat("he-IL", {
    timeZone: ISRAEL_TIMEZONE,
    day: "numeric",
    month: "short",
  }).format(date);
}

export function formatIsraelDateTime(iso: string): string {
  return new Intl.DateTimeFormat("he-IL", {
    timeZone: ISRAEL_TIMEZONE,
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function buildIsraelDateKeys(start: Date, days: number): string[] {
  const keys: string[] = [];
  const startParts = getDatePartsInTimeZone(start, ISRAEL_TIMEZONE);

  for (let index = 0; index < days; index += 1) {
    const date = new Date(
      zonedTimeToUtc(startParts).getTime() + index * 24 * 60 * 60 * 1000
    );
    const parts = getDatePartsInTimeZone(date, ISRAEL_TIMEZONE);
    keys.push(
      `${parts.year}-${String(parts.month).padStart(2, "0")}-${String(parts.day).padStart(2, "0")}`
    );
  }

  return keys;
}

export function getIsraelPreviousMonthSamePeriodEnd(reference = new Date()): Date {
  const { year, month, day } = getIsraelNowParts(reference);
  const previousMonth = month === 1 ? 12 : month - 1;
  const previousYear = month === 1 ? year - 1 : year;
  const daysInPreviousMonth = new Date(previousYear, previousMonth, 0).getDate();
  const clampedDay = Math.min(day, daysInPreviousMonth);
  return zonedTimeToUtc({ year: previousYear, month: previousMonth, day: clampedDay }, 23, 59, 59, 999);
}
