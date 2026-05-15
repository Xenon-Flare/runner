import OpenAI from "openai";
import dotenv from "dotenv";

dotenv.config();

/** Shorter than server lease (10m); keeps `loadActiveLease` valid during long OpenAI calls. */
export const HEARTBEAT_INTERVAL_MS = 120_000;

export const apiBase = (process.env.RUNNER_API_BASE ?? "").replace(/\/$/, "");
const runnerToken = process.env.RUNNER_TOKEN ?? "";
const openaiKey = process.env.OPENAI_API_KEY ?? "";
export const authHeader = `Bearer ${runnerToken}`;
export const model = process.env.OPENAI_MODEL?.trim() || "gpt-5-mini";
export const summaryModel =
  process.env.OPENAI_SUMMARY_MODEL?.trim() || "gpt-5-mini";
export const pollMs = Math.max(500, Number(process.env.POLL_MS) || 2500);
export const MAX_SUMMARY_INPUT_CHARS = 360_000;
export const MAX_SUMMARY_OUTPUT_CHARS = 10_000 * 4 - 200;

if (!apiBase || !runnerToken || !openaiKey) {
  console.error(
    "Missing env: RUNNER_API_BASE, RUNNER_TOKEN, and OPENAI_API_KEY are required.",
  );
  process.exit(1);
}

export const openai = new OpenAI({ apiKey: openaiKey });
