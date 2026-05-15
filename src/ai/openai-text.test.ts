import { describe, expect, it } from "vitest";
import { extractOpenAiResponsesText } from "./openai-text.js";

describe("extractOpenAiResponsesText", () => {
  it("prefers output_text when set", () => {
    expect(
      extractOpenAiResponsesText({
        output_text: "from output_text",
        output: [{ content: [{ text: "ignored" }] }],
      }),
    ).toBe("from output_text");
  });

  it("joins nested output content when output_text is absent", () => {
    expect(
      extractOpenAiResponsesText({
        output: [
          {
            content: [
              { text: "a" },
              { text: "b" },
            ],
          },
        ],
      }),
    ).toBe("ab");
  });

  it("joins multiple output blocks with newlines", () => {
    expect(
      extractOpenAiResponsesText({
        output: [
          { content: [{ text: "first" }] },
          { content: [{ text: "second" }] },
        ],
      }),
    ).toBe("first\nsecond");
  });

  it("returns empty string for empty or unknown shapes", () => {
    expect(extractOpenAiResponsesText({})).toBe("");
    expect(extractOpenAiResponsesText(null)).toBe("");
  });
});
