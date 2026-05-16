import type { RunnerAccumulator } from "./runner-accumulator.js";
import { applyCreateAreaChart } from "./tools/apply-create-area-chart.js";
import { applyCreateBarChart } from "./tools/apply-create-bar-chart.js";
import { applyCreateChecklist } from "./tools/apply-create-checklist.js";
import { applyCreateFile } from "./tools/apply-create-file.js";
import { applyCreateLineChart } from "./tools/apply-create-line-chart.js";
import { applyCreateList } from "./tools/apply-create-list.js";
import { applyCreatePieChart } from "./tools/apply-create-pie-chart.js";
import { applyCreateScatterChart } from "./tools/apply-create-scatter-chart.js";
import { applyCreateStackedBarChart } from "./tools/apply-create-stacked-bar-chart.js";
import { applyCreateSvg } from "./tools/apply-create-svg.js";
import { applyCreateTable } from "./tools/apply-create-table.js";
import { toolResultPayload } from "./tools/tool-result.js";

export type { RunnerAccumulator };

export { toolResultPayload } from "./tools/tool-result.js";

export function applyToolCall(
  acc: RunnerAccumulator,
  name: string,
  argsRaw: string,
): string {
  let parsed: unknown;
  try {
    parsed = argsRaw ? (JSON.parse(argsRaw) as unknown) : {};
  } catch {
    return toolResultPayload(
      false,
      "tool call arguments must be valid JSON (check trailing commas and quoting)",
    );
  }

  switch (name) {
    case "create_file":
      return applyCreateFile(acc, parsed);
    case "create_pie_chart":
      return applyCreatePieChart(acc, parsed);
    case "create_bar_chart":
      return applyCreateBarChart(acc, parsed);
    case "create_line_chart":
      return applyCreateLineChart(acc, parsed);
    case "create_area_chart":
      return applyCreateAreaChart(acc, parsed);
    case "create_scatter_chart":
      return applyCreateScatterChart(acc, parsed);
    case "create_stacked_bar_chart":
      return applyCreateStackedBarChart(acc, parsed);
    case "create_table":
      return applyCreateTable(acc, parsed);
    case "create_list":
      return applyCreateList(acc, parsed);
    case "create_checklist":
      return applyCreateChecklist(acc, parsed);
    case "create_svg":
      return applyCreateSvg(acc, parsed);
    default:
      return toolResultPayload(
        false,
        `unknown tool "${name}". Use create_file, create_pie_chart, create_bar_chart, create_stacked_bar_chart, create_line_chart, create_area_chart, create_scatter_chart, create_table, create_list, create_checklist, or create_svg.`,
      );
  }
}
