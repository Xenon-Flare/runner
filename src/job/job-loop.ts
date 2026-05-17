import { postJson } from "../cloud/api.js";
import { leaseOkSchema } from "../cloud/schemas.js";
import {
  jobMaxEmptyPolls,
  jobMaxRuntimeMs,
  pollMs,
} from "../bootstrap/config.js";
import {
  COMMUNITY_DISCORD_INVITE_URL,
  COMMUNITY_INSTAGRAM_URL,
  COMMUNITY_REDDIT_URL,
  COMMUNITY_X_URL,
} from "../shared/community-invite.js";
import { runWorkspaceJob } from "./workspace-job.js";

function exitJob(reason: string): never {
  console.log(`[runner] Exiting (${reason}).`);
  process.exit(0);
}

function exceedsJobRuntime(startedAt: number): boolean {
  return (
    jobMaxRuntimeMs != null && Date.now() - startedAt >= jobMaxRuntimeMs
  );
}

export async function runLoop(): Promise<void> {
  console.log("[runner] Xenonflare Discord community:", COMMUNITY_DISCORD_INVITE_URL);
  console.log("[runner] Xenonflare Reddit:", COMMUNITY_REDDIT_URL);
  console.log("[runner] Xenonflare X:", COMMUNITY_X_URL);
  console.log("[runner] Xenonflare Instagram:", COMMUNITY_INSTAGRAM_URL);

  const startedAt = Date.now();
  let consecutiveEmptyPolls = 0;

  for (;;) {
    if (exceedsJobRuntime(startedAt)) {
      exitJob("RUNNER_JOB_MAX_RUNTIME_MS");
    }

    try {
      console.log("Leasing job...");
      const lease = await postJson("/leaseWorkspaceJob", {});
      const leaseOk = leaseOkSchema.safeParse(lease);
      if (!leaseOk.success) {
        consecutiveEmptyPolls++;
        if (
          jobMaxEmptyPolls != null &&
          consecutiveEmptyPolls >= jobMaxEmptyPolls
        ) {
          exitJob("RUNNER_JOB_MAX_EMPTY_POLLS");
        }
        await new Promise((r) => setTimeout(r, pollMs));
        continue;
      }

      consecutiveEmptyPolls = 0;

      const { workspaceId } = leaseOk.data;
      console.log("Leased job:", workspaceId);

      try {
        await runWorkspaceJob(workspaceId);
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        console.error(`[runner] fail ${workspaceId}:`, msg);
        try {
          await postJson("/failWorkspaceJob", {
            workspaceId,
            error: msg.slice(0, 500),
          });
        } catch (reportErr) {
          console.error(
            "[runner] could not report failure to cloud (job may need manual cleanup):",
            reportErr,
          );
        }
      }
    } catch (e) {
      console.error("[runner] loop error:", e);
      await new Promise((r) => setTimeout(r, pollMs));
    }
  }
}
