import OpenAI from "openai";
import dotenv from "dotenv";

dotenv.config();

function optionalPositiveInt(raw: string | undefined): number | undefined {
  if (!raw?.trim()) return undefined;
  const n = Number(raw.trim());
  if (!Number.isFinite(n) || n < 1) return undefined;
  return Math.floor(n);
}

function optionalNonNegativeMs(raw: string | undefined): number | undefined {
  if (!raw?.trim()) return undefined;
  const n = Number(raw.trim());
  if (!Number.isFinite(n) || n < 1) return undefined;
  return Math.floor(n);
}

const DEFAULT_RUNNER_API_BASE = "https://cloud.xenonflare.com";

/** Shorter than server lease (10m); keeps `loadActiveLease` valid during long OpenAI calls. */
export const HEARTBEAT_INTERVAL_MS = 120_000;

export const apiBase = (
  process.env.RUNNER_API_BASE?.trim() || DEFAULT_RUNNER_API_BASE
).replace(/\/$/, "");
const runnerToken = process.env.RUNNER_TOKEN ?? "";
const openaiKey = process.env.OPENAI_API_KEY ?? "";
export const authHeader = `Bearer ${runnerToken}`;
export const model = process.env.OPENAI_MODEL?.trim() || "gpt-5-mini";
export const summaryModel =
  process.env.OPENAI_SUMMARY_MODEL?.trim() || "gpt-5-mini";
export const pollMs = Math.max(500, Number(process.env.POLL_MS) || 2500);

/** When set (ms), worker exits cleanly after that runtime (scheduled / batch workers). */
export const jobMaxRuntimeMs = optionalNonNegativeMs(
  process.env.RUNNER_JOB_MAX_RUNTIME_MS,
);

/** When set, exit after this many consecutive “no leased job” polls (idle exit for batch mode). */
export const jobMaxEmptyPolls = optionalPositiveInt(
  process.env.RUNNER_JOB_MAX_EMPTY_POLLS,
);

export const MAX_SUMMARY_INPUT_CHARS = 360_000;
export const MAX_SUMMARY_OUTPUT_CHARS = 10_000 * 4 - 200;

if (!runnerToken || !openaiKey) {
  console.error(
    "Missing env: RUNNER_TOKEN and OPENAI_API_KEY are required (RUNNER_API_BASE defaults to production cloud if unset).",
  );
  process.exit(1);
}

export const openai = new OpenAI({ apiKey: openaiKey });
