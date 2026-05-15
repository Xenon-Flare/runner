/** Keep in sync with `src/lib/artifact-placeholders.ts`. */

export type ArtifactRefKind = "chart" | "table" | "file" | "svg" | "list";

export type ArtifactRefs = {
  charts: string[];
  tables: string[];
  files: string[];
  svgs: string[];
  lists: string[];
};

const ARTIFACT_PLACEHOLDER =
  /\{\{\s*artifact\s*:\s*(chart|table|file|svg|list)\s*:\s*([^}]+?)\s*\}\}/gi;

function uniqueTrimmed(ids: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of ids) {
    const id = raw.trim();
    if (!id) continue;
    const key = id.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(id);
  }
  return out;
}

/** Collect placeholder ids from an assistant message (order preserved, de-duped). */
export function collectArtifactRefsFromMessage(message: string): ArtifactRefs {
  const charts: string[] = [];
  const tables: string[] = [];
  const files: string[] = [];
  const svgs: string[] = [];
  const lists: string[] = [];
  const re = new RegExp(ARTIFACT_PLACEHOLDER.source, "gi");
  let m: RegExpExecArray | null;
  while ((m = re.exec(message)) !== null) {
    const kind = (m[1] ?? "").toLowerCase();
    const ref = (m[2] ?? "").trim();
    if (!ref) continue;
    if (kind === "chart") charts.push(ref);
    else if (kind === "table") tables.push(ref);
    else if (kind === "svg") svgs.push(ref);
    else if (kind === "list") lists.push(ref);
    else files.push(ref);
  }
  return {
    charts: uniqueTrimmed(charts),
    tables: uniqueTrimmed(tables),
    files: uniqueTrimmed(files),
    svgs: uniqueTrimmed(svgs),
    lists: uniqueTrimmed(lists),
  };
}

export function messageHasArtifactPlaceholders(message: string): boolean {
  return new RegExp(ARTIFACT_PLACEHOLDER.source, "i").test(message);
}
