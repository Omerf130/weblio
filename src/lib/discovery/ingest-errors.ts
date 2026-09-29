export const INGEST_ERROR_CODES = {
  VALIDATION_FAILED: "INGEST_VALIDATION_FAILED",
  BATCH_TOO_LARGE: "INGEST_BATCH_TOO_LARGE",
  PERSIST_FAILED: "INGEST_PERSIST_FAILED",
  UNKNOWN: "INGEST_UNKNOWN",
} as const;

export type IngestErrorCode = (typeof INGEST_ERROR_CODES)[keyof typeof INGEST_ERROR_CODES];

export class IngestError extends Error {
  readonly code: IngestErrorCode;

  constructor(code: IngestErrorCode, message: string) {
    super(message);
    this.name = "IngestError";
    this.code = code;
  }
}

export function toSafeIngestMessage(error: unknown): { code: IngestErrorCode; message: string } {
  if (error instanceof IngestError) {
    return { code: error.code, message: error.message };
  }

  if (error instanceof Error) {
    if (error.message === "INVALID_NORMALIZED_DISCOVERY_INPUT") {
      return {
        code: INGEST_ERROR_CODES.VALIDATION_FAILED,
        message: "Invalid discovery input",
      };
    }
    if (
      error.message.startsWith("INTENT_UPSERT") ||
      error.message === "INTENT_UPSERT_FAILED" ||
      error.message === "INTENT_UPSERT_RACE_FAILED"
    ) {
      return {
        code: INGEST_ERROR_CODES.PERSIST_FAILED,
        message: "Failed to persist intent",
      };
    }
    if (error.name === "DedupeKeyInputError") {
      return {
        code: INGEST_ERROR_CODES.VALIDATION_FAILED,
        message: "Invalid dedupe identity",
      };
    }
  }

  return {
    code: INGEST_ERROR_CODES.UNKNOWN,
    message: "Ingestion failed",
  };
}
