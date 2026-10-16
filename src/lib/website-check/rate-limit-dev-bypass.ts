export type WebsiteCheckRateLimitBypassEnv = {
  nodeEnv?: string;
  devBypassFlag?: string;
};

/**
 * Development-only bypass for local manual testing.
 * Never active in production, regardless of env flag.
 */
function readNodeEnv(env: WebsiteCheckRateLimitBypassEnv): string | undefined {
  if (Object.prototype.hasOwnProperty.call(env, "nodeEnv")) {
    return env.nodeEnv;
  }
  return process.env.NODE_ENV;
}

function readDevBypassFlag(env: WebsiteCheckRateLimitBypassEnv): string | undefined {
  if (Object.prototype.hasOwnProperty.call(env, "devBypassFlag")) {
    return env.devBypassFlag;
  }
  return process.env.WEBSITE_CHECK_DEV_BYPASS_RATE_LIMIT;
}

export function isWebsiteCheckDevRateLimitBypassEnabled(
  env: WebsiteCheckRateLimitBypassEnv = {}
): boolean {
  const nodeEnv = readNodeEnv(env);
  if (nodeEnv !== "development") {
    return false;
  }
  const flag = readDevBypassFlag(env);
  return flag === "true";
}
