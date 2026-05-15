/**
 * Thrown by `postJson` on non-2xx so callers (and retries) can inspect `httpStatus`.
 */
export class CloudHttpRequestError extends Error {
  readonly httpStatus: number;

  constructor(httpStatus: number, message: string) {
    super(message);
    this.name = "CloudHttpRequestError";
    this.httpStatus = httpStatus;
  }
}

/**
 * Formatting for non-2xx JSON responses from the cloud runner API (Firebase Functions).
 * Kept separate from `api.ts` so tests do not load OpenAI client config.
 */
export function formatCloudApiErrorResponse(params: {
  path: string;
  httpStatus: number;
  httpStatusText: string;
  jsonBody: unknown;
}): string {
  const { path, httpStatus, httpStatusText, jsonBody } = params;
  const err =
    typeof jsonBody === "object" &&
    jsonBody !== null &&
    "error" in jsonBody &&
    typeof (jsonBody as { error: unknown }).error === "string"
      ? (jsonBody as { error: string }).error
      : httpStatusText;
  const detail =
    typeof jsonBody === "object" &&
    jsonBody !== null &&
    "detail" in jsonBody
      ? (jsonBody as { detail: unknown }).detail
      : undefined;
  let extra = "";
  if (detail !== undefined) {
    try {
      const s = JSON.stringify(detail);
      extra = ` | detail: ${s.length > 420 ? `${s.slice(0, 420)}…` : s}`;
    } catch {
      extra = " | detail: [unserializable]";
    }
  }
  return `${path}: HTTP ${httpStatus} — ${err}${extra}`;
}
