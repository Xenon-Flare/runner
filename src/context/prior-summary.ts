import { postJson } from "../cloud/api.js";
import {
  MAX_SUMMARY_INPUT_CHARS,
  MAX_SUMMARY_OUTPUT_CHARS,
  openai,
  summaryModel,
} from "../bootstrap/config.js";
import { extractOpenAiResponsesText } from "../ai/openai-text.js";
import { withOpenAIRetries } from "../shared/with-retries.js";

export async function summarizePriorBlock(priorText: string): Promise<string> {
  const input =
    priorText.length > MAX_SUMMARY_INPUT_CHARS
      ? "…(earlier material truncated from the start)\n\n" +
        priorText.slice(-MAX_SUMMARY_INPUT_CHARS)
      : priorText;

  const response = await withOpenAIRetries("OpenAI prior-summary", () =>
    openai.responses.create({
      model: summaryModel,
      instructions:
        "You compress older user conversation into dense working notes for another AI that continues the task. " +
        "Preserve requirements, numbers, constraints, stack choices, URLs, and decisions. " +
        "Markdown with short sections. Cap output around ~9500 tokens.",
      input:
        "Summarize the following earlier messages for downstream context:\n\n" + input,
      max_output_tokens: 4096,
    }),
  );

  let text = extractOpenAiResponsesText(response).trim();
  if (text.length > MAX_SUMMARY_OUTPUT_CHARS) {
    text =
      text.slice(0, MAX_SUMMARY_OUTPUT_CHARS) + "\n…(summary truncated)";
  }
  return text;
}

export async function persistPriorSummary(
  workspaceId: string,
  summaryText: string,
  fromMessageId: string,
  throughMessageId: string,
): Promise<void> {
  await postJson("/updateWorkspaceRunnerSummary", {
    workspaceId,
    summaryText,
    fromMessageId,
    throughMessageId,
  });
}
