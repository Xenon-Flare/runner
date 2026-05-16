import { MAX_LIST_ITEM_CHARS, MAX_LIST_ITEMS } from "./deliverable-limits.js";

export type RunnerList = {
  id: string;
  kind: "list";
  title?: string;
  ordered?: boolean;
  items: string[];
};

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
