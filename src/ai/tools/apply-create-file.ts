import {
  MAX_FILES,
  validateRunnerFile,
} from "../../deliverables/deliverable-validation.js";
import type { RunnerAccumulator } from "../runner-accumulator.js";
import { toolResultPayload } from "./tool-result.js";

export function applyCreateFile(acc: RunnerAccumulator, parsed: unknown): string {
  const v = validateRunnerFile(parsed);
  if (!v.ok) return toolResultPayload(false, `create_file: ${v.error}`);
  if (acc.files.length >= MAX_FILES) {
    return toolResultPayload(
      false,
      `create_file: limit reached (${MAX_FILES} files per run); omit or shorten outputs`,
    );
  }
  acc.files.push(v.file);
  return toolResultPayload(true, `create_file: saved "${v.file.name}" (${v.file.content.length} chars)`);
}
