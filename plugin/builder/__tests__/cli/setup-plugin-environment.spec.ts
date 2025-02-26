import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  validatePluginEnv,
  setupPluginEnv,
} from "../../cli/setup-plugin-environment";
import { access, readFile } from "node:fs/promises";

// Mock fs/promises
vi.mock("node:fs/promises", () => ({
  access: vi.fn(),
  readFile: vi.fn(),
  constants: {
    F_OK: 0,
  },
}));

describe("validatePluginEnv", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  it("validates required fields", async () => {
    const validEnv = {
      baseUrl: "https://example.com",
      txzSha256: "abc123",
      txzName: "test.txz",
      pluginVersion: "1.0.0",
    };

    const result = await validatePluginEnv(validEnv);
    expect(result).toMatchObject(validEnv);
  });

  it("throws on invalid URL", async () => {
    const invalidEnv = {
      baseUrl: "not-a-url",
      txzSha256: "abc123",
      txzName: "test.txz",
      pluginVersion: "1.0.0",
      env: "PRODUCTION",
    };

    await expect(validatePluginEnv(invalidEnv)).rejects.toThrow();
  });

  it("handles tag option with wait in non-CI mode", async () => {
    const envWithTag = {
      baseUrl: "https://example.com",
      txzSha256: "abc123",
      txzName: "test.txz",
      pluginVersion: "1.0.0",
      env: "PRODUCTION",
      tag: "v1.0.0",
    };

    const validatePromise = validatePluginEnv(envWithTag);
    await vi.advanceTimersByTimeAsync(1000);
    const result = await validatePromise;

    expect(result.tag).toBe("v1.0.0");
  });

  it("reads release notes when release-notes-path is provided", async () => {
    const mockNotes = "Release notes content";
    vi.mocked(access).mockResolvedValue(undefined);
    vi.mocked(readFile).mockResolvedValue(mockNotes);

    const envWithNotes = {
      baseUrl: "https://example.com",
      txzSha256: "abc123",
      txzName: "test.txz",
      pluginVersion: "1.0.0",
      env: "PRODUCTION",
      releaseNotesPath: "/path/to/notes.md",
    };

    const result = await validatePluginEnv(envWithNotes);

    expect(access).toHaveBeenCalledWith("/path/to/notes.md", 0);
    expect(readFile).toHaveBeenCalledWith("/path/to/notes.md", "utf8");
    expect(result.releaseNotes).toBe(mockNotes);
  });

  it("throws when release notes file is empty", async () => {
    vi.mocked(access).mockResolvedValue(undefined);
    vi.mocked(readFile).mockResolvedValue("");

    const envWithEmptyNotes = {
      baseUrl: "https://example.com",
      txzSha256: "abc123",
      txzName: "test.txz",
      pluginVersion: "1.0.0",
      env: "PRODUCTION",
      releaseNotesPath: "/path/to/notes.md",
    };

    await expect(validatePluginEnv(envWithEmptyNotes)).rejects.toThrow(
      "Release notes file is empty: /path/to/notes.md"
    );
  });
});

describe("setupPluginEnv", () => {
  it("sets up environment from CLI arguments", async () => {
    const argv = [
      "node",
      "script.js",
      "--plugin-version",
      "1.0.0",
      "--txz-sha256",
      "abc123",
      "--txz-name",
      "test.txz",
      "--base-url",
      "https://example.com",
    ];

    const result = await setupPluginEnv(argv);
    expect(result).toMatchObject({
      pluginVersion: "1.0.0",
      txzSha256: "abc123",
      txzName: "test.txz",
      baseUrl: "https://example.com",
    });
  });

  it("throws when required options are missing", async () => {
    const argv = ["node", "script.js"]; // Missing required options
    await expect(setupPluginEnv(argv)).rejects.toThrow();
  });

  it("handles optional CLI arguments", async () => {
    const argv = [
      "node",
      "script.js",
      "--plugin-version",
      "1.0.0",
      "--txz-sha256",
      "abc123",
      "--txz-name",
      "test.txz",
      "--base-url",
      "https://example.com",
      "--tag",
      "v1.0.0",
      "--local-fileserver-url",
      "http://localhost:8080",
      "--ci",
      "--plugin-version",
      "2024.05.05.123211",
    ];

    try {
      const result = await setupPluginEnv(argv);
      expect(result).toMatchObject({
        pluginVersion: "2024.05.05.123211",
        txzSha256: "abc123",
        txzName: "test.txz",
        baseUrl: "https://example.com",
        tag: "v1.0.0",
        localFileserverUrl: "http://localhost:8080",
        ci: true,
      });
    } catch (error) {
      console.error("Error:", error);
      throw error;
    }
  });
});
