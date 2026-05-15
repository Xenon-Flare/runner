import {
  MAX_CHARTS,
  validateRunnerChart,
} from "../../deliverables/deliverable-validation.js";
import type { RunnerAccumulator } from "../runner-accumulator.js";
import { toolResultPayload } from "./tool-result.js";

function chartIdTaken(acc: RunnerAccumulator, id: string): boolean {
  return acc.charts.some((c) => c.id.toLowerCase() === id.toLowerCase());
}

/** Bar/column chart; vertical = columns on shared categories, horizontal = bars along rows. */
export function applyCreateBarChart(acc: RunnerAccumulator, parsed: unknown): string {
  if (typeof parsed !== "object" || parsed === null) {
    return toolResultPayload(
      false,
      "create_bar_chart: arguments must be a JSON object with id, labels, and series",
    );
  }
  const o = parsed as Record<string, unknown>;
  const merged = {
    kind: "bar" as const,
    id: o.id,
    title: o.title,
    labels: o.labels,
    series: o.series,
    orientation: o.orientation,
  };
  if (acc.charts.length >= MAX_CHARTS) {
    return toolResultPayload(
      false,
      `create_bar_chart: chart limit reached (${MAX_CHARTS} per run)`,
    );
  }
  const v = validateRunnerChart(merged);
  if (!v.ok) return toolResultPayload(false, `create_bar_chart: ${v.error}`);
  if (chartIdTaken(acc, v.chart.id)) {
    return toolResultPayload(
      false,
      `create_bar_chart: id "${v.chart.id}" is already used; use a unique id for each chart`,
    );
  }
  acc.charts.push(v.chart);
  const chart = v.chart;
  if (chart.kind !== "bar") {
    return toolResultPayload(false, "create_bar_chart: expected bar chart after validation");
  }
  const seriesCount = chart.series.length;
  return toolResultPayload(
    true,
    `create_bar_chart: added bar chart "${chart.id}" (${chart.labels.length} categories, ${seriesCount} series)`,
  );
}
