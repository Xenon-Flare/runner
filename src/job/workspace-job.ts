import { postJson, withLeaseHeartbeat } from "../cloud/api.js";
import { runnerContextSchema } from "../cloud/schemas.js";
import { generateRunnerPayload } from "../ai/generate-runner-payload.js";
import { buildModelInputFromContext } from "../context/prior-context.js";

/**
 * Load context, run OpenAI tool loop, complete the job; on failure callers
 * should POST `/failWorkspaceJob`.
 */
export async function runWorkspaceJob(workspaceId: string): Promise<void> {
  console.log(`[runner] leased ${workspaceId} — loading context…`);
  const ctxRaw = await postJson("/getWorkspaceRunnerContext", {
    workspaceId,
  });
  const ctxParsed = runnerContextSchema.safeParse(ctxRaw);
  if (!ctxParsed.success) {
    throw new Error("invalid_runner_context_payload");
  }
  const ctx = ctxParsed.data;

  await withLeaseHeartbeat(workspaceId, async () => {
    const userBlock = await buildModelInputFromContext(workspaceId, ctx);
    if (!userBlock.trim()) {
      throw new Error("empty_context");
    }

    console.log(`[runner] generating ${workspaceId}…`);
    const payload = await generateRunnerPayload(userBlock);
    await postJson("/heartbeatWorkspaceJob", { workspaceId });
    await postJson("/completeWorkspaceJob", {
      workspaceId,
      files: payload.files,
      assistantMessage: payload.assistantMessage,
      charts: payload.charts,
      datasets: payload.datasets,
      svgs: payload.svgs,
      lists: payload.lists,
      checklists: payload.checklists,
    });
    console.log(
      `[runner] completed ${workspaceId} (files=${payload.files.length} charts=${payload.charts.length} tables=${payload.datasets.length} svgs=${payload.svgs.length} lists=${payload.lists.length} checklists=${payload.checklists.length})`,
    );
  });
}
