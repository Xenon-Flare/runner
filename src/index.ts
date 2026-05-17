/**
 * Local worker: leases workspace jobs from Firebase HTTPS functions,
 * loads chat context via getWorkspaceRunnerContext (recent + optional prior summary),
 * optionally summarizes long prior history on the runner and persists span + text,
 * calls OpenAI Responses (gpt-5-mini) with tools create_file / create_pie_chart|bar|line / create_table / create_list / create_svg,
 * completes or fails the job.
 *
 * Env:
 *   RUNNER_API_BASE  — optional; defaults to https://cloud.xenonflare.com
 *   RUNNER_TOKEN     — Bearer secret from Studio → Runners
 *   OPENAI_API_KEY
 *   OPENAI_MODEL     — optional, default gpt-5-mini
 *   OPENAI_SUMMARY_MODEL — optional, default gpt-5-mini (prior history compression)
 *   POLL_MS          — optional, default 2500
 *   RUNNER_JOB_MAX_RUNTIME_MS — optional; if set, process exits cleanly after this
 *                               many ms (scheduled / batch workers).
 *   RUNNER_JOB_MAX_EMPTY_POLLS — optional; exit after N consecutive lease attempts
 *                                with no job (idle exit for cron-style polling).
 *
 * While a job is active, the runner POSTs `/heartbeatWorkspaceJob` every few minutes
 * so long OpenAI calls do not outlive the cloud lease.
 */

import "./bootstrap/config.js";
import { runLoop } from "./job/job-loop.js";

void runLoop();
