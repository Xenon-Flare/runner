import { MAX_CELL_CHARS, MAX_TABLE_COLUMNS, MAX_TABLE_ROWS } from "./deliverable-limits.js";

export type RunnerDatasetTable = {
  id: string;
  kind: "table";
  title?: string;
  columns: string[];
  rows: string[][];
};

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
