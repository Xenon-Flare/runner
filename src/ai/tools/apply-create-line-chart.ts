import {
  MAX_CHARTS,
  validateRunnerChart,
} from "../../deliverables/deliverable-validation.js";
import type { RunnerAccumulator } from "../runner-accumulator.js";
import { toolResultPayload } from "./tool-result.js";

function chartIdTaken(acc: RunnerAccumulator, id: string): boolean {
  return acc.charts.some((c) => c.id.toLowerCase() === id.toLowerCase());
}

/** Line / time-series style chart: labels on X, one numeric series per line. */
export function applyCreateLineChart(acc: RunnerAccumulator, parsed: unknown): string {
  if (typeof parsed !== "object" || parsed === null) {
    return toolResultPayload(
      false,
      "create_line_chart: arguments must be a JSON object with id, labels, and series",
    );
  }
  const o = parsed as Record<string, unknown>;
  const merged = {
    kind: "line" as const,
    id: o.id,
    title: o.title,
    labels: o.labels,
    series: o.series,
  };
  if (acc.charts.length >= MAX_CHARTS) {
    return toolResultPayload(
      false,
      `create_line_chart: chart limit reached (${MAX_CHARTS} per run)`,
    );
  }
  const v = validateRunnerChart(merged);
  if (!v.ok) return toolResultPayload(false, `create_line_chart: ${v.error}`);
  if (chartIdTaken(acc, v.chart.id)) {
    return toolResultPayload(
      false,
      `create_line_chart: id "${v.chart.id}" is already used; use a unique id for each chart`,
    );
  }
  acc.charts.push(v.chart);
  const chart = v.chart;
  if (chart.kind !== "line") {
    return toolResultPayload(false, "create_line_chart: expected line chart after validation");
  }
  const seriesCount = chart.series.length;
  return toolResultPayload(
    true,
    `create_line_chart: added line chart "${chart.id}" (${chart.labels.length} points, ${seriesCount} series)`,
  );
}
