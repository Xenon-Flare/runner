import {
  MAX_LISTS,
  validateRunnerList,
} from "../../deliverables/deliverable-validation.js";
import type { RunnerAccumulator } from "../runner-accumulator.js";
import { toolResultPayload } from "./tool-result.js";

export function applyCreateList(acc: RunnerAccumulator, parsed: unknown): string {
  if (typeof parsed !== "object" || parsed === null || !("list" in parsed)) {
    return toolResultPayload(
      false,
      'create_list: missing required property "list" (object with kind "list", id, items, optional ordered/title)',
    );
  }
  const v = validateRunnerList((parsed as { list: unknown }).list);
  if (!v.ok) return toolResultPayload(false, `create_list: ${v.error}`);
  if (acc.lists.length >= MAX_LISTS) {
    return toolResultPayload(false, `create_list: list limit reached (${MAX_LISTS} per run)`);
  }
  if (acc.lists.some((l) => l.id.toLowerCase() === v.list.id.toLowerCase())) {
    return toolResultPayload(
      false,
      `create_list: id "${v.list.id}" is already used; each list needs a unique id`,
    );
  }
  acc.lists.push(v.list);
  return toolResultPayload(
    true,
    `create_list: added "${v.list.id}" (${v.list.items.length} items${v.list.ordered ? ", ordered" : ""})`,
  );
}
