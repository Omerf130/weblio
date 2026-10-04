const DEFAULT_HARD_STOP = 950;
const DEFAULT_SOFT_WARN = 780;

function parsePositiveInt(raw: string | undefined, fallback: number): number {
  if (raw === undefined || raw.trim() === "") {
    return fallback;
  }
  const parsed = Number.parseInt(raw.trim(), 10);
  if (!Number.isFinite(parsed) || parsed < 1) {
    return fallback;
  }
  return parsed;
}

export type DiscoveryCreditConfig = {
  monthlyHardStop: number;
  monthlySoftWarn: number;
};

/** Server-only Tavily monthly credit guard configuration. */
export function getDiscoveryCreditConfig(
  source: Record<string, string | undefined> = process.env
): DiscoveryCreditConfig {
  const monthlyHardStop = parsePositiveInt(
    source.DISCOVERY_MONTHLY_CREDIT_HARD_STOP,
    DEFAULT_HARD_STOP
  );
  const monthlySoftWarn = parsePositiveInt(
    source.DISCOVERY_MONTHLY_CREDIT_SOFT_WARN,
    DEFAULT_SOFT_WARN
  );

  return {
    monthlyHardStop,
    monthlySoftWarn: Math.min(monthlySoftWarn, monthlyHardStop),
  };
}
