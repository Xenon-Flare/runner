import { postJson } from "../cloud/api.js";
import { leaseOkSchema } from "../cloud/schemas.js";
import { pollMs } from "../bootstrap/config.js";
import { runWorkspaceJob } from "./workspace-job.js";

export async function runLoop(): Promise<void> {
  for (;;) {
    try {
      console.log("Leasing job...");
      const lease = await postJson("/leaseWorkspaceJob", {});
      const leaseOk = leaseOkSchema.safeParse(lease);
      if (!leaseOk.success) {
        await new Promise((r) => setTimeout(r, pollMs));
        continue;
      }

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
