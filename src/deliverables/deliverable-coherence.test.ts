import { describe, expect, it } from "vitest";
import {
  buildDeliverableRepairPrompt,
  findMissingDeliverables,
  missingDeliverablesIsEmpty,
} from "./deliverable-coherence.js";

describe("findMissingDeliverables", () => {
  it("detects chart placeholders without chart tool output", () => {
    const missing = findMissingDeliverables(
      "Cost {{artifact:chart:costs_pie}} and timeline {{artifact:chart:timeline_bar}}",
      { files: [], charts: [], datasets: [], svgs: [], lists: [], checklists: [] },
    );
    expect(missing.charts).toEqual(["costs_pie", "timeline_bar"]);
    expect(missingDeliverablesIsEmpty(missing)).toBe(false);
  });

  it("passes when every placeholder has a deliverable", () => {
    const missing = findMissingDeliverables(
      "See {{artifact:chart:c1}} and {{artifact:file:specs/Plan.md}}",
      {
        files: [{ name: "specs/Plan.md", content: "# Plan" }],
        charts: [
          {
            kind: "pie",
            id: "c1",
            segments: [{ label: "A", value: 1 }],
          },
        ],
        datasets: [],
        svgs: [],
        lists: [],
        checklists: [],
      },
    );
    expect(missingDeliverablesIsEmpty(missing)).toBe(true);
  });

  it("builds repair prompt listing missing tools", () => {
    const prompt = buildDeliverableRepairPrompt(
      { charts: ["costs_pie"], tables: ["export_table"], files: [], svgs: [], lists: [], checklists: [] },
      "Body {{artifact:chart:costs_pie}}",
    );
    expect(prompt).toContain("chart");
    expect(prompt).toContain("costs_pie");
    expect(prompt).toContain("create_table");
    expect(prompt).toContain("export_table");
  });
});
