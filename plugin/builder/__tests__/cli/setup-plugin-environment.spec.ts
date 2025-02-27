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

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(readFile).mockImplementation((path, encoding) => {
    console.log("Mock readFile called with:", path, encoding);
    
    // If called with encoding parameter (for release notes)
    if (encoding === "utf8") {
      if (path.toString().includes("valid-release-notes.txt")) {
        return Promise.resolve("Release notes content");
      }
    }
    // If called without encoding (for txz file)
    if (path.toString().includes("test.txz")) {
      return Promise.resolve(Buffer.from("test content"));
    }
    
    return Promise.reject(new Error(`File not found: ${path}`));
  });
  vi.mocked(access).mockResolvedValue(undefined);
});

describe("validatePluginEnv", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("validates required fields", async () => {
    const validEnv = {
      baseUrl: "https://example.com",
      txzPath: "./test.txz",
      pluginVersion: "2024.05.05.1232",
    };

    const result = await validatePluginEnv(validEnv);
    expect(result).toMatchObject(validEnv);
  });

  it("throws on invalid URL", async () => {
    const invalidEnv = {
      baseUrl: "not-a-url",
      txzPath: "./test.txz",
      pluginVersion: "2024.05.05.1232",
    };

    await expect(validatePluginEnv(invalidEnv)).rejects.toThrow();
  });

  it("handles tag option in non-CI mode", async () => {
    const envWithTag = {
      baseUrl: "https://example.com",
      txzPath: "./test.txz",
      pluginVersion: "2024.05.05.1232",
      tag: "v1.0.0",
    };

    const result = await validatePluginEnv(envWithTag);

    expect(result.releaseNotes).toBe("FAST_TEST_CHANGELOG");
    expect(result.tag).toBe("v1.0.0");
  });

  it("reads release notes when release-notes-path is provided", async () => {
    const envWithNotes = {
      baseUrl: "https://example.com",
      txzPath: "./test.txz",
      pluginVersion: "2024.05.05.1232",
      releaseNotesPath: "valid-release-notes.txt",
    };

    const result = await validatePluginEnv(envWithNotes);

    expect(access).toHaveBeenCalledWith("valid-release-notes.txt", 0);
    expect(readFile).toHaveBeenCalledWith("valid-release-notes.txt", "utf8");
    expect(result.releaseNotes).toBe("Release notes content");
  });

  it("throws when release notes file is empty", async () => {
    // Instead of overwriting the entire mock, just mock this specific case
    vi.mocked(readFile).mockImplementationOnce((path, encoding) => {
      if (path === "/path/to/notes.md" && encoding === "utf8") {
        return Promise.resolve("");
      }
      return Promise.reject(new Error("Unexpected mock call"));
    });

    const envWithEmptyNotes = {
      baseUrl: "https://example.com",
      txzPath: "./test.txz",
      pluginVersion: "2024.05.05.1232",
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
      "2024.05.05.1232",
      "--txz-path",
      "./test.txz",
      "--base-url",
      "https://example.com",
    ];

    const result = await setupPluginEnv(argv);
    expect(result).toMatchObject({
      pluginVersion: "2024.05.05.1232",
      txzPath: "./test.txz",
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
      "--txz-path",
      "./test.txz",
      "--base-url",
      "https://example.com",
      "--tag",
      "PR1203",
      "--ci",
      "--plugin-version",
      "2024.05.05.1232",
    ];

    try {
      const result = await setupPluginEnv(argv);
      expect(result).toMatchObject({
        pluginVersion: "2024.05.05.1232",
        txzPath: "./test.txz",
        txzSha256:
          "6ae8a75555209fd6c44157c0aed8016e763ff435a19cf186f76863140143ff72",
        baseUrl: "https://example.com",
        tag: "PR1203",
        ci: true,
      });
    } catch (error) {
      console.error("Error:", error);
      throw error;
    }
  });
});
