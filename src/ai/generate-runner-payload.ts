import {
  buildDeliverableRepairPrompt,
  findMissingDeliverables,
  formatMissingDeliverables,
  missingDeliverablesIsEmpty,
} from "../deliverables/deliverable-coherence.js";
import type { RunnerPayload } from "../cloud/schemas.js";
import { finalizeRunnerPayload } from "./assemble-runner-payload.js";
import { MAX_DELIVERABLE_REPAIR_ROUNDS } from "./limits.js";
import { runToolLoop } from "./tool-loop.js";
import type { RunnerAccumulator } from "./runner-accumulator.js";

export async function generateRunnerPayload(userBlock: string): Promise<RunnerPayload> {
  const acc: RunnerAccumulator = {
    files: [],
    charts: [],
    datasets: [],
    svgs: [],
    lists: [],
    checklists: [],
  };

  let { assistantMessage, previousResponseId } = await runToolLoop(
    acc,
    userBlock,
    null,
  );

  for (let repair = 0; repair < MAX_DELIVERABLE_REPAIR_ROUNDS; repair++) {
    const missing = findMissingDeliverables(assistantMessage, acc);
    if (missingDeliverablesIsEmpty(missing)) break;

    console.warn(
      `[runner] deliverable repair ${repair + 1}/${MAX_DELIVERABLE_REPAIR_ROUNDS}: missing ${formatMissingDeliverables(missing)}`,
    );

    const repairPrompt = buildDeliverableRepairPrompt(missing, assistantMessage);
    const repaired = await runToolLoop(acc, repairPrompt, previousResponseId);
    assistantMessage = repaired.assistantMessage;
    previousResponseId = repaired.previousResponseId;
  }

  const stillMissing = findMissingDeliverables(assistantMessage, acc);
  if (!missingDeliverablesIsEmpty(stillMissing)) {
    throw new Error(
      `deliverable_placeholder_mismatch: ${formatMissingDeliverables(stillMissing)}`,
    );
  }

  return finalizeRunnerPayload(acc, assistantMessage);
}
