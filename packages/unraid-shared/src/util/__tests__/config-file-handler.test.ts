import { expect, test, describe, beforeEach, afterEach } from "vitest";
import { readFile, writeFile, mkdir, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { ConfigFileHandler } from "../config-file-handler.js";
import { ConfigDefinition } from "../config-definition.js";

/**
 * TEST SCOPE: ConfigFileHandler Standalone File Operations
 *
 * BEHAVIORS TESTED:
 * • Configuration loading with error recovery cascade:
 *   - File exists & valid → load directly
 *   - File read fails → attempt migration → fallback to defaults
 *   - File valid but merged config fails validation → attempt migration
 *   - Migration succeeds but merged result fails validation → fallback to defaults
 *   - Migration fails → fallback to defaults
 * • File I/O operations (read, write) with validation
 * • Flash drive optimization (skip writes when config unchanged)
 * • Partial config updates with deep merging
 * • Error resilience (invalid JSON, validation failures, file system errors)
 * • End-to-end workflows (load → update → reload cycles)
 *
 * CRITICAL ERROR RECOVERY PATHS:
 * ✓ read failed → migration failed → defaults written
 * ✓ read failed → migration succeeded but combo validation failed → defaults written
 * ✓ read succeeded but merged validation failed → migration → recovery
 *
 * COVERAGE FOCUS:
 * • Data integrity during all error scenarios
 * • Performance optimization (change detection)
 * • Configuration persistence reliability
 * • Validation error handling at all stages
 *
 * NOT TESTED (covered in other files):
 * • NestJS integration and reactive changes (ConfigFilePersister)
 * • Abstract class behavior (ConfigDefinition)
 */

interface TestConfig {
  name: string;
  version: number;
  enabled: boolean;
  timeout: number;
  maxRetries?: number; // Optional field for testing merge validation
}

class TestConfigDefinition extends ConfigDefinition<TestConfig> {
  public migrationCallCount = 0;
  public migrationShouldFail = false;
  public validationShouldFail = false;
  public mergeValidationShouldFail = false; // New flag for the edge case

  constructor(private configDir: string) {
    super("TestConfigDefinition");
  }

  fileName(): string {
    return "test-config.json";
  }

  configPath(): string {
    return join(this.configDir, this.fileName());
  }

  defaultConfig(): TestConfig {
    return {
      name: "test",
      version: 1,
      enabled: false,
      timeout: 5000,
      maxRetries: 3, // Default includes maxRetries
    };
  }

  async validate(config: object): Promise<TestConfig> {
    if (this.validationShouldFail) {
      throw new Error("Validation failed");
    }

    const testConfig = config as TestConfig;

    // Basic validation
    if (typeof testConfig.version !== "number" || testConfig.version < 1) {
      throw new Error("Invalid version: must be >= 1");
    }

    if (typeof testConfig.timeout !== "number" || testConfig.timeout < 1000) {
      throw new Error("Invalid timeout: must be >= 1000");
    }

    // Critical edge case: maxRetries validation that could fail after merge
    if (testConfig.maxRetries !== undefined && testConfig.maxRetries < 0) {
      throw new Error("Invalid maxRetries: must be >= 0");
    }

    // Simulate a validation that fails specifically for merged configs
    if (this.mergeValidationShouldFail && testConfig.maxRetries === -1) {
      throw new Error("Merged validation failed: maxRetries cannot be -1");
    }

    return testConfig;
  }

  async migrateConfig(): Promise<TestConfig> {
    this.migrationCallCount++;

    if (this.migrationShouldFail) {
      throw new Error("Migration failed");
    }

    return {
      name: "migrated",
      version: 2,
      enabled: true,
      timeout: 3000,
      maxRetries: 5,
    };
  }
}

describe("ConfigFileHandler", () => {
  let testDir: string;
  let configPath: string;
  let configDefinition: TestConfigDefinition;
  let fileHandler: ConfigFileHandler<TestConfig>;

  beforeEach(async () => {
    testDir = join(tmpdir(), `config-handler-test-${Date.now()}`);
    await mkdir(testDir, { recursive: true });
    configPath = join(testDir, "test-config.json");

    configDefinition = new TestConfigDefinition(testDir);
    fileHandler = new ConfigFileHandler(configDefinition);
  });

  afterEach(async () => {
    await rm(testDir, { recursive: true, force: true });
  });

  describe("Critical loadConfig Scenarios", () => {
    test("loads valid config from file successfully", async () => {
      const validConfig = {
        name: "existing",
        version: 2,
        enabled: true,
        timeout: 3000,
        maxRetries: 2,
      };
      await writeFile(configPath, JSON.stringify(validConfig));

      const result = await fileHandler.loadConfig();
      expect(result.name).toBe("existing");
      expect(result.version).toBe(2);
      expect(result.maxRetries).toBe(2);
    });

    test("falls back to migration when file doesn't exist", async () => {
      const result = await fileHandler.loadConfig();

      expect(configDefinition.migrationCallCount).toBe(1);
      expect(result.name).toBe("migrated");
      expect(result.version).toBe(2);

      // Should persist migrated config
      const persistedContent = await readFile(configPath, "utf8");
      const persistedConfig = JSON.parse(persistedContent);
      expect(persistedConfig.name).toBe("migrated");
    });

    test("falls back to defaults when migration fails", async () => {
      configDefinition.migrationShouldFail = true;

      const result = await fileHandler.loadConfig();

      expect(result.name).toBe("test"); // From defaults
      expect(result.version).toBe(1);
    });

    test("CRITICAL: file valid but merged config fails validation - triggers migration", async () => {
      // File contains valid config but defaults have invalid maxRetries
      const fileConfig = {
        name: "file-valid",
        version: 2,
        enabled: true,
        timeout: 2000,
        // Note: no maxRetries in file
      };
      await writeFile(configPath, JSON.stringify(fileConfig));

      // Override defaults to include invalid value that fails after merge
      const originalDefaults = configDefinition.defaultConfig;
      configDefinition.defaultConfig = () => ({
        name: "test",
        version: 1,
        enabled: false,
        timeout: 5000,
        maxRetries: -1, // This will cause merged validation to fail!
      });

      configDefinition.mergeValidationShouldFail = true;

      // This should NOT throw - should catch validation error and migrate
      const result = await fileHandler.loadConfig();

      // Should have triggered migration due to validation failure
      expect(configDefinition.migrationCallCount).toBe(1);
      expect(result.name).toBe("migrated");
      expect(result.maxRetries).toBe(5); // From migration

      // Restore original method
      configDefinition.defaultConfig = originalDefaults;
    });

    test("handles invalid JSON by migrating", async () => {
      await writeFile(configPath, "{ invalid json");

      const result = await fileHandler.loadConfig();
      expect(configDefinition.migrationCallCount).toBe(1);
      expect(result.name).toBe("migrated");
    });

    test("CRITICAL: read failed → migration succeeded but merged validation fails → defaults used", async () => {
      // No file exists (read will fail)
      // Migration will succeed but return config that passes its own validation
      // But when merged with defaults, the result fails validation

      // Create a special definition for this edge case
      class SpecialMigrationDefinition extends TestConfigDefinition {
        async migrateConfig(): Promise<TestConfig> {
          this.migrationCallCount++;
          // Return a config that's valid on its own
          return {
            name: "migration-success",
            version: 2,
            enabled: true,
            timeout: 2000,
            // Missing maxRetries - will be merged from defaults
          };
        }

        async validate(config: object): Promise<TestConfig> {
          const testConfig = config as TestConfig;

          // Basic validation
          if (
            typeof testConfig.version !== "number" ||
            testConfig.version < 1
          ) {
            throw new Error("Invalid version: must be >= 1");
          }

          if (
            typeof testConfig.timeout !== "number" ||
            testConfig.timeout < 1000
          ) {
            throw new Error("Invalid timeout: must be >= 1000");
          }

          // This validation will fail after merge when maxRetries comes from defaults
          if (
            testConfig.maxRetries !== undefined &&
            testConfig.name === "migration-success" &&
            testConfig.maxRetries === 3
          ) {
            throw new Error(
              "Special validation failure: migration + defaults combo invalid"
            );
          }

          return testConfig;
        }
      }

      const specialDefinition = new SpecialMigrationDefinition(testDir);
      const specialHandler = new ConfigFileHandler(specialDefinition);

      // Should NOT throw - should catch validation error and fall back to defaults
      const result = await specialHandler.loadConfig();

      // Should have attempted migration
      expect(specialDefinition.migrationCallCount).toBe(1);

      // But result should be from defaults due to validation failure
      expect(result.name).toBe("test"); // From defaults
      expect(result.version).toBe(1); // From defaults
      expect(result.maxRetries).toBe(3); // From defaults
    });
  });

  describe("File Operations", () => {
    test("readConfigFile validates config from disk", async () => {
      const config = {
        name: "read-test",
        version: 2,
        enabled: true,
        timeout: 2000,
      };
      await writeFile(configPath, JSON.stringify(config));

      const result = await fileHandler.readConfigFile();
      expect(result).toEqual(config);
    });

    test("readConfigFile throws for invalid config", async () => {
      const invalidConfig = {
        name: "invalid",
        version: -1,
        enabled: true,
        timeout: 2000,
      };
      await writeFile(configPath, JSON.stringify(invalidConfig));

      await expect(fileHandler.readConfigFile()).rejects.toThrow(
        "Invalid version"
      );
    });

    test("writeConfigFile persists config to disk", async () => {
      const config = {
        name: "write-test",
        version: 3,
        enabled: true,
        timeout: 4000,
      };

      const success = await fileHandler.writeConfigFile(config);
      expect(success).toBe(true);

      const fileContent = await readFile(configPath, "utf8");
      expect(JSON.parse(fileContent)).toEqual(config);
    });

    test("writeConfigFile skips write when config unchanged (flash drive optimization)", async () => {
      const config = {
        name: "unchanged",
        version: 1,
        enabled: false,
        timeout: 5000,
      };
      await writeFile(configPath, JSON.stringify(config, null, 2));

      const success = await fileHandler.writeConfigFile(config);
      expect(success).toBe(false); // Skipped
    });

    test("writeConfigFile proceeds with write when existing file has invalid JSON", async () => {
      // Pre-existing file with invalid JSON
      await writeFile(configPath, "{ invalid json");

      const config = {
        name: "write-despite-invalid",
        version: 2,
        enabled: true,
        timeout: 4000,
      };

      // Should proceed with write despite invalid existing file
      const success = await fileHandler.writeConfigFile(config);
      expect(success).toBe(true);

      // Should have written valid config
      const fileContent = await readFile(configPath, "utf8");
      expect(JSON.parse(fileContent)).toEqual(config);
    });

    test("writeConfigFile handles validation errors", async () => {
      configDefinition.validationShouldFail = true;
      const config = {
        name: "invalid",
        version: 1,
        enabled: false,
        timeout: 5000,
      };

      const success = await fileHandler.writeConfigFile(config);
      expect(success).toBe(false);
    });
  });

  describe("updateConfig Operations", () => {
    test("updates existing config with partial changes", async () => {
      const existing = {
        name: "existing",
        version: 1,
        enabled: false,
        timeout: 5000,
      };
      await writeFile(configPath, JSON.stringify(existing));

      const success = await fileHandler.updateConfig({
        enabled: true,
        timeout: 8000,
      });
      expect(success).toBe(true);

      const updated = JSON.parse(await readFile(configPath, "utf8"));
      expect(updated.name).toBe("existing"); // Preserved
      expect(updated.enabled).toBe(true); // Updated
      expect(updated.timeout).toBe(8000); // Updated
    });

    test("creates config when file doesn't exist (via migration)", async () => {
      const updates = { name: "new", enabled: true };

      const success = await fileHandler.updateConfig(updates);
      expect(success).toBe(true);

      const created = JSON.parse(await readFile(configPath, "utf8"));
      expect(created.name).toBe("new"); // From update
      expect(created.version).toBe(2); // From migration (no file existed)
    });

    test("handles validation errors during update", async () => {
      const existing = {
        name: "existing",
        version: 1,
        enabled: false,
        timeout: 5000,
      };
      await writeFile(configPath, JSON.stringify(existing));

      const success = await fileHandler.updateConfig({ version: -1 }); // Invalid
      expect(success).toBe(false);

      // Original should be unchanged
      const unchanged = JSON.parse(await readFile(configPath, "utf8"));
      expect(unchanged.version).toBe(1);
    });
  });

  describe("Error Resilience", () => {
    test("handles write errors gracefully", async () => {
      const invalidDefinition = new TestConfigDefinition(
        "/invalid/readonly/path"
      );
      const invalidHandler = new ConfigFileHandler(invalidDefinition);

      const config = {
        name: "error-test",
        version: 1,
        enabled: false,
        timeout: 5000,
      };
      const success = await invalidHandler.writeConfigFile(config);
      expect(success).toBe(false);
    });
  });

  describe("End-to-End Workflow", () => {
    test("complete workflow: load -> update -> reload", async () => {
      // 1. Load (triggers migration since no file)
      let config = await fileHandler.loadConfig();
      expect(config.name).toBe("migrated");

      // 2. Update
      await fileHandler.updateConfig({ name: "workflow-test", timeout: 6000 });

      // 3. Reload from disk
      config = await fileHandler.readConfigFile();
      expect(config.name).toBe("workflow-test");
      expect(config.timeout).toBe(6000);
      expect(config.version).toBe(2); // Preserved from migration
    });
  });
});
