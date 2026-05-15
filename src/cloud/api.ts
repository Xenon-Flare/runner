import {
  CloudHttpRequestError,
  formatCloudApiErrorResponse,
} from "./http-errors.js";
import {
  apiBase,
  authHeader,
  HEARTBEAT_INTERVAL_MS,
} from "../bootstrap/config.js";
import { withCloudApiRetries } from "../shared/with-retries.js";

export async function postJson(path: string, body: unknown): Promise<unknown> {
  return withCloudApiRetries(`POST ${path}`, async () => {
    const res = await fetch(`${apiBase}${path}`, {
      method: "POST",
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body ?? {}),
    });
    const text = await res.text();
    let data: unknown = {};
    if (text) {
      try {
        data = JSON.parse(text) as unknown;
      } catch {
        const preview = text.slice(0, 240).replace(/\s+/g, " ");
        if (!res.ok) {
          throw new CloudHttpRequestError(
            res.status,
            `${path}: HTTP ${res.status} ${res.statusText} — non-JSON body: ${preview}`,
          );
        }
        throw new Error(`${path}: expected JSON — ${preview}`);
      }
    }
    if (!res.ok) {
      throw new CloudHttpRequestError(
        res.status,
        formatCloudApiErrorResponse({
          path,
          httpStatus: res.status,
          httpStatusText: res.statusText,
          jsonBody: data,
        }),
      );
    }
    return data;
  });
}

export async function withLeaseHeartbeat<T>(
  workspaceId: string,
  work: () => Promise<T>,
): Promise<T> {
  const ping = () =>
    postJson("/heartbeatWorkspaceJob", { workspaceId }).catch((err) =>
      console.warn("[runner] heartbeat failed:", err),
    );
  void ping();
  const timer = setInterval(ping, HEARTBEAT_INTERVAL_MS);
  try {
    return await work();
  } finally {
    clearInterval(timer);
  }
}
