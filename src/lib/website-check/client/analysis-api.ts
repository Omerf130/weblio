import type { PublicWebsiteAnalysisRunDto } from "@/lib/website-check/public-run-dto";

export type WebsiteCheckConfigResponse = {
  liveAvailable: boolean;
};

export type CreateAnalysisRunResponse = {
  run: PublicWebsiteAnalysisRunDto;
};

export type GetAnalysisRunResponse = {
  run: PublicWebsiteAnalysisRunDto;
};

export type AnalysisApiErrorCode =
  | "network"
  | "invalid_response"
  | "bad_request"
  | "rate_limit"
  | "unavailable"
  | "unknown";

export class AnalysisApiError extends Error {
  readonly code: AnalysisApiErrorCode;
  readonly httpStatus?: number;

  constructor(message: string, code: AnalysisApiErrorCode, httpStatus?: number) {
    super(message);
    this.code = code;
    this.httpStatus = httpStatus;
  }
}

export type AnalysisFetchImpl = (
  input: RequestInfo | URL,
  init?: RequestInit
) => Promise<Response>;

const DEFAULT_GENERIC_ERROR = "לא ניתן להתחיל ניתוח כרגע. נסו שוב מאוחר יותר.";

function mapPostError(status: number, body: { error?: string } | null): AnalysisApiError {
  const message = body?.error?.trim() || DEFAULT_GENERIC_ERROR;
  if (status === 400) {
    return new AnalysisApiError(message, "bad_request", status);
  }
  if (status === 429) {
    return new AnalysisApiError(message, "rate_limit", status);
  }
  if (status === 503) {
    return new AnalysisApiError(message, "unavailable", status);
  }
  return new AnalysisApiError(message, "unknown", status);
}

async function parseJsonResponse<T>(response: Response): Promise<T> {
  try {
    return (await response.json()) as T;
  } catch {
    throw new AnalysisApiError(DEFAULT_GENERIC_ERROR, "invalid_response", response.status);
  }
}

export async function fetchWebsiteCheckConfig(
  fetchImpl: AnalysisFetchImpl = fetch
): Promise<WebsiteCheckConfigResponse> {
  const response = await fetchImpl("/api/website-check/config", {
    method: "GET",
    headers: { Accept: "application/json" },
    cache: "no-store",
  });

  if (!response.ok) {
    return { liveAvailable: false };
  }

  try {
    const data = await parseJsonResponse<WebsiteCheckConfigResponse>(response);
    return { liveAvailable: data.liveAvailable === true };
  } catch {
    return { liveAvailable: false };
  }
}

export async function createWebsiteCheckRun(
  url: string,
  options?: { fetchImpl?: AnalysisFetchImpl; signal?: AbortSignal }
): Promise<{ run: PublicWebsiteAnalysisRunDto; httpStatus: number }> {
  const fetchImpl = options?.fetchImpl ?? fetch;

  let response: Response;
  try {
    response = await fetchImpl("/api/website-check/runs", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ url }),
      signal: options?.signal,
    });
  } catch {
    throw new AnalysisApiError(
      "שגיאת רשת. בדקו את החיבור ונסו שוב.",
      "network"
    );
  }

  if (!response.ok) {
    let body: { error?: string } | null = null;
    try {
      body = await response.json();
    } catch {
      body = null;
    }
    throw mapPostError(response.status, body);
  }

  const data = await parseJsonResponse<CreateAnalysisRunResponse>(response);
  if (!data?.run?.id) {
    throw new AnalysisApiError(DEFAULT_GENERIC_ERROR, "invalid_response", response.status);
  }

  return { run: data.run, httpStatus: response.status };
}

export async function getWebsiteCheckRun(
  runId: string,
  options?: { fetchImpl?: AnalysisFetchImpl; signal?: AbortSignal }
): Promise<PublicWebsiteAnalysisRunDto> {
  const fetchImpl = options?.fetchImpl ?? fetch;

  let response: Response;
  try {
    response = await fetchImpl(`/api/website-check/runs/${encodeURIComponent(runId)}`, {
      method: "GET",
      headers: { Accept: "application/json" },
      cache: "no-store",
      signal: options?.signal,
    });
  } catch {
    throw new AnalysisApiError(
      "שגיאת רשת זמנית. מנסים שוב…",
      "network"
    );
  }

  if (!response.ok) {
    throw new AnalysisApiError("לא ניתן לעדכן את סטטוס הניתוח.", "unknown", response.status);
  }

  const data = await parseJsonResponse<GetAnalysisRunResponse>(response);
  if (!data?.run?.id) {
    throw new AnalysisApiError("תשובה לא תקינה מהשרת.", "invalid_response", response.status);
  }

  return data.run;
}
