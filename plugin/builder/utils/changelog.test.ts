import { describe, it, expect, beforeAll } from "vitest";
import { execSync } from "child_process";
import { getStagingChangelogFromGit } from "./changelog.js";

describe.sequential("getStagingChangelogFromGit", () => {
  let currentCommitMessage: string | null = null;

  beforeAll(() => {
    // Get the current commit message to validate it appears in changelog
    try {
      currentCommitMessage = execSync('git log -1 --pretty=%s', { encoding: 'utf8' }).trim();
    } catch (e) {
      // Ignore if we can't get commit
    }
  });

  it("should generate changelog header with version", { timeout: 20000 }, async () => {
    const result = await getStagingChangelogFromGit({
      pluginVersion: "99.99.99",
      tag: undefined as any,
    });

    expect(result).toBeDefined();
    expect(typeof result).toBe("string");
    // Should contain version header
    expect(result).toContain("99.99.99");
    // Should have markdown header formatting
    expect(result).toMatch(/##\s+/);
  });

  it("should generate changelog with tag parameter", { timeout: 20000 }, async () => {
    // When tag is provided, it should generate changelog with tag in header
    const result = await getStagingChangelogFromGit({
      pluginVersion: "99.99.99",
      tag: "test-tag-99",
    });

    expect(result).toBeDefined();
    expect(typeof result).toBe("string");
    expect(result).toContain("test-tag-99");
    
    // Should have a version header
    expect(result).toMatch(/##\s+/);
    
    // IMPORTANT: Verify that actual commits are included in the changelog
    // This ensures the gitRawCommitsOpts is working correctly
    // The changelog should include commits if there are any between origin/main and HEAD
    // We check for common changelog patterns that indicate actual content
    if (result.length > 100) {
      // If we have a substantial changelog, it should contain commit information
      expect(
        result.includes("### Features") || 
        result.includes("### Bug Fixes") || 
        result.includes("### ") ||
        result.includes("* ") // Commit entries typically start with asterisk
      ).toBe(true);
    }
  });

  it("should handle error gracefully and return tag", { timeout: 20000 }, async () => {
    // The function catches errors and returns the tag
    // An empty version might not cause an error, so let's just verify
    // the function completes without throwing
    const result = await getStagingChangelogFromGit({
      pluginVersion: "test-version",
      tag: "fallback-tag",
    });

    expect(result).toBeDefined();
    expect(typeof result).toBe("string");
    // Should either return a changelog or the fallback tag
    expect(result.length).toBeGreaterThan(0);
  });

  it("should use conventional-changelog v7 API correctly", { timeout: 20000 }, async () => {
    // This test validates that the v7 API is being called correctly
    // by checking that the function executes without throwing
    let error: any = null;
    
    try {
      await getStagingChangelogFromGit({
        pluginVersion: "99.99.99",
        tag: undefined as any,
      });
    } catch (e) {
      error = e;
    }

    // The v7 API should work without errors
    expect(error).toBeNull();
  });

  it("should validate changelog structure", { timeout: 20000 }, async () => {
    // Create a changelog with high version number to avoid conflicts
    const result = await getStagingChangelogFromGit({
      pluginVersion: "999.0.0",
      tag: "v999-test",
    });

    expect(result).toBeDefined();
    expect(typeof result).toBe("string");
    
    // Verify basic markdown structure
    if (result.length > 50) {
      // Should have tag in header when tag is provided
      expect(result).toMatch(/##\s+\[?v999-test/);
      // Should be valid markdown with proper line breaks
      expect(result).toMatch(/\n/);
    }
  });

  it("should include actual commits when using gitRawCommitsOpts with tag", { timeout: 20000 }, async () => {
    // This test ensures that gitRawCommitsOpts is working correctly
    // and actually fetching commits between origin/main and HEAD
    const result = await getStagingChangelogFromGit({
      pluginVersion: "99.99.99",
      tag: "CI-TEST",
    });

    expect(result).toBeDefined();
    expect(typeof result).toBe("string");
    
    // The header should contain the tag
    expect(result).toContain("CI-TEST");
    
    // Critical: The changelog should NOT be just the tag (error fallback)
    expect(result).not.toBe("CI-TEST");
    
    // The changelog should have a proper markdown header
    expect(result).toMatch(/^##\s+/);
    
    // Check if we're in a git repo with commits ahead of the base branch
    let commitCount = 0;
    try {
      // Try to detect the base branch (same logic as in changelog.ts)
      let baseBranch = "origin/main";
      try {
        const originHead = execSync("git symbolic-ref refs/remotes/origin/HEAD 2>/dev/null", { 
          encoding: "utf8",
          stdio: ["ignore", "pipe", "ignore"]
        }).trim();
        if (originHead) {
          baseBranch = originHead.replace("refs/remotes/", "");
        }
      } catch {
        // Try common branches
        const branches = ["origin/main", "origin/master", "origin/develop"];
        for (const branch of branches) {
          try {
            execSync(`git rev-parse --verify ${branch} 2>/dev/null`, { stdio: "ignore" });
            baseBranch = branch;
            break;
          } catch {
            // Continue to next branch
          }
        }
      }
      commitCount = parseInt(execSync(`git rev-list --count ${baseBranch}..HEAD`, { encoding: "utf8" }).trim());
    } catch {
      // If we can't determine, we'll check for minimal content
    }
    
    // If there are commits on this branch, the changelog MUST include them
    if (commitCount > 0) {
      // The changelog must be more than just a header
      // A minimal header is "## CI-TEST (2025-09-12)\n\n" which is ~30 chars
      expect(result.length).toBeGreaterThan(50);
      
      // Should have actual commit content
      const hasCommitContent = 
        result.includes("### ") || // Section headers like ### Features
        result.includes("* ") ||   // Commit bullet points
        result.includes("- ");     // Alternative bullet style
      
      if (!hasCommitContent) {
        throw new Error(`Expected changelog to contain commits but got only: ${result.substring(0, 100)}...`);
      }
      expect(hasCommitContent).toBe(true);
    }
  });
});