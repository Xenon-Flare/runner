/** Mirrors limits in `functions/src/workspaceJobs.ts`. */

import { parseArtifactFileName } from "./artifact-paths.js";

export const MAX_FILE_CONTENT_CHARS = 48_000;
/** Hard cap on spec files per run (abuse / payload size), not a product tier limit. */
export const MAX_FILES = 24;
export const MAX_CHARTS = 12;
export const MAX_DATASETS = 8;
export const MAX_SVGS = 8;
export const MAX_LISTS = 12;
export const MAX_LIST_ITEMS = 48;
export const MAX_LIST_ITEM_CHARS = 512;
export const MAX_SVG_CONTENT_CHARS = 64_000;
export const MAX_BAR_LABELS = 32;
export const MAX_BAR_SERIES = 8;
export const MAX_PIE_SEGMENTS = 24;
export const MAX_TABLE_COLUMNS = 12;
export const MAX_TABLE_ROWS = 80;
export const MAX_CELL_CHARS = 512;

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

export type RunnerChartPie = {
  kind: "pie";
  id: string;
  title?: string;
  segments: { label: string; value: number }[];
};

export type RunnerChart = RunnerChartBar | RunnerLineChart | RunnerChartPie;

export type RunnerDatasetTable = {
  id: string;
  kind: "table";
  title?: string;
  columns: string[];
  rows: string[][];
};

export type RunnerFile = { name: string; content: string };

export type RunnerSvg = {
  id: string;
  title?: string;
  content: string;
};

export type RunnerList = {
  id: string;
  kind: "list";
  title?: string;
  ordered?: boolean;
  items: string[];
};

const SVG_UNSAFE =
  /<script\b|javascript:|on\w+\s*=|<foreignObject\b|<iframe\b|<embed\b|<object\b/i;

function normalizeSvgContent(content: string): string {
  const trimmed = content.trim();
  if (!trimmed) return "";
  if (!trimmed.includes("<svg")) return "";
  if (SVG_UNSAFE.test(trimmed)) return "";
  return trimmed.length > MAX_SVG_CONTENT_CHARS
    ? trimmed.slice(0, MAX_SVG_CONTENT_CHARS)
    : trimmed;
}

export function validateRunnerFile(
  raw: unknown,
): { ok: true; file: RunnerFile } | { ok: false; error: string } {
  if (typeof raw !== "object" || raw === null) {
    return { ok: false, error: "file payload must be an object" };
  }
  const o = raw as { name?: unknown; content?: unknown };
  const name = typeof o.name === "string" ? o.name.trim().slice(0, 160) : "";
  const content = typeof o.content === "string" ? o.content : "";
  if (!name || !content) return { ok: false, error: "name and content are required" };
  if (content.length > MAX_FILE_CONTENT_CHARS) {
    return { ok: false, error: "content exceeds max length" };
  }
  const parsed = parseArtifactFileName(name);
  if (!parsed) {
    return { ok: false, error: "invalid file name (use name.md or folder/name.md)" };
  }
  if (!/\.(md|txt)$/i.test(parsed.baseName)) {
    return { ok: false, error: "name must end in .md or .txt" };
  }
  return { ok: true, file: { name: parsed.displayName, content } };
}

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

  return { ok: false, error: 'chart.kind must be "bar", "line", or "pie"' };
}

export function validateRunnerTable(
  raw: unknown,
): { ok: true; table: RunnerDatasetTable } | { ok: false; error: string } {
  if (typeof raw !== "object" || raw === null) {
    return { ok: false, error: "table must be an object" };
  }
  const o = raw as Record<string, unknown>;
  if (o.kind !== "table") return { ok: false, error: 'table.kind must be "table"' };
  const id = typeof o.id === "string" ? o.id.trim().slice(0, 64) : "";
  if (!id) return { ok: false, error: "table id is required" };
  const dtitle =
    typeof o.title === "string" ? o.title.trim().slice(0, 200) : undefined;
  if (!Array.isArray(o.columns) || o.columns.length === 0) {
    return { ok: false, error: "columns required" };
  }
  if (o.columns.length > MAX_TABLE_COLUMNS) {
    return { ok: false, error: "too many columns" };
  }
  const columns = o.columns.map((c) =>
    typeof c === "string" ? c.trim().slice(0, 64) : "",
  );
  if (columns.some((c) => !c)) return { ok: false, error: "invalid column name" };
  if (!Array.isArray(o.rows)) return { ok: false, error: "rows required" };
  if (o.rows.length > MAX_TABLE_ROWS) return { ok: false, error: "too many rows" };
  const rows: string[][] = [];
  for (const row of o.rows) {
    if (!Array.isArray(row) || row.length !== columns.length) {
      return { ok: false, error: "each row must match column count" };
    }
    const cells = row.map((cell) => {
      if (typeof cell !== "string") return "";
      return cell.length > MAX_CELL_CHARS ? cell.slice(0, MAX_CELL_CHARS) : cell;
    });
    rows.push(cells);
  }
  return {
    ok: true,
    table: { id, kind: "table", title: dtitle, columns, rows },
  };
}

export function validateRunnerSvg(
  raw: unknown,
): { ok: true; svg: RunnerSvg } | { ok: false; error: string } {
  if (typeof raw !== "object" || raw === null) {
    return { ok: false, error: "svg must be an object" };
  }
  const o = raw as Record<string, unknown>;
  const id = typeof o.id === "string" ? o.id.trim().slice(0, 64) : "";
  if (!id) return { ok: false, error: "svg id is required" };
  if (!/^[a-zA-Z0-9_-]+$/.test(id)) {
    return { ok: false, error: "svg id must be alphanumeric (underscore/hyphen ok)" };
  }
  const title =
    typeof o.title === "string" ? o.title.trim().slice(0, 200) : undefined;
  const content =
    typeof o.content === "string" ? normalizeSvgContent(o.content) : "";
  if (!content) {
    return {
      ok: false,
      error: "svg content must be valid SVG markup (root <svg>, no scripts)",
    };
  }
  return { ok: true, svg: { id, title, content } };
}

export function validateRunnerList(
  raw: unknown,
): { ok: true; list: RunnerList } | { ok: false; error: string } {
  if (typeof raw !== "object" || raw === null) {
    return { ok: false, error: "list must be an object" };
  }
  const o = raw as Record<string, unknown>;
  if (o.kind !== "list") return { ok: false, error: 'list.kind must be "list"' };
  const id = typeof o.id === "string" ? o.id.trim().slice(0, 64) : "";
  if (!id) return { ok: false, error: "list id is required" };
  if (!/^[a-zA-Z0-9_-]+$/.test(id)) {
    return { ok: false, error: "list id must be alphanumeric (underscore/hyphen ok)" };
  }
  const title =
    typeof o.title === "string" ? o.title.trim().slice(0, 200) : undefined;
  if (!Array.isArray(o.items) || o.items.length === 0) {
    return { ok: false, error: "list items required" };
  }
  if (o.items.length > MAX_LIST_ITEMS) {
    return { ok: false, error: "too many list items" };
  }
  const items: string[] = [];
  for (const item of o.items) {
    if (typeof item !== "string") return { ok: false, error: "each list item must be a string" };
    const t = item.trim();
    if (!t) return { ok: false, error: "list items cannot be empty" };
    items.push(t.length > MAX_LIST_ITEM_CHARS ? t.slice(0, MAX_LIST_ITEM_CHARS) : t);
  }
  const ordered = o.ordered === true;
  return {
    ok: true,
    list: { id, kind: "list", title, ordered: ordered || undefined, items },
  };
}
