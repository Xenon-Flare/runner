import {
  MAX_CHARTS,
  validateRunnerChart,
} from "../../deliverables/deliverable-validation.js";
import type { RunnerAccumulator } from "../runner-accumulator.js";
import { toolResultPayload } from "./tool-result.js";

function chartIdTaken(acc: RunnerAccumulator, id: string): boolean {
  return acc.charts.some((c) => c.id.toLowerCase() === id.toLowerCase());
}

/** Area chart — same data as a line chart, with filled regions under each series. */
export function applyCreateAreaChart(acc: RunnerAccumulator, parsed: unknown): string {
  if (typeof parsed !== "object" || parsed === null) {
    return toolResultPayload(
      false,
      "create_area_chart: arguments must be a JSON object with id, labels, and series",
    );
  }
  const o = parsed as Record<string, unknown>;
  const merged = {
    kind: "area" as const,
    id: o.id,
    title: o.title,
    labels: o.labels,
    series: o.series,
  };
  if (acc.charts.length >= MAX_CHARTS) {
    return toolResultPayload(
      false,
      `create_area_chart: chart limit reached (${MAX_CHARTS} per run)`,
    );
  }
  const v = validateRunnerChart(merged);
  if (!v.ok) return toolResultPayload(false, `create_area_chart: ${v.error}`);
  if (chartIdTaken(acc, v.chart.id)) {
    return toolResultPayload(
      false,
      `create_area_chart: id "${v.chart.id}" is already used; use a unique id for each chart`,
    );
  }
  acc.charts.push(v.chart);
  const chart = v.chart;
  if (chart.kind !== "area") {
    return toolResultPayload(false, "create_area_chart: expected area chart after validation");
  }
  return toolResultPayload(
    true,
    `create_area_chart: added area chart "${chart.id}" (${chart.labels.length} points, ${chart.series.length} series)`,
  );
}
