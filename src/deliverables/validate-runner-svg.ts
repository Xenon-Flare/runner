import { MAX_SVG_CONTENT_CHARS } from "./deliverable-limits.js";

export type RunnerSvg = {
  id: string;
  title?: string;
  content: string;
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
