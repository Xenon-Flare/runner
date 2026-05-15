import { describe, expect, it } from "vitest";
import { parseArtifactFileName, storagePathForArtifactFile } from "./artifact-paths.js";

describe("parseArtifactFileName", () => {
  it("accepts flat names", () => {
    const p = parseArtifactFileName("MVP_ColorPaletteSite.md");
    expect(p?.displayName).toBe("MVP_ColorPaletteSite.md");
    expect(p?.storageFolder).toBe("");
  });

  it("accepts folder prefixes", () => {
    const p = parseArtifactFileName("specs/MVP_ColorPaletteSite.md");
    expect(p?.displayName).toBe("specs/MVP_ColorPaletteSite.md");
    expect(p?.storageFolder).toBe("specs");
  });

  it("builds nested storage path", () => {
    const path = storagePathForArtifactFile({
      root: "workspaces",
      userId: "u1",
      workspaceId: "w1",
      messageId: "m1",
      fileId: "f1",
      fileName: "exports/checklist.txt",
    });
    expect(path).toBe(
      "workspaces/u1/w1/runs/m1/files/exports/f1.txt",
    );
  });
});
