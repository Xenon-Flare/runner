import { MAX_SVGS, validateRunnerSvg } from "../../deliverables/deliverable-validation.js";
import type { RunnerAccumulator } from "../runner-accumulator.js";
import { toolResultPayload } from "./tool-result.js";

export function applyCreateSvg(acc: RunnerAccumulator, parsed: unknown): string {
  if (typeof parsed !== "object" || parsed === null || !("svg" in parsed)) {
    return toolResultPayload(
      false,
      'create_svg: missing required property "svg" (object with id, content, optional title)',
    );
  }
  const v = validateRunnerSvg((parsed as { svg: unknown }).svg);
  if (!v.ok) return toolResultPayload(false, `create_svg: ${v.error}`);
  if (acc.svgs.length >= MAX_SVGS) {
    return toolResultPayload(false, `create_svg: svg limit reached (${MAX_SVGS} per run)`);
  }
  if (acc.svgs.some((s) => s.id.toLowerCase() === v.svg.id.toLowerCase())) {
    return toolResultPayload(
      false,
      `create_svg: id "${v.svg.id}" is already used; use a unique id for each svg`,
    );
  }
  acc.svgs.push(v.svg);
  return toolResultPayload(
    true,
    `create_svg: added "${v.svg.id}" (${v.svg.content.length} chars of SVG markup)`,
  );
}
