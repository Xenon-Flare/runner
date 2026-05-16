import {
  MAX_BAR_LABELS,
  MAX_BAR_SERIES,
  MAX_PIE_SEGMENTS,
  MAX_SCATTER_POINTS_PER_SERIES,
  MAX_SCATTER_SERIES,
} from "./deliverable-limits.js";

export type BarChartOrientation = "vertical" | "horizontal";

export type RunnerChartBar = {
  kind: "bar";
  id: string;
  title?: string;
  labels: string[];
  series: { name: string; values: number[] }[];
  orientation?: BarChartOrientation;
};

export type RunnerLineChart = {
  kind: "line";
  id: string;
  title?: string;
  labels: string[];
  series: { name: string; values: number[] }[];
};

/** Filled areas under lines — same data shape as line charts. */
export type RunnerAreaChart = {
  kind: "area";
  id: string;
  title?: string;
  labels: string[];
  series: { name: string; values: number[] }[];
};

export type RunnerScatterPoint = {
  x: number;
  y: number;
  /** Optional point label for tooltips */
  label?: string;
};

export type RunnerScatterChart = {
  kind: "scatter";
  id: string;
  title?: string;
  series: { name: string; points: RunnerScatterPoint[] }[];
};

/** Same series/labels as bar, but segments stack; all values must be ≥ 0. */
export type RunnerStackedBarChart = {
  kind: "stacked_bar";
  id: string;
  title?: string;
  labels: string[];
  series: { name: string; values: number[] }[];
  orientation?: BarChartOrientation;
};

export type RunnerChartPie = {
  kind: "pie";
  id: string;
  title?: string;
  segments: { label: string; value: number }[];
};

export type RunnerChart =
  | RunnerChartBar
  | RunnerLineChart
  | RunnerAreaChart
  | RunnerScatterChart
  | RunnerStackedBarChart
  | RunnerChartPie;

