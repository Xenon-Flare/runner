import { describe, expect, it } from "vitest";
import {
  leaseOkSchema,
  runnerContextSchema,
  runnerPayloadSchema,
} from "./schemas.js";

function minimalContext(
  overrides: Partial<Record<string, unknown>> = {},
): unknown {
  return {
    workspaceId: "ws_1",
    title: null,
    legacyIdea: null,
    messageCount: 1,
    recentMessages: [
      {
        id: "m1",
        role: "user",
        text: "hello",
        createdAtMs: 1,
      },
    ],
    priorMessages: [],
    recentText: "hello",
    priorTextVerbatim: "",
    recentTokenEstimate: 2,
    priorTokenEstimate: 0,
    priorNeedsSummarization: false,
    storedPriorSummary: null,
    storedSummaryCoversPrior: false,
    ...overrides,
  };
}

describe("runnerPayloadSchema", () => {
  it("fills defaults for an empty object", () => {
    expect(runnerPayloadSchema.parse({})).toEqual({
      assistantMessage: "",
      files: [],
      charts: [],
      datasets: [],
      svgs: [],
      lists: [],
    });
  });

  it("preserves provided fields", () => {
    expect(
      runnerPayloadSchema.parse({
        assistantMessage: "done",
        files: [{ id: 1 }],
      }),
    ).toEqual({
      assistantMessage: "done",
      files: [{ id: 1 }],
      charts: [],
      datasets: [],
      svgs: [],
      lists: [],
    });
  });
});

describe("leaseOkSchema", () => {
  it("accepts a leased payload", () => {
    const data = leaseOkSchema.parse({
      leased: true,
      workspaceId: "ws_1",
      leaseExpiresAt: 123,
      workspace: { name: "x" },
    });
    expect(data.leased).toBe(true);
    expect(data.workspaceId).toBe("ws_1");
    expect(data.workspace.name).toBe("x");
  });

  it("rejects when leased is not true", () => {
    expect(() =>
      leaseOkSchema.parse({
        leased: false,
        workspaceId: "ws",
        leaseExpiresAt: 1,
        workspace: {},
      }),
    ).toThrow();
  });
});

describe("runnerContextSchema", () => {
  it("parses a minimal valid context", () => {
    const parsed = runnerContextSchema.parse(minimalContext());
    expect(parsed.workspaceId).toBe("ws_1");
    expect(parsed.recentMessages).toHaveLength(1);
    expect(parsed.recentMessages[0]!.role).toBe("user");
  });

  it("allows optional subtitle on messages", () => {
    const parsed = runnerContextSchema.parse(
      minimalContext({
        recentMessages: [
          {
            id: "m1",
            role: "user",
            text: "t",
            subtitle: "sub",
            createdAtMs: 0,
          },
        ],
      }),
    );
    expect(parsed.recentMessages[0]!.subtitle).toBe("sub");
  });

  it("rejects assistant role in messages", () => {
    expect(() =>
      runnerContextSchema.parse(
        minimalContext({
          recentMessages: [
            {
              id: "m1",
              role: "assistant",
              text: "no",
              createdAtMs: 0,
            },
          ],
        }),
      ),
    ).toThrow();
  });

  it("parses stored prior summary when present", () => {
    const parsed = runnerContextSchema.parse(
      minimalContext({
        storedPriorSummary: {
          text: "summary",
          fromMessageId: "a",
          throughMessageId: "b",
        },
      }),
    );
    expect(parsed.storedPriorSummary?.text).toBe("summary");
  });
});
