/** File path layout for Storage — keep in sync with functions/src/workspaceArtifactStorage.ts. */

const MAX_FOLDER_DEPTH = 4;
const MAX_SEGMENT_LEN = 48;

function sanitizeSegment(segment: string): string {
  return segment
    .trim()
    .replace(/[^a-zA-Z0-9._-]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, MAX_SEGMENT_LEN);
}

export type ParsedArtifactFileName = {
  /** Full name for UI / placeholders (e.g. `specs/PRD.md`). */
  displayName: string;
  /** Leaf file name (e.g. `PRD.md`). */
  baseName: string;
  /** Sanitized folder under `runs/<messageId>/files/` (empty when flat). */
  storageFolder: string;
};

export function parseArtifactFileName(name: string): ParsedArtifactFileName | null {
  const normalized = name.replace(/\\/g, "/").replace(/^\/+/, "").trim();
  if (!normalized) return null;
  const rawParts = normalized.split("/").filter((p) => p && p !== "." && p !== "..");
  if (rawParts.length === 0) return null;
  const segments = rawParts.map(sanitizeSegment).filter(Boolean);
  if (segments.length === 0) return null;
  if (segments.length > MAX_FOLDER_DEPTH + 1) return null;

  const baseName = segments[segments.length - 1]!;
  const storageFolder = segments.length > 1 ? segments.slice(0, -1).join("/") : "";
  return {
    displayName: segments.join("/"),
    baseName,
    storageFolder,
  };
}

export function fileExtension(baseName: string): string {
  const lower = baseName.toLowerCase();
  if (lower.endsWith(".md")) return ".md";
  if (lower.endsWith(".txt")) return ".txt";
  return ".txt";
}

export function storagePathForArtifactFile(params: {
  root: string;
  userId: string;
  workspaceId: string;
  messageId: string;
  fileId: string;
  fileName: string;
}): string | null {
  const parsed = parseArtifactFileName(params.fileName);
  if (!parsed) return null;
  const ext = fileExtension(parsed.baseName);
  const prefix = `${params.root}/${params.userId}/${params.workspaceId}/runs/${params.messageId}/files`;
  if (parsed.storageFolder) {
    return `${prefix}/${parsed.storageFolder}/${params.fileId}${ext}`;
  }
  return `${prefix}/${params.fileId}${ext}`;
}
