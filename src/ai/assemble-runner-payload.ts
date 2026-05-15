import { runnerPayloadSchema, type RunnerPayload } from "../cloud/schemas.js";
import type { RunnerAccumulator } from "./runner-accumulator.js";
import { MAX_ASSISTANT_MESSAGE_CHARS } from "./limits.js";

export function normalizeAssistantMessage(text: string): string {
  const t = text.trim();
  if (t.length > MAX_ASSISTANT_MESSAGE_CHARS) {
    throw new Error("assistant reply exceeds max length");
  }
  return t;
}

export function finalizeRunnerPayload(
  acc: RunnerAccumulator,
  assistantMessage: string,
): RunnerPayload {
  const payload = {
    assistantMessage,
    files: acc.files,
    charts: acc.charts,
    datasets: acc.datasets,
    svgs: acc.svgs,
    lists: acc.lists,
  };
  const parsed = runnerPayloadSchema.safeParse(payload);
  if (!parsed.success) {
    throw new Error(
      `Assembled payload invalid: ${parsed.error.issues.map((i) => i.message).join("; ")}`,
    );
  }
  const hasDeliverable =
    parsed.data.assistantMessage.length > 0 ||
    parsed.data.files.length > 0 ||
    parsed.data.charts.length > 0 ||
    parsed.data.datasets.length > 0 ||
    parsed.data.svgs.length > 0 ||
    parsed.data.lists.length > 0;
  if (!hasDeliverable) {
    throw new Error("Model produced no assistant text and no tool artifacts");
  }
  return parsed.data;
}
