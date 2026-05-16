import {
  MAX_CHECKLISTS,
  validateRunnerChecklist,
} from "../../deliverables/deliverable-validation.js";
import type { RunnerAccumulator } from "../runner-accumulator.js";
import { toolResultPayload } from "./tool-result.js";

export function applyCreateChecklist(acc: RunnerAccumulator, parsed: unknown): string {
  if (typeof parsed !== "object" || parsed === null) {
    return toolResultPayload(
      false,
      "create_checklist: arguments must be a JSON object with { checklist: { kind, id, items:[{id,label,checked}], ... } }",
    );
  }
  const o = parsed as { checklist?: unknown };
  if (acc.checklists.length >= MAX_CHECKLISTS) {
    return toolResultPayload(
      false,
      `create_checklist: checklist limit reached (${MAX_CHECKLISTS} per run)`,
    );
  }
  const v = validateRunnerChecklist(o.checklist);
  if (!v.ok) return toolResultPayload(false, `create_checklist: ${v.error}`);
  if (acc.checklists.some((c) => c.id.toLowerCase() === v.checklist.id.toLowerCase())) {
    return toolResultPayload(
      false,
      `create_checklist: id "${v.checklist.id}" is already used`,
    );
  }
  acc.checklists.push(v.checklist);
  return toolResultPayload(
    true,
    `create_checklist: added checklist "${v.checklist.id}" (${v.checklist.items.length} items)`,
  );
}
