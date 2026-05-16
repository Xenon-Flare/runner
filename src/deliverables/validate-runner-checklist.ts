import { MAX_CHECKLIST_ITEMS, MAX_CHECKLIST_LABEL_CHARS } from "./deliverable-limits.js";

export type RunnerChecklistItem = {
  id: string;
  label: string;
  checked: boolean;
};

export type RunnerChecklist = {
  id: string;
  kind: "checklist";
  title?: string;
  items: RunnerChecklistItem[];
};

export function validateRunnerChecklist(
  raw: unknown,
): { ok: true; checklist: RunnerChecklist } | { ok: false; error: string } {
  if (typeof raw !== "object" || raw === null) {
    return { ok: false, error: "checklist must be an object" };
  }
  const o = raw as Record<string, unknown>;
  if (o.kind !== "checklist") return { ok: false, error: 'checklist.kind must be "checklist"' };
  const id = typeof o.id === "string" ? o.id.trim().slice(0, 64) : "";
  if (!id) return { ok: false, error: "checklist id is required" };
  if (!/^[a-zA-Z0-9_-]+$/.test(id)) {
    return { ok: false, error: "checklist id must be alphanumeric (underscore/hyphen ok)" };
  }
  const title =
    typeof o.title === "string" ? o.title.trim().slice(0, 200) : undefined;
  if (!Array.isArray(o.items) || o.items.length === 0) {
    return { ok: false, error: "checklist items required" };
  }
  if (o.items.length > MAX_CHECKLIST_ITEMS) {
    return { ok: false, error: "too many checklist items" };
  }
  const seen = new Set<string>();
  const items: RunnerChecklistItem[] = [];
  for (const row of o.items) {
    if (typeof row !== "object" || row === null) return { ok: false, error: "invalid checklist item" };
    const it = row as { id?: unknown; label?: unknown; checked?: unknown };
    const itemId = typeof it.id === "string" ? it.id.trim().slice(0, 48) : "";
    if (!itemId || !/^[a-zA-Z0-9_-]+$/.test(itemId)) {
      return { ok: false, error: "each checklist item needs a stable id" };
    }
    const key = itemId.toLowerCase();
    if (seen.has(key)) return { ok: false, error: "duplicate checklist item id" };
    seen.add(key);
    const label = typeof it.label === "string" ? it.label.trim() : "";
    if (!label) return { ok: false, error: "checklist item label required" };
    const trimmedLabel =
      label.length > MAX_CHECKLIST_LABEL_CHARS ? label.slice(0, MAX_CHECKLIST_LABEL_CHARS) : label;
    const checked = it.checked === true;
    items.push({ id: itemId, label: trimmedLabel, checked });
  }
  return { ok: true, checklist: { id, kind: "checklist", title, items } };
}
