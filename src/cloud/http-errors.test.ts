import { describe, expect, it } from "vitest";
import { formatCloudApiErrorResponse } from "./http-errors.js";

describe("formatCloudApiErrorResponse", () => {
  it("uses error field from JSON body", () => {
    expect(
      formatCloudApiErrorResponse({
        path: "/completeWorkspaceJob",
        httpStatus: 500,
        httpStatusText: "Internal Server Error",
        jsonBody: {
          error: "Could not complete job (internal: grpc_PERMISSION_DENIED)",
        },
      }),
    ).toBe(
      "/completeWorkspaceJob: HTTP 500 — Could not complete job (internal: grpc_PERMISSION_DENIED)",
    );
  });

  it("appends serialized detail when present", () => {
    const s = formatCloudApiErrorResponse({
      path: "/completeWorkspaceJob",
      httpStatus: 500,
      httpStatusText: "Internal Server Error",
      jsonBody: {
        error: "Could not complete job (internal: …)",
        detail: {
          action: "complete",
          reason: "unhandled_error",
          firestoreCode: 7,
          grpcStatus: "PERMISSION_DENIED",
        },
      },
    });
    expect(s).toContain("| detail:");
    expect(s).toContain("PERMISSION_DENIED");
    expect(s).toContain("firestoreCode");
  });

  it("truncates very long detail JSON", () => {
    const long = "z".repeat(500);
    const out = formatCloudApiErrorResponse({
      path: "/x",
      httpStatus: 500,
      httpStatusText: "Err",
      jsonBody: { error: "e", detail: { pad: long } },
    });
    expect(out.length).toBeLessThan(600);
    expect(out.endsWith("…")).toBe(true);
  });

  it("falls back to HTTP status text when error field missing", () => {
    expect(
      formatCloudApiErrorResponse({
        path: "/y",
        httpStatus: 502,
        httpStatusText: "Bad Gateway",
        jsonBody: {},
      }),
    ).toBe("/y: HTTP 502 — Bad Gateway");
  });
});
