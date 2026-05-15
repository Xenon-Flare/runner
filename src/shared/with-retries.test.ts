import { APIError } from "openai";
import { describe, expect, it, vi } from "vitest";
import { CloudHttpRequestError } from "../cloud/http-errors.js";
import {
  isRetryableCloudHttpError,
  isRetryableHttpStatus,
  isRetryableOpenAIError,
  withRetries,
} from "./with-retries.js";

describe("isRetryableHttpStatus", () => {
  it("treats common transient statuses as retryable", () => {
    expect(isRetryableHttpStatus(429)).toBe(true);
    expect(isRetryableHttpStatus(503)).toBe(true);
    expect(isRetryableHttpStatus(400)).toBe(false);
    expect(isRetryableHttpStatus(401)).toBe(false);
  });
});

describe("isRetryableCloudHttpError", () => {
  it("retries CloudHttpRequestError with retryable status", () => {
    expect(
      isRetryableCloudHttpError(
        new CloudHttpRequestError(502, "/x: HTTP 502 — bad gateway"),
      ),
    ).toBe(true);
  });

  it("does not retry client errors", () => {
    expect(
      isRetryableCloudHttpError(
        new CloudHttpRequestError(400, "/x: HTTP 400 — bad request"),
      ),
    ).toBe(false);
  });

  it("retries TypeError (typical undici connection failure)", () => {
    expect(isRetryableCloudHttpError(new TypeError("fetch failed"))).toBe(true);
  });
});

describe("isRetryableOpenAIError", () => {
  it("retries 503 from APIError.generate", () => {
    const err = APIError.generate(
      503,
      { message: "upstream" },
      undefined,
      new Headers(),
    );
    expect(isRetryableOpenAIError(err)).toBe(true);
  });

  it("does not retry 400", () => {
    const err = APIError.generate(
      400,
      { message: "bad" },
      undefined,
      new Headers(),
    );
    expect(isRetryableOpenAIError(err)).toBe(false);
  });
});

describe("withRetries", () => {
  it("retries until fn succeeds", async () => {
    let n = 0;
    const fn = vi.fn(async () => {
      n++;
      if (n < 2) throw new TypeError("fetch failed");
      return 42;
    });
    const r = await withRetries("test-op", fn, {
      maxAttempts: 4,
      shouldRetry: isRetryableCloudHttpError,
    });
    expect(r).toBe(42);
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it("does not retry when shouldRetry is false", async () => {
    const fn = vi.fn(async () => {
      throw new CloudHttpRequestError(400, "bad");
    });
    await expect(
      withRetries("test-op", fn, {
        maxAttempts: 4,
        shouldRetry: isRetryableCloudHttpError,
      }),
    ).rejects.toThrow("bad");
    expect(fn).toHaveBeenCalledTimes(1);
  });
});
