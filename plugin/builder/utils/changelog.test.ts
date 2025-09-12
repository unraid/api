import { describe, it, expect } from "vitest";
import { getStagingChangelogFromGit } from "./changelog";

describe("getStagingChangelogFromGit", () => {
  it("should generate changelog for recent commits", async () => {
    const result = await getStagingChangelogFromGit({
      pluginVersion: "4.21.0",
      tag: undefined as any,
    });

    expect(result).toBeDefined();
    expect(typeof result).toBe("string");
    // Should contain version header
    expect(result).toContain("4.21.0");
  });

  it("should generate changelog with custom tag", async () => {
    const result = await getStagingChangelogFromGit({
      pluginVersion: "4.21.0",
      tag: "v4.21.0-test",
    });

    expect(result).toBeDefined();
    expect(typeof result).toBe("string");
  });

  it("should generate full changelog when tag is provided", async () => {
    const result = await getStagingChangelogFromGit({
      pluginVersion: "4.21.0", 
      tag: "v4.21.0",
    });

    expect(result).toBeDefined();
    expect(typeof result).toBe("string");
    // When tag is provided with releaseCount: 0, it should generate full history
  });
});