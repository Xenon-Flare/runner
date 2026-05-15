import {
  MAX_CHARTS,
  validateRunnerChart,
} from "../../deliverables/deliverable-validation.js";
import type { RunnerAccumulator } from "../runner-accumulator.js";
import { toolResultPayload } from "./tool-result.js";

function chartIdTaken(acc: RunnerAccumulator, id: string): boolean {
  return acc.charts.some((c) => c.id.toLowerCase() === id.toLowerCase());
}

/** Pie chart: proportional slices; args are top-level id, title?, segments (not nested under chart). */
export function applyCreatePieChart(acc: RunnerAccumulator, parsed: unknown): string {
  if (typeof parsed !== "object" || parsed === null) {
    return toolResultPayload(false, "create_pie_chart: arguments must be a JSON object with id and segments");
  }
  const o = parsed as Record<string, unknown>;
  const merged = {
    kind: "pie" as const,
    id: o.id,
    title: o.title,
    segments: o.segments,
  };
  if (acc.charts.length >= MAX_CHARTS) {
    return toolResultPayload(
      false,
      `create_pie_chart: chart limit reached (${MAX_CHARTS} per run)`,
    );
  }
  const v = validateRunnerChart(merged);
  if (!v.ok) return toolResultPayload(false, `create_pie_chart: ${v.error}`);
  if (chartIdTaken(acc, v.chart.id)) {
    return toolResultPayload(
      false,
      `create_pie_chart: id "${v.chart.id}" is already used; use a unique id for each chart`,
    );
  }
  acc.charts.push(v.chart);
  const chart = v.chart;
  if (chart.kind !== "pie") {
    return toolResultPayload(false, "create_pie_chart: expected pie chart after validation");
  }
  return toolResultPayload(
    true,
    `create_pie_chart: added pie chart "${chart.id}" with ${chart.segments.length} segment(s)`,
  );
}
