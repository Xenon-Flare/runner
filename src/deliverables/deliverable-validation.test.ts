import { describe, expect, it } from "vitest";
import {
  validateRunnerChart,
  validateRunnerFile,
  validateRunnerSvg,
  validateRunnerTable,
} from "./deliverable-validation.js";

describe("validateRunnerFile", () => {
  it("accepts md file", () => {
    const r = validateRunnerFile({ name: "Spec.md", content: "# Hi" });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.file.name).toBe("Spec.md");
  });
  it("rejects bad extension", () => {
    const r = validateRunnerFile({ name: "x.json", content: "{}" });
    expect(r.ok).toBe(false);
  });
  it("accepts folder path", () => {
    const r = validateRunnerFile({ name: "specs/PRD.md", content: "# Hi" });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.file.name).toBe("specs/PRD.md");
  });
});

describe("validateRunnerChart", () => {
  it("accepts bar chart", () => {
    const r = validateRunnerChart({
      kind: "bar",
      id: "c1",
      labels: ["A"],
      series: [{ name: "n", values: [1] }],
    });
    expect(r.ok).toBe(true);
  });
  it("accepts line chart", () => {
    const r = validateRunnerChart({
      kind: "line",
      id: "l1",
      labels: ["Jan", "Feb"],
      series: [{ name: "rev", values: [1, 2] }],
    });
    expect(r.ok).toBe(true);
  });
  it("accepts bar with orientation", () => {
    const r = validateRunnerChart({
      kind: "bar",
      id: "b1",
      labels: ["A"],
      series: [{ name: "n", values: [1] }],
      orientation: "vertical",
    });
    expect(r.ok).toBe(true);
  });
  it("rejects bad bar orientation", () => {
    const r = validateRunnerChart({
      kind: "bar",
      id: "b1",
      labels: ["A"],
      series: [{ name: "n", values: [1] }],
      orientation: "sideways",
    });
    expect(r.ok).toBe(false);
  });
  it("accepts pie chart", () => {
    const r = validateRunnerChart({
      kind: "pie",
      id: "p1",
      segments: [{ label: "x", value: 2 }],
    });
    expect(r.ok).toBe(true);
  });
});

describe("validateRunnerTable", () => {
  it("accepts table", () => {
    const r = validateRunnerTable({
      kind: "table",
      id: "t1",
      columns: ["a"],
      rows: [["b"]],
    });
    expect(r.ok).toBe(true);
  });
});

describe("validateRunnerSvg", () => {
  it("accepts minimal svg", () => {
    const r = validateRunnerSvg({
      id: "arch",
      content: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><rect width="10" height="10"/></svg>',
    });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.svg.id).toBe("arch");
  });

  it("rejects script in svg", () => {
    const r = validateRunnerSvg({
      id: "bad",
      content: '<svg><script>alert(1)</script></svg>',
    });
    expect(r.ok).toBe(false);
  });
});
