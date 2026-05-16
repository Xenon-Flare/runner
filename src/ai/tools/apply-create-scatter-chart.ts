import {
  MAX_CHARTS,
  validateRunnerChart,
} from "../../deliverables/deliverable-validation.js";
import type { RunnerAccumulator } from "../runner-accumulator.js";
import { toolResultPayload } from "./tool-result.js";

function chartIdTaken(acc: RunnerAccumulator, id: string): boolean {
  return acc.charts.some((c) => c.id.toLowerCase() === id.toLowerCase());
}

/** Scatter plot — numeric X/Y points per named series (correlations, clusters). */
export function applyCreateScatterChart(acc: RunnerAccumulator, parsed: unknown): string {
  if (typeof parsed !== "object" || parsed === null) {
    return toolResultPayload(
      false,
      "create_scatter_chart: arguments must be a JSON object with id and series (each with name + points[{x,y}])",
    );
  }
  const o = parsed as Record<string, unknown>;
  const merged = {
    kind: "scatter" as const,
    id: o.id,
    title: o.title,
    series: o.series,
  };
  if (acc.charts.length >= MAX_CHARTS) {
    return toolResultPayload(
      false,
      `create_scatter_chart: chart limit reached (${MAX_CHARTS} per run)`,
    );
  }
  const v = validateRunnerChart(merged);
  if (!v.ok) return toolResultPayload(false, `create_scatter_chart: ${v.error}`);
  if (chartIdTaken(acc, v.chart.id)) {
    return toolResultPayload(
      false,
      `create_scatter_chart: id "${v.chart.id}" is already used; use a unique id for each chart`,
    );
  }
  acc.charts.push(v.chart);
  const chart = v.chart;
  if (chart.kind !== "scatter") {
    return toolResultPayload(false, "create_scatter_chart: expected scatter chart after validation");
  }
  const pts = chart.series.reduce((n, s) => n + s.points.length, 0);
  return toolResultPayload(
    true,
    `create_scatter_chart: added scatter chart "${chart.id}" (${chart.series.length} series, ${pts} points)`,
  );
}
