import { parseArtifactFileName } from "./artifact-paths.js";
import { MAX_FILE_CONTENT_CHARS } from "./deliverable-limits.js";

export type RunnerFile = { name: string; content: string };

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
