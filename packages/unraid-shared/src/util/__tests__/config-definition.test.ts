import { expect, test, describe, beforeEach } from "bun:test";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { ConfigDefinition } from "../config-definition.js";

/**
 * TEST SCOPE: ConfigDefinition Abstract Base Class
 *
 * BEHAVIORS TESTED:
 * • Core abstract method implementations (fileName, configPath, defaultConfig)
 * • Default validation behavior (passthrough without transformation)
 * • Custom validation with data transformation and error throwing
 * • Default migration behavior (throws "Not implemented" error)
 * • Custom migration implementation with success and failure scenarios
 * • Error propagation from validation and migration methods
 *
 * COVERAGE FOCUS:
 * • Abstract class contract enforcement
 * • Extension point behavior (validate, migrate methods)
 * • Error handling patterns for implementors
 * • Type safety and configuration structure validation
 *
 * NOT TESTED (covered in other files):
 * • File I/O operations (ConfigFileHandler)
 * • NestJS integration (ConfigFilePersister)
 * • Reactive config changes
 */

interface TestConfig {
  name: string;
  version: number;
  enabled: boolean;
  timeout: number;
}

class TestConfigDefinition extends ConfigDefinition<TestConfig> {
  constructor(private configDir: string, loggerName?: string) {
    super(loggerName);
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
    };
  }
}

class ValidatingConfigDefinition extends TestConfigDefinition {
  async validate(config: object): Promise<TestConfig> {
    const testConfig = config as TestConfig;

    if (typeof testConfig.name !== "string" || testConfig.name.length === 0) {
      throw new Error("Name must be a non-empty string");
    }

    if (typeof testConfig.version !== "number" || testConfig.version < 1) {
      throw new Error("Version must be a number >= 1");
    }

    if (typeof testConfig.timeout !== "number" || testConfig.timeout < 1000) {
      throw new Error("Timeout must be a number >= 1000");
    }

    // Test data transformation
    return {
      ...testConfig,
      name: testConfig.name.trim(),
      timeout: Math.max(testConfig.timeout, 1000),
    };
  }
}

class MigratingConfigDefinition extends TestConfigDefinition {
  public migrationShouldFail = false;
  public migrationCallCount = 0;

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
    };
  }
}

describe("ConfigDefinition", () => {
  let testDir: string;
  let configDefinition: TestConfigDefinition;

  beforeEach(() => {
    testDir = join(tmpdir(), `config-def-test-${Date.now()}`);
    configDefinition = new TestConfigDefinition(testDir);
  });

  describe("Core Functionality", () => {
    test("abstract methods are implemented correctly", () => {
      expect(configDefinition.fileName()).toBe("test-config.json");
      expect(configDefinition.configPath()).toBe(
        join(testDir, "test-config.json")
      );
      expect(configDefinition.defaultConfig()).toEqual({
        name: "test",
        version: 1,
        enabled: false,
        timeout: 5000,
      });
    });

    test("default validation is passthrough", async () => {
      const config = { name: "test", version: 2, enabled: true, timeout: 3000 };
      const result = await configDefinition.validate(config);
      expect(result).toEqual(config);
    });
  });

  describe("Validation Behavior", () => {
    test("validation can transform and validate config", async () => {
      const validatingDefinition = new ValidatingConfigDefinition(testDir);
      const config = {
        name: "  test-name  ", // Should be trimmed
        version: 2,
        enabled: true,
        timeout: 1500,
      };

      const result = await validatingDefinition.validate(config);
      expect(result.name).toBe("test-name"); // Trimmed
      expect(result.timeout).toBe(1500);
    });

    test("validation errors are thrown for invalid configs", async () => {
      const validatingDefinition = new ValidatingConfigDefinition(testDir);
      const invalidConfig = {
        name: "",
        version: 0,
        enabled: false,
        timeout: 500,
      };

      await expect(
        validatingDefinition.validate(invalidConfig)
      ).rejects.toThrow();
    });
  });

  describe("Migration Behavior", () => {
    test("default migration throws not implemented error", async () => {
      await expect(configDefinition.migrateConfig()).rejects.toThrow(
        "Not implemented"
      );
    });

    test("custom migration works when implemented", async () => {
      const migratingDefinition = new MigratingConfigDefinition(testDir);
      const result = await migratingDefinition.migrateConfig();

      expect(result).toEqual({
        name: "migrated",
        version: 2,
        enabled: true,
        timeout: 3000,
      });
    });

    test("migration failures are propagated as errors", async () => {
      const migratingDefinition = new MigratingConfigDefinition(testDir);
      migratingDefinition.migrationShouldFail = true;

      await expect(migratingDefinition.migrateConfig()).rejects.toThrow(
        "Migration failed"
      );
    });
  });
});