export function validateRunnerChart(
  raw: unknown,
): { ok: true; chart: RunnerChart } | { ok: false; error: string } {
  if (typeof raw !== "object" || raw === null) {
    return { ok: false, error: "chart must be an object" };
  }
  const o = raw as Record<string, unknown>;
  const id = typeof o.id === "string" ? o.id.trim().slice(0, 64) : "";
  if (!id) return { ok: false, error: "chart id is required" };
  const title =
    typeof o.title === "string" ? o.title.trim().slice(0, 200) : undefined;

  if (o.kind === "bar") {
    if (!Array.isArray(o.labels)) return { ok: false, error: "bar chart needs labels" };
    const labels = o.labels
      .map((l) => (typeof l === "string" ? l.trim().slice(0, 128) : ""))
      .filter(Boolean);
    if (labels.length === 0 || labels.length > MAX_BAR_LABELS) {
      return { ok: false, error: "invalid bar labels length" };
    }
    if (!Array.isArray(o.series)) return { ok: false, error: "bar chart needs series" };
    if (o.series.length === 0 || o.series.length > MAX_BAR_SERIES) {
      return { ok: false, error: "invalid bar series count" };
    }
    const series: { name: string; values: number[] }[] = [];
    for (const s of o.series) {
      if (typeof s !== "object" || s === null) return { ok: false, error: "invalid series item" };
      const sn = s as { name?: unknown; values?: unknown };
      const name = typeof sn.name === "string" ? sn.name.trim().slice(0, 64) : "";
      if (!name) return { ok: false, error: "series name required" };
      if (!Array.isArray(sn.values) || sn.values.length !== labels.length) {
        return { ok: false, error: "series values must match labels length" };
      }
      const values: number[] = [];
      for (const v of sn.values) {
        if (typeof v !== "number" || !Number.isFinite(v)) {
          return { ok: false, error: "series values must be finite numbers" };
        }
        values.push(v);
      }
      series.push({ name, values });
    }
    let orientation: BarChartOrientation | undefined;
    if (o.orientation !== undefined) {
      if (o.orientation !== "vertical" && o.orientation !== "horizontal") {
        return {
          ok: false,
          error: 'bar orientation must be "vertical" or "horizontal"',
        };
      }
      orientation = o.orientation;
    }
    const chart: RunnerChartBar = { kind: "bar", id, title, labels, series };
    if (orientation) chart.orientation = orientation;
    return { ok: true, chart };
  }

  if (o.kind === "line") {
    if (!Array.isArray(o.labels)) return { ok: false, error: "line chart needs labels" };
    const labels = o.labels
      .map((l) => (typeof l === "string" ? l.trim().slice(0, 128) : ""))
      .filter(Boolean);
    if (labels.length === 0 || labels.length > MAX_BAR_LABELS) {
      return { ok: false, error: "invalid line labels length" };
    }
    if (!Array.isArray(o.series)) return { ok: false, error: "line chart needs series" };
    if (o.series.length === 0 || o.series.length > MAX_BAR_SERIES) {
      return { ok: false, error: "invalid line series count" };
    }
    const series: { name: string; values: number[] }[] = [];
    for (const s of o.series) {
      if (typeof s !== "object" || s === null) return { ok: false, error: "invalid series item" };
      const sn = s as { name?: unknown; values?: unknown };
      const name = typeof sn.name === "string" ? sn.name.trim().slice(0, 64) : "";
      if (!name) return { ok: false, error: "series name required" };
      if (!Array.isArray(sn.values) || sn.values.length !== labels.length) {
        return { ok: false, error: "series values must match labels length" };
      }
      const values: number[] = [];
      for (const v of sn.values) {
        if (typeof v !== "number" || !Number.isFinite(v)) {
          return { ok: false, error: "series values must be finite numbers" };
        }
        values.push(v);
      }
      series.push({ name, values });
    }
    return { ok: true, chart: { kind: "line", id, title, labels, series } };
  }

  if (o.kind === "pie") {
    if (!Array.isArray(o.segments)) return { ok: false, error: "pie chart needs segments" };
    if (o.segments.length === 0 || o.segments.length > MAX_PIE_SEGMENTS) {
      return { ok: false, error: "invalid pie segment count" };
    }
    const segments: { label: string; value: number }[] = [];
    for (const seg of o.segments) {
      if (typeof seg !== "object" || seg === null) return { ok: false, error: "invalid segment" };
      const sg = seg as { label?: unknown; value?: unknown };
      const label = typeof sg.label === "string" ? sg.label.trim().slice(0, 128) : "";
      if (!label) return { ok: false, error: "segment label required" };
      if (typeof sg.value !== "number" || !Number.isFinite(sg.value)) {
        return { ok: false, error: "segment value must be a finite number" };
      }
      segments.push({ label, value: sg.value });
    }
    return { ok: true, chart: { kind: "pie", id, title, segments } };
  }

  if (o.kind === "area") {
    if (!Array.isArray(o.labels)) return { ok: false, error: "area chart needs labels" };
    const labels = o.labels
      .map((l) => (typeof l === "string" ? l.trim().slice(0, 128) : ""))
      .filter(Boolean);
    if (labels.length === 0 || labels.length > MAX_BAR_LABELS) {
      return { ok: false, error: "invalid area labels length" };
    }
    if (!Array.isArray(o.series)) return { ok: false, error: "area chart needs series" };
    if (o.series.length === 0 || o.series.length > MAX_BAR_SERIES) {
      return { ok: false, error: "invalid area series count" };
    }
    const series: { name: string; values: number[] }[] = [];
    for (const s of o.series) {
      if (typeof s !== "object" || s === null) return { ok: false, error: "invalid series item" };
      const sn = s as { name?: unknown; values?: unknown };
      const name = typeof sn.name === "string" ? sn.name.trim().slice(0, 64) : "";
      if (!name) return { ok: false, error: "series name required" };
      if (!Array.isArray(sn.values) || sn.values.length !== labels.length) {
        return { ok: false, error: "series values must match labels length" };
      }
      const values: number[] = [];
      for (const v of sn.values) {
        if (typeof v !== "number" || !Number.isFinite(v)) {
          return { ok: false, error: "series values must be finite numbers" };
        }
        values.push(v);
      }
      series.push({ name, values });
    }
    return { ok: true, chart: { kind: "area", id, title, labels, series } };
  }

  if (o.kind === "scatter") {
    if (!Array.isArray(o.series)) return { ok: false, error: "scatter chart needs series" };
    if (o.series.length === 0 || o.series.length > MAX_SCATTER_SERIES) {
      return { ok: false, error: "invalid scatter series count" };
    }
    const series: { name: string; points: RunnerScatterPoint[] }[] = [];
    for (const s of o.series) {
      if (typeof s !== "object" || s === null) return { ok: false, error: "invalid scatter series" };
      const sn = s as { name?: unknown; points?: unknown };
      const name = typeof sn.name === "string" ? sn.name.trim().slice(0, 64) : "";
      if (!name) return { ok: false, error: "scatter series name required" };
      if (!Array.isArray(sn.points) || sn.points.length === 0) {
        return { ok: false, error: "scatter series needs points" };
      }
      if (sn.points.length > MAX_SCATTER_POINTS_PER_SERIES) {
        return { ok: false, error: "too many scatter points in a series" };
      }
      const points: RunnerScatterPoint[] = [];
      for (const p of sn.points) {
        if (typeof p !== "object" || p === null) return { ok: false, error: "invalid scatter point" };
        const pt = p as { x?: unknown; y?: unknown; label?: unknown };
        if (typeof pt.x !== "number" || !Number.isFinite(pt.x)) {
          return { ok: false, error: "scatter point x must be finite" };
        }
        if (typeof pt.y !== "number" || !Number.isFinite(pt.y)) {
          return { ok: false, error: "scatter point y must be finite" };
        }
        const label =
          typeof pt.label === "string" ? pt.label.trim().slice(0, 128) : undefined;
        points.push(label ? { x: pt.x, y: pt.y, label } : { x: pt.x, y: pt.y });
      }
      series.push({ name, points });
    }
    return { ok: true, chart: { kind: "scatter", id, title, series } };
  }

  if (o.kind === "stacked_bar") {
    if (!Array.isArray(o.labels)) return { ok: false, error: "stacked bar chart needs labels" };
    const labels = o.labels
      .map((l) => (typeof l === "string" ? l.trim().slice(0, 128) : ""))
      .filter(Boolean);
    if (labels.length === 0 || labels.length > MAX_BAR_LABELS) {
      return { ok: false, error: "invalid stacked bar labels length" };
    }
    if (!Array.isArray(o.series)) return { ok: false, error: "stacked bar chart needs series" };
    if (o.series.length === 0 || o.series.length > MAX_BAR_SERIES) {
      return { ok: false, error: "invalid stacked bar series count" };
    }
    const series: { name: string; values: number[] }[] = [];
    for (const s of o.series) {
      if (typeof s !== "object" || s === null) return { ok: false, error: "invalid series item" };
      const sn = s as { name?: unknown; values?: unknown };
      const name = typeof sn.name === "string" ? sn.name.trim().slice(0, 64) : "";
      if (!name) return { ok: false, error: "series name required" };
      if (!Array.isArray(sn.values) || sn.values.length !== labels.length) {
        return { ok: false, error: "series values must match labels length" };
      }
      const values: number[] = [];
      for (const v of sn.values) {
        if (typeof v !== "number" || !Number.isFinite(v)) {
          return { ok: false, error: "series values must be finite numbers" };
        }
        if (v < 0) {
          return { ok: false, error: "stacked bar values must be non-negative" };
        }
        values.push(v);
      }
      series.push({ name, values });
    }
    let orientation: BarChartOrientation | undefined;
    if (o.orientation !== undefined) {
      if (o.orientation !== "vertical" && o.orientation !== "horizontal") {
        return {
          ok: false,
          error: 'stacked bar orientation must be "vertical" or "horizontal"',
        };
      }
      orientation = o.orientation;
    }
    const chart: RunnerStackedBarChart = { kind: "stacked_bar", id, title, labels, series };
    if (orientation) chart.orientation = orientation;
    return { ok: true, chart };
  }

  return {
    ok: false,
    error:
      'chart.kind must be "bar", "line", "area", "scatter", "stacked_bar", or "pie"',
  };
}
