import {
  MAX_DATASETS,
  validateRunnerTable,
} from "../../deliverables/deliverable-validation.js";
import type { RunnerAccumulator } from "../runner-accumulator.js";
import { toolResultPayload } from "./tool-result.js";

export function applyCreateTable(acc: RunnerAccumulator, parsed: unknown): string {
  if (typeof parsed !== "object" || parsed === null || !("table" in parsed)) {
    return toolResultPayload(
      false,
      'create_table: missing required property "table" (object with kind "table", id, columns, rows)',
    );
  }
  const v = validateRunnerTable((parsed as { table: unknown }).table);
  if (!v.ok) return toolResultPayload(false, `create_table: ${v.error}`);
  if (acc.datasets.length >= MAX_DATASETS) {
    return toolResultPayload(
      false,
      `create_table: table limit reached (${MAX_DATASETS} per run)`,
    );
  }
  acc.datasets.push(v.table);
  return toolResultPayload(
    true,
    `create_table: added "${v.table.id}" (${v.table.columns.length} columns × ${v.table.rows.length} rows)`,
  );
}
