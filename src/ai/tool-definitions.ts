/** OpenAI Responses API `tools` entries for the deliverable loop. */

import { buildRunnerInstructions } from "./instructions.js";
import type { FunctionToolDef } from "./tool-types.js";

export type { FunctionToolDef } from "./tool-types.js";

export { MAX_ASSISTANT_MESSAGE_CHARS, MAX_DELIVERABLE_REPAIR_ROUNDS, MAX_TOOL_ROUNDS } from "./limits.js";

/** @deprecated Use {@link buildRunnerInstructions} — kept for a single import surface. */
export const buildInstructions = buildRunnerInstructions;

export const runnerTools: FunctionToolDef[] = [
  {
    type: "function",
    name: "create_file",
    strict: false,
    description:
      "Persist a .md or .txt artifact the workspace can download. Use it for long authoritative docs (PRD, API contracts, copy-paste prompts). " +
      'The `name` MUST match any {{artifact:file:<name>}} token later (including folders). If you only need bullets or steps, prefer create_list—not a file with markdown lists.',
    parameters: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description:
            'Relative path ending in .md or .txt (e.g. "MVP.md", "specs/API.md"). Duplicate this string exactly in {{artifact:file:<name>}}.',
        },
        content: {
          type: "string",
          description:
            "Complete UTF-8 document body. Avoid markdown tables or bullet lists inside the file when those should be separate table/list artifacts.",
        },
      },
      required: ["name", "content"],
    },
  },
  {
    type: "function",
    name: "create_pie_chart",
    strict: false,
    description:
      "Use for parts-of-a-whole: budget splits, mix %, market share, status distribution, survey breakdown. " +
      "Each segment is a labeled slice with a positive numeric `value` (they need not sum to 100; the UI normalizes). " +
      "After success, cite {{artifact:chart:<id>}} using the same id string.",
    parameters: {
      type: "object",
      properties: {
        id: {
          type: "string",
          description:
            "Stable token for placeholders, e.g. `revenue-mix`. Must match `{{artifact:chart:<id>}}` exactly (case-sensitive).",
        },
        title: {
          type: "string",
          description: "Optional short headline shown above the chart.",
        },
        segments: {
          type: "array",
          description:
            "Slices: each item `{ label: string, value: number }` with finite non-negative numbers.",
          items: {
            type: "object",
            properties: {
              label: { type: "string", description: "Slice label shown in the legend." },
              value: {
                type: "number",
                description: "Numeric weight; need not sum to 100 (UI normalizes).",
              },
            },
            required: ["label", "value"],
          },
        },
      },
      required: ["id", "segments"],
    },
  },
  {
    type: "function",
    name: "create_bar_chart",
    strict: false,
    description:
      "Use for comparing numeric values across categories: feature scoring, quarterly KPIs, team velocity, rankings. " +
      "labels = X-axis categories (shared). series = one or more named series; each values array must align 1:1 with labels. " +
      "orientation: vertical = column chart (default feel); horizontal = horizontal bars for long labels. " +
      "Then cite {{artifact:chart:<id>}}.",
    parameters: {
      type: "object",
      properties: {
        id: {
          type: "string",
          description: "Must match `{{artifact:chart:<id>}}` exactly.",
        },
        title: { type: "string", description: "Optional chart title." },
        labels: {
          type: "array",
          description: "Category labels (strings), same length as each series.values array.",
          items: { type: "string" },
        },
        series: {
          type: "array",
          description:
            'Named numeric series: [{ "name": "Q1", "values": [10, 20, ...] }, ...]; every values length === labels.length.',
          items: {
            type: "object",
            properties: {
              name: { type: "string", description: "Series name for the legend." },
              values: {
                type: "array",
                description: "One number per label index; same length as labels.",
                items: { type: "number" },
              },
            },
            required: ["name", "values"],
          },
        },
        orientation: {
          type: "string",
          description: 'Optional `"vertical"` (columns) or `"horizontal"` (bars).',
        },
      },
      required: ["id", "labels", "series"],
    },
  },
  {
    type: "function",
    name: "create_line_chart",
    strict: false,
    description:
      "Use for trends over ordered points: time series, before/after, growth curves, sequential benchmarks. " +
      "labels = ordered X labels (dates, weeks, steps). series = lines; each values aligns with labels. " +
      "Do not use this for part-of-whole (use create_pie_chart) or simple category comparison (often create_bar_chart). " +
      "Cite {{artifact:chart:<id>}} after success.",
    parameters: {
      type: "object",
      properties: {
        id: {
          type: "string",
          description: "Must match `{{artifact:chart:<id>}}` exactly.",
        },
        title: { type: "string", description: "Optional chart title." },
        labels: {
          type: "array",
          description: "Ordered X-axis labels; each series.values must have the same length.",
          items: { type: "string" },
        },
        series: {
          type: "array",
          description:
            'Lines: [{ "name": "ARR", "values": [1.2, 1.5, ...] }, ...]; finite numbers only.',
          items: {
            type: "object",
            properties: {
              name: { type: "string", description: "Line name for the legend." },
              values: {
                type: "array",
                description: "Y values aligned to labels; finite numbers only.",
                items: { type: "number" },
              },
            },
            required: ["name", "values"],
          },
        },
      },
      required: ["id", "labels", "series"],
    },
  },
  {
    type: "function",
    name: "create_area_chart",
    strict: false,
    description:
      "Like create_line_chart but with filled areas under each series — good for cumulative trends, capacity curves, or volume over time. " +
      "Same parameters as create_line_chart. Cite {{artifact:chart:<id>}} after success.",
    parameters: {
      type: "object",
      properties: {
        id: { type: "string", description: "Must match `{{artifact:chart:<id>}}` exactly." },
        title: { type: "string", description: "Optional chart title." },
        labels: {
          type: "array",
          description: "Ordered X-axis labels; each series.values must have the same length.",
          items: { type: "string" },
        },
        series: {
          type: "array",
          description: "Named numeric series aligned 1:1 with labels.",
          items: {
            type: "object",
            properties: {
              name: { type: "string" },
              values: { type: "array", items: { type: "number" } },
            },
            required: ["name", "values"],
          },
        },
      },
      required: ["id", "labels", "series"],
    },
  },
  {
    type: "function",
    name: "create_scatter_chart",
    strict: false,
    description:
      "Numeric X/Y scatter plot — correlations, latency vs throughput, experiment sweeps. " +
      "Each series has `name` and `points: [{ x, y, label? }, ...]`. Cite {{artifact:chart:<id>}} after success.",
    parameters: {
      type: "object",
      properties: {
        id: { type: "string", description: "Must match `{{artifact:chart:<id>}}` exactly." },
        title: { type: "string", description: "Optional chart title." },
        series: {
          type: "array",
          description:
            '[{ "name": "A", "points": [{ "x": 1, "y": 2, "label": "run-1" }, ...] }, ...]; x and y must be finite numbers.',
          items: {
            type: "object",
            properties: {
              name: { type: "string" },
              points: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    x: { type: "number" },
                    y: { type: "number" },
                    label: { type: "string", description: "Optional tooltip label." },
                  },
                  required: ["x", "y"],
                },
              },
            },
            required: ["name", "points"],
          },
        },
      },
      required: ["id", "series"],
    },
  },
  {
    type: "function",
    name: "create_stacked_bar_chart",
    strict: false,
    description:
      "Stacked vertical or horizontal bars — composition per category when series are additive (must be non-negative). " +
      "Same parameters as create_bar_chart. Cite {{artifact:chart:<id>}} after success.",
    parameters: {
      type: "object",
      properties: {
        id: { type: "string", description: "Must match `{{artifact:chart:<id>}}` exactly." },
        title: { type: "string", description: "Optional chart title." },
        labels: {
          type: "array",
          description: "Category labels; each series.values aligns 1:1.",
          items: { type: "string" },
        },
        series: {
          type: "array",
          description: "Named numeric series; every value must be ≥ 0.",
          items: {
            type: "object",
            properties: {
              name: { type: "string" },
              values: { type: "array", items: { type: "number" } },
            },
            required: ["name", "values"],
          },
        },
        orientation: {
          type: "string",
          description: 'Optional `"vertical"` or `"horizontal"` (default horizontal).',
        },
      },
      required: ["id", "labels", "series"],
    },
  },
  {
    type: "function",
    name: "create_table",
    strict: false,
    description:
      "Mandatory for grids of cells (feature comparison, RACI-lite, glossary, KPI matrix). " +
      "If your assistant prose would have used markdown pipe rows, STOP and call this instead. Tokens {{artifact:table:<id>}} only work AFTER this succeeds with the same id.",
    parameters: {
      type: "object",
      properties: {
        table: {
          type: "object",
          description:
            '{ kind:"table", id, title?, columns:string[], rows:string[][] } — each row length === columns.length. id must match {{artifact:table:<id>}}.',
        },
      },
      required: ["table"],
    },
  },
  {
    type: "function",
    name: "create_list",
    strict: false,
    description:
      "Produce structured bullets/numbered steps/checklists/product scope items consumed by the web UI. " +
      "If you intend to emit {{artifact:list:some-id}}, you MUST call create_list FIRST in this job with {'kind':'list','id':'some-id', ...}. " +
      "Never fabricate placeholders without the tool—the runner rejects the workspace job permanently after repair attempts. Use ordered:true for runbooks/phases/step lists.",
    parameters: {
      type: "object",
      properties: {
        list: {
          type: "object",
          description:
            '{ kind:"list", id, title?, ordered?:boolean, items:string[] } — items are plain strings without markdown prefixes. Provide id using [a-zA-Z0-9_-]; duplicate it verbatim in {{artifact:list:<id>}}.',
        },
      },
      required: ["list"],
    },
  },
  {
    type: "function",
    name: "create_checklist",
    strict: false,
    description:
      "Interactive checklist the user can tick in the Studio UI (persisted to Storage). " +
      "Use for launch QA, migration gates, onboarding tasks — not the same as create_list (read-only bullets). " +
      "If you emit {{artifact:checklist:<id>}}, you MUST call create_checklist first with matching id. " +
      "Each item needs stable `id`, `label`, and `checked` (boolean).",
    parameters: {
      type: "object",
      properties: {
        checklist: {
          type: "object",
          description:
            '{ kind:"checklist", id, title?, items:[{id,label,checked}] } — item ids must be unique [a-zA-Z0-9_-]+.',
        },
      },
      required: ["checklist"],
    },
  },
  {
    type: "function",
    name: "create_svg",
    strict: false,
    description:
      "Optional inline vector diagram (architecture, sequence sketch). Not for charts with numeric axes. id must match {{artifact:svg:<id>}}.",
    parameters: {
      type: "object",
      properties: {
        svg: {
          type: "object",
          description:
            '{ id, title?, content } — content must be standalone <svg>...</svg>, no scripts/foreignObject/iframes.',
        },
      },
      required: ["svg"],
    },
  },
];
