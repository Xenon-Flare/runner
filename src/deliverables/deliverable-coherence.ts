import { collectArtifactRefsFromMessage } from "./artifact-placeholders.js";
import type { RunnerAccumulator } from "../ai/runner-accumulator.js";

export type MissingDeliverables = {
  charts: string[];
  tables: string[];
  files: string[];
  svgs: string[];
  lists: string[];
};

export function findMissingDeliverables(
  assistantMessage: string,
  acc: RunnerAccumulator,
): MissingDeliverables {
  const refs = collectArtifactRefsFromMessage(assistantMessage);
  const chartIds = new Set(acc.charts.map((c) => c.id.toLowerCase()));
  const tableIds = new Set(acc.datasets.map((d) => d.id.toLowerCase()));
  const fileNames = new Set(acc.files.map((f) => f.name.toLowerCase()));
  const svgIds = new Set(acc.svgs.map((s) => s.id.toLowerCase()));
  const listIds = new Set(acc.lists.map((l) => l.id.toLowerCase()));

  return {
    charts: refs.charts.filter((id) => !chartIds.has(id.toLowerCase())),
    tables: refs.tables.filter((id) => !tableIds.has(id.toLowerCase())),
    files: refs.files.filter((name) => !fileNames.has(name.toLowerCase())),
    svgs: refs.svgs.filter((id) => !svgIds.has(id.toLowerCase())),
    lists: refs.lists.filter((id) => !listIds.has(id.toLowerCase())),
  };
}

export function missingDeliverablesIsEmpty(m: MissingDeliverables): boolean {
  return (
    m.charts.length === 0 &&
    m.tables.length === 0 &&
    m.files.length === 0 &&
    m.svgs.length === 0 &&
    m.lists.length === 0
  );
}

export function formatMissingDeliverables(m: MissingDeliverables): string {
  const lines: string[] = [];
  for (const id of m.charts) lines.push(`chart:${id}`);
  for (const id of m.tables) lines.push(`table:${id}`);
  for (const name of m.files) lines.push(`file:${name}`);
  for (const id of m.svgs) lines.push(`svg:${id}`);
  for (const id of m.lists) lines.push(`list:${id}`);
  return lines.join(", ");
}

/** User turn fed back into the Responses API when placeholders lack tool outputs. */
export function buildDeliverableRepairPrompt(
  missing: MissingDeliverables,
  assistantMessage: string,
): string {
  const tasks: string[] = [];
  for (const id of missing.charts) {
    tasks.push(
      `- Invoke **one** of \`create_pie_chart\`, \`create_bar_chart\`, or \`create_line_chart\` with \`id\` exactly \`${id}\` (match the tool to the visualization: pie = composition, bar = category comparison, line = trend). Use finite numeric data only. Do not simulate with prose.`,
    );
  }
  for (const id of missing.tables) {
    tasks.push(
      `- Invoke the \`create_table\` tool with \`kind:"table"\` and \`id\` exactly \`${id}\` (columns + rows). Markdown pipe tables are not accepted.`,
    );
  }
  for (const id of missing.lists) {
    tasks.push(
      `- Invoke the \`create_list\` tool with \`kind:"list"\` and \`id\` exactly \`${id}\`. Populate \`items\` now (ordered steps → set \`ordered: true\`). Do not substitute markdown bullets.`,
    );
  }
  for (const name of missing.files) {
    tasks.push(
      `- Invoke the \`create_file\` tool with \`name\` exactly \`${name}\` (preserve any folder prefix, e.g. \`specs/Plan.md\`).`,
    );
  }
  for (const id of missing.svgs) {
    tasks.push(
      `- Invoke the \`create_svg\` tool with \`id\` exactly \`${id}\` and valid root \`<svg>\` markup (no scripts).`,
    );
  }

  const excerpt =
    assistantMessage.length > 1200
      ? `${assistantMessage.slice(0, 1200)}…`
      : assistantMessage;

  return [
    "DELIVERABLE VALIDATION FAILED",
    "",
    "Your last assistant message contains {{artifact:...}} placeholders, but no matching tool payloads were persisted for those ids.",
    "You MUST issue the corresponding tool calls in this Responses turn (parallel calls are OK). Printing placeholders without tools will always fail verification.",
    "",
    "Required tool invocations:",
    ...tasks,
    "",
    "Rules:",
    "1. Do not send a terminal assistant message until every line above returns a successful tool result (runner echoes JSON like {\"ok\":true,...}).",
    "2. If you need bullets, phases, MVP scope, or checklists → \`create_list\` every time — never `- item` / `1.` lists in prose.",
    "3. Charts/tables only exist when \`create_pie_chart\` / \`create_bar_chart\` / \`create_line_chart\` / \`create_table\` succeed; placeholders are cosmetic hooks, not substitutes.",
    "4. Repeat the SAME {{artifact:...}} tokens after tools succeed so the narrative still references the artifacts.",
    "",
    "Previous message excerpt:",
    excerpt,
  ].join("\n");
}
