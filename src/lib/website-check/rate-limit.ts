import { connectDB } from "@/lib/db/mongoose";
import {
  WEBSITE_CHECK_RATE_LIMIT_PER_DAY,
  WEBSITE_CHECK_RATE_LIMIT_PER_HOUR,
} from "@/lib/website-check/constants";
import { isWebsiteCheckDevRateLimitBypassEnabled } from "@/lib/website-check/rate-limit-dev-bypass";
import { WebsiteCheckRateLimit } from "@/models/WebsiteCheckRateLimit";

export type WebsiteCheckRateLimitViolation = "hour" | "day";

export class WebsiteCheckRateLimitError extends Error {
  readonly violation: WebsiteCheckRateLimitViolation;

  constructor(violation: WebsiteCheckRateLimitViolation) {
    super(violation);
    this.violation = violation;
  }
}

export function formatWebsiteCheckHourBucket(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  const h = String(date.getUTCHours()).padStart(2, "0");
  return `${y}${m}${d}${h}`;
}

export function formatWebsiteCheckDayBucket(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${y}${m}${d}`;
}

export type RateLimitCounters = {
  hourBucket: string;
  hourCount: number;
  dayBucket: string;
  dayCount: number;
};

export function nextRateLimitCounters(
  current: RateLimitCounters | null,
  now: Date
): RateLimitCounters {
  const hourBucket = formatWebsiteCheckHourBucket(now);
  const dayBucket = formatWebsiteCheckDayBucket(now);

  if (!current) {
    return { hourBucket, hourCount: 0, dayBucket, dayCount: 0 };
  }

  return {
    hourBucket,
    hourCount: current.hourBucket === hourBucket ? current.hourCount : 0,
    dayBucket,
    dayCount: current.dayBucket === dayBucket ? current.dayCount : 0,
  };
}

export function evaluateRateLimitIncrement(
  counters: RateLimitCounters
): WebsiteCheckRateLimitViolation | null {
  if (counters.hourCount >= WEBSITE_CHECK_RATE_LIMIT_PER_HOUR) {
    return "hour";
  }
  if (counters.dayCount >= WEBSITE_CHECK_RATE_LIMIT_PER_DAY) {
    return "day";
  }
  return null;
}

export function incrementRateLimitCounters(counters: RateLimitCounters): RateLimitCounters {
  return {
    ...counters,
    hourCount: counters.hourCount + 1,
    dayCount: counters.dayCount + 1,
  };
}

function isDuplicateKeyError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code: number }).code === 11000
  );
}

export async function consumeWebsiteCheckRateLimit(clientKey: string): Promise<void> {
  if (isWebsiteCheckDevRateLimitBypassEnabled()) {
    return;
  }

  await connectDB();

  const now = new Date();

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const existing = await WebsiteCheckRateLimit.findOne({ clientKey }).lean<{
      hourBucket: string;
      hourCount: number;
      dayBucket: string;
      dayCount: number;
    }>();

    const base = nextRateLimitCounters(existing, now);
    const violation = evaluateRateLimitIncrement(base);
    if (violation) {
      throw new WebsiteCheckRateLimitError(violation);
    }

    const next = incrementRateLimitCounters(base);

    if (!existing) {
      try {
        await WebsiteCheckRateLimit.create({
          clientKey,
          hourBucket: next.hourBucket,
          hourCount: next.hourCount,
          dayBucket: next.dayBucket,
          dayCount: next.dayCount,
        });
        return;
      } catch (error: unknown) {
        if (isDuplicateKeyError(error)) {
          continue;
        }
        throw error;
      }
    }

    const updated = await WebsiteCheckRateLimit.findOneAndUpdate(
      {
        clientKey,
        hourBucket: existing.hourBucket,
        hourCount: existing.hourCount,
        dayBucket: existing.dayBucket,
        dayCount: existing.dayCount,
      },
      {
        $set: {
          hourBucket: next.hourBucket,
          hourCount: next.hourCount,
          dayBucket: next.dayBucket,
          dayCount: next.dayCount,
        },
      },
      { new: true }
    ).lean();

    if (updated) {
      return;
    }
  }

  throw new Error("Website check rate limit update conflict");
}
