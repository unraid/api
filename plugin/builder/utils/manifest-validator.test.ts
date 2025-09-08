import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdir, writeFile, rm } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";
import { 
  validateStandaloneManifest, 
  getStandaloneManifestPath,
  type StandaloneManifest 
} from "./manifest-validator";

describe("manifest-validator", () => {
  let testDir: string;
  let manifestPath: string;

  beforeEach(async () => {
    // Create a temporary test directory
    testDir = join(tmpdir(), `manifest-test-${Date.now()}`);
    await mkdir(testDir, { recursive: true });
    manifestPath = join(testDir, "standalone.manifest.json");
  });

  afterEach(async () => {
    // Clean up test directory
    await rm(testDir, { recursive: true, force: true });
  });

  describe("validateStandaloneManifest", () => {
    it("should fail when manifest file does not exist", async () => {
      const result = await validateStandaloneManifest(join(testDir, "nonexistent.json"));
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain("Manifest file does not exist");
    });

    it("should fail when manifest has invalid JSON", async () => {
      await writeFile(manifestPath, "{ invalid json");
      
      const result = await validateStandaloneManifest(manifestPath);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain("Failed to parse manifest JSON");
    });

    it("should pass for valid manifest with existing files", async () => {
      // Create the referenced files
      await writeFile(join(testDir, "app.js"), "console.log('app');");
      await writeFile(join(testDir, "app.css"), "body { color: red; }");
      
      // Create valid manifest
      const manifest: StandaloneManifest = {
        "app.js": {
          file: "app.js",
          src: "app.js",
          isEntry: true,
        },
        "app.css": {
          file: "app.css",
          src: "app.css",
        },
        ts: Date.now(),
      };
      
      await writeFile(manifestPath, JSON.stringify(manifest, null, 2));
      
      const result = await validateStandaloneManifest(manifestPath);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.warnings).toHaveLength(0);
    });

    it("should fail when referenced files are missing", async () => {
      const manifest: StandaloneManifest = {
        "app.js": {
          file: "app.js",
          src: "app.js",
        },
        "app.css": {
          file: "app.css",
          src: "app.css",
        },
      };
      
      await writeFile(manifestPath, JSON.stringify(manifest, null, 2));
      
      const result = await validateStandaloneManifest(manifestPath);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(2);
      expect(result.errors).toContain("Missing file referenced in manifest: app.js");
      expect(result.errors).toContain("Missing file referenced in manifest: app.css");
    });

    it("should fail when CSS files in array are missing", async () => {
      await writeFile(join(testDir, "app.js"), "console.log('app');");
      
      const manifest: StandaloneManifest = {
        "app.js": {
          file: "app.js",
          css: ["style1.css", "style2.css"],
        },
      };
      
      await writeFile(manifestPath, JSON.stringify(manifest, null, 2));
      
      const result = await validateStandaloneManifest(manifestPath);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(2);
      expect(result.errors).toContain("Missing CSS file referenced in manifest: style1.css");
      expect(result.errors).toContain("Missing CSS file referenced in manifest: style2.css");
    });

    it("should fail when asset files are missing", async () => {
      await writeFile(join(testDir, "app.js"), "console.log('app');");
      
      const manifest: StandaloneManifest = {
        "app.js": {
          file: "app.js",
          assets: ["image.png", "font.woff2"],
        },
      };
      
      await writeFile(manifestPath, JSON.stringify(manifest, null, 2));
      
      const result = await validateStandaloneManifest(manifestPath);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(2);
      expect(result.errors).toContain("Missing asset file referenced in manifest: image.png");
      expect(result.errors).toContain("Missing asset file referenced in manifest: font.woff2");
    });

    it("should warn for missing imports but not fail", async () => {
      await writeFile(join(testDir, "app.js"), "console.log('app');");
      
      const manifest: StandaloneManifest = {
        "app.js": {
          file: "app.js",
          imports: ["virtual-module"],
        },
      };
      
      await writeFile(manifestPath, JSON.stringify(manifest, null, 2));
      
      const result = await validateStandaloneManifest(manifestPath);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0]).toContain("Missing import file referenced in manifest: virtual-module");
    });

    it("should skip timestamp field", async () => {
      await writeFile(join(testDir, "app.js"), "console.log('app');");
      
      const manifest = {
        "app.js": {
          file: "app.js",
        },
        ts: 1234567890,
      };
      
      await writeFile(manifestPath, JSON.stringify(manifest, null, 2));
      
      const result = await validateStandaloneManifest(manifestPath);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should warn for non-entry fields", async () => {
      await writeFile(join(testDir, "app.js"), "console.log('app');");
      
      const manifest = {
        "app.js": {
          file: "app.js",
        },
        "invalid": "not an entry",
      };
      
      await writeFile(manifestPath, JSON.stringify(manifest, null, 2));
      
      const result = await validateStandaloneManifest(manifestPath);
      
      expect(result.isValid).toBe(true);
      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0]).toContain("Skipping non-entry field: invalid");
    });

    it("should fail when no JavaScript entry exists", async () => {
      await writeFile(join(testDir, "app.css"), "body { color: red; }");
      
      const manifest: StandaloneManifest = {
        "app.css": {
          file: "app.css",
        },
      };
      
      await writeFile(manifestPath, JSON.stringify(manifest, null, 2));
      
      const result = await validateStandaloneManifest(manifestPath);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain("Manifest must contain at least one JavaScript entry file");
    });

    it("should not check duplicate files multiple times", async () => {
      await writeFile(join(testDir, "app.js"), "console.log('app');");
      await writeFile(join(testDir, "shared.css"), "body { color: red; }");
      
      const manifest: StandaloneManifest = {
        "entry1": {
          file: "app.js",
          css: ["shared.css"],
        },
        "entry2": {
          file: "app.js",
          css: ["shared.css"],
        },
      };
      
      await writeFile(manifestPath, JSON.stringify(manifest, null, 2));
      
      const result = await validateStandaloneManifest(manifestPath);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe("getStandaloneManifestPath", () => {
    it("should find manifest in standalone subdirectory (preferred)", async () => {
      const standaloneDir = join(testDir, "standalone");
      await mkdir(standaloneDir, { recursive: true });
      const standaloneManifestPath = join(standaloneDir, "standalone.manifest.json");
      await writeFile(standaloneManifestPath, "{}");
      
      const path = getStandaloneManifestPath(testDir);
      
      expect(path).toBe(standaloneManifestPath);
    });

    it("should find manifest in root directory", async () => {
      await writeFile(manifestPath, "{}");
      
      const path = getStandaloneManifestPath(testDir);
      
      expect(path).toBe(manifestPath);
    });

    it("should find manifest in nuxt subdirectory for backwards compatibility", async () => {
      const nuxtDir = join(testDir, "nuxt");
      await mkdir(nuxtDir, { recursive: true });
      const nuxtManifestPath = join(nuxtDir, "standalone.manifest.json");
      await writeFile(nuxtManifestPath, "{}");
      
      const path = getStandaloneManifestPath(testDir);
      
      expect(path).toBe(nuxtManifestPath);
    });

    it("should prefer standalone subdirectory over root and nuxt", async () => {
      // Create manifest in all locations
      const standaloneDir = join(testDir, "standalone");
      await mkdir(standaloneDir, { recursive: true });
      const standaloneManifestPath = join(standaloneDir, "standalone.manifest.json");
      await writeFile(standaloneManifestPath, "{}");
      
      await writeFile(manifestPath, "{}");
      
      const nuxtDir = join(testDir, "nuxt");
      await mkdir(nuxtDir, { recursive: true });
      await writeFile(join(nuxtDir, "standalone.manifest.json"), "{}");
      
      const path = getStandaloneManifestPath(testDir);
      
      expect(path).toBe(standaloneManifestPath);
    });

    it("should return null when no manifest exists", async () => {
      const path = getStandaloneManifestPath(testDir);
      
      expect(path).toBeNull();
    });
  });
});