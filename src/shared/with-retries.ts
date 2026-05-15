import {
  APIConnectionError,
  APIError,
  RateLimitError,
} from "openai";
import { CloudHttpRequestError } from "../cloud/http-errors.js";

const RETRYABLE_HTTP = new Set([408, 429, 500, 502, 503, 504]);

/** OpenAI `responses.create` and similar. */
export const OPENAI_RETRY_MAX_ATTEMPTS = 5;

/** Runner → cloud `postJson` (lease, complete, etc.). */
export const CLOUD_API_RETRY_MAX_ATTEMPTS = 4;

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function backoffMs(attemptIndex: number): number {
  const base = 500;
  const cap = 30_000;
  const jitter = 0.85 + Math.random() * 0.3;
  return Math.min(cap, Math.floor(base * 2 ** attemptIndex * jitter));
}

function retryAfterMs(headers: Headers | undefined | null): number | null {
  if (!headers) return null;
  const ra = headers.get("retry-after");
  if (!ra) return null;
  const sec = Number(ra);
  if (Number.isFinite(sec) && sec >= 0) {
    return Math.min(120_000, sec * 1000);
  }
  const when = Date.parse(ra);
  if (!Number.isNaN(when)) {
    const delta = when - Date.now();
    if (delta > 0) return Math.min(120_000, delta);
  }
  return null;
}

export function isRetryableOpenAIError(err: unknown): boolean {
  if (err instanceof APIConnectionError) return true;
  if (err instanceof RateLimitError) return true;
  if (err instanceof APIError) {
    const s = err.status;
    if (s === undefined) return false;
    if (s === 408) return true;
    if (s >= 500 && s <= 599) return true;
    return false;
  }
  return false;
}

export function isRetryableHttpStatus(status: number): boolean {
  return RETRYABLE_HTTP.has(status);
}

export function isRetryableCloudHttpError(err: unknown): boolean {
  if (err instanceof CloudHttpRequestError) {
    return isRetryableHttpStatus(err.httpStatus);
  }
  if (err instanceof TypeError) return true;
  if (err instanceof Error && err.name === "AbortError") return false;
  return false;
}

function waitMsForOpenAI(err: unknown, attemptIndex: number): number {
  let ms = backoffMs(attemptIndex);
  if (err instanceof APIError && err.headers) {
    const ra = retryAfterMs(err.headers);
    if (ra !== null) ms = Math.max(ms, ra);
  }
  return ms;
}

/**
 * Runs `fn` until success or `maxAttempts` is exhausted. Retries only when
 * `shouldRetry` returns true for the caught error.
 */
export async function withRetries<T>(
  label: string,
  fn: () => Promise<T>,
  options: {
    maxAttempts: number;
    shouldRetry: (err: unknown) => boolean;
    backoffMs?: (err: unknown, attemptIndex: number) => number;
  },
): Promise<T> {
  const { maxAttempts, shouldRetry } = options;
  const backoff =
    options.backoffMs ?? ((_: unknown, attemptIndex: number) => backoffMs(attemptIndex));

  let lastErr: unknown;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (e) {
      lastErr = e;
      const canRetry = shouldRetry(e) && attempt < maxAttempts - 1;
      if (!canRetry) throw e;
      const wait = backoff(e, attempt);
      console.warn(
        `[runner] ${label} transient failure (attempt ${attempt + 1}/${maxAttempts}), retry in ${wait}ms:`,
        e instanceof Error ? e.message : e,
      );
      await sleep(wait);
    }
  }
  throw lastErr;
}

export async function withOpenAIRetries<T>(
  label: string,
  fn: () => Promise<T>,
): Promise<T> {
  return withRetries(label, fn, {
    maxAttempts: OPENAI_RETRY_MAX_ATTEMPTS,
    shouldRetry: isRetryableOpenAIError,
    backoffMs: waitMsForOpenAI,
  });
}

export async function withCloudApiRetries<T>(
  label: string,
  fn: () => Promise<T>,
): Promise<T> {
  return withRetries(label, fn, {
    maxAttempts: CLOUD_API_RETRY_MAX_ATTEMPTS,
    shouldRetry: isRetryableCloudHttpError,
  });
}
