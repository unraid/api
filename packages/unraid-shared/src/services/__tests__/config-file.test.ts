import { expect, test, describe, beforeEach, afterEach } from "vitest";
import { Subject } from "rxjs";
import { readFile, writeFile, mkdir, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { ConfigFilePersister } from "../config-file.js";

/**
 * TEST SCOPE: ConfigFilePersister NestJS Integration
 *
 * BEHAVIORS TESTED:
 * • NestJS lifecycle integration (OnModuleInit, OnModuleDestroy)
 * • Reactive config change subscription with 25ms buffering
 * • ConfigService integration for path resolution and config storage
 * • Automatic config loading with migration priority over defaults
 * • Config change detection and selective persistence (matching configKey only)
 * • Graceful error handling for all failure scenarios
 * • Flash drive optimization through change detection
 * • Standalone file access via getFileHandler() delegation
 * • Proper cleanup of subscriptions and final state persistence
 *
 * INTEGRATION SCENARIOS:
 * ✓ Module initialization with existing/missing/invalid config files
 * ✓ Reactive config change processing with proper filtering
 * ✓ Module destruction with subscription cleanup and final persistence
 * ✓ Error resilience (file system errors, validation failures, service errors)
 * ✓ Migration vs defaults priority during initialization
 * ✓ Full application lifecycle from startup to shutdown
 *
 * COVERAGE FOCUS:
 * • NestJS framework integration correctness
 * • Reactive configuration management
 * • Production-like error scenarios
 * • Memory leak prevention (subscription management)
 * • Data persistence guarantees during shutdown
 *
 * NOT TESTED (covered in other files):
 * • Low-level file operations (ConfigFileHandler)
 * • Abstract class behavior (ConfigDefinition)
 */

interface TestConfig {
  name: string;
  version: number;
  enabled: boolean;
  settings: {
    timeout: number;
    retries: number;
  };
}

class TestConfigFilePersister extends ConfigFilePersister<TestConfig> {
  constructor(configService: any) {
    super(configService);
  }

  fileName(): string {
    return "test-config.json";
  }

  configKey(): string {
    return "testConfig";
  }

  defaultConfig(): TestConfig {
    return {
      name: "test",
      version: 1,
      enabled: false,
      settings: {
        timeout: 5000,
        retries: 3,
      },
    };
  }

  async validate(config: object): Promise<TestConfig> {
    const testConfig = config as TestConfig;
    if (testConfig.version < 1) {
      throw new Error("Invalid version: must be >= 1");
    }
    if (testConfig.settings.timeout < 1000) {
      throw new Error("Invalid timeout: must be >= 1000");
    }
    return testConfig;
  }

  async migrateConfig(): Promise<TestConfig> {
    return {
      name: "migrated",
      version: 2,
      enabled: true,
      settings: {
        timeout: 3000,
        retries: 5,
      },
    };
  }
}

describe("ConfigFilePersister Integration Tests", () => {
  let configService: any;
  let persister: TestConfigFilePersister;
  let testDir: string;
  let configPath: string;
  let changesSubject: Subject<any>;
  let configStore: Record<string, any>;

  beforeEach(async () => {
    // Setup test directory
    testDir = join(tmpdir(), `config-test-${Date.now()}`);
    await mkdir(testDir, { recursive: true });
    configPath = join(testDir, "test-config.json");

    // Setup config store
    configStore = {};

    // Setup rxjs subject for config changes
    changesSubject = new Subject();

    // Mock ConfigService
    configService = {
      get: (key: string) => configStore[key],
      set: (key: string, value: any) => {
        configStore[key] = value;
      },
      getOrThrow: (key: string) => {
        if (key === "PATHS_CONFIG_MODULES") return testDir;
        throw new Error(`Config key ${key} not found`);
      },
      changes$: changesSubject.asObservable(),
    };

    persister = new TestConfigFilePersister(configService);
  });

  afterEach(async () => {
    // Proper cleanup
    changesSubject.complete();
    await persister.onModuleDestroy?.();
    await rm(testDir, { recursive: true, force: true });
  });

  test("configPath returns correct path", () => {
    expect(persister.configPath()).toBe(configPath);
  });

  test("loads existing config from file", async () => {
    const existingConfig = {
      name: "existing",
      version: 2,
      enabled: true,
      settings: {
        timeout: 3000,
        retries: 5,
      },
    };
    await writeFile(configPath, JSON.stringify(existingConfig, null, 2));

    await persister.onModuleInit();

    // Should load existing config
    expect(configStore.testConfig).toEqual(existingConfig);
  });

  test("handles invalid config by attempting migration", async () => {
    const invalidConfig = {
      name: "invalid",
      version: 0, // Invalid version
      enabled: true,
      settings: {
        timeout: 500, // Invalid timeout
        retries: 5,
      },
    };
    await writeFile(configPath, JSON.stringify(invalidConfig, null, 2));

    await persister.onModuleInit();

    // Should call migrate and set migrated config
    expect(configStore.testConfig).toEqual({
      name: "migrated",
      version: 2,
      enabled: true,
      settings: {
        timeout: 3000,
        retries: 5,
      },
    });
  });

  test("persists config to file", async () => {
    const config = {
      name: "persist-test",
      version: 2,
      enabled: true,
      settings: {
        timeout: 4000,
        retries: 4,
      },
    };

    const result = await persister.persist(config);

    expect(result).toBe(true);
    const fileContent = await readFile(configPath, "utf8");
    const parsedConfig = JSON.parse(fileContent);
    expect(parsedConfig).toEqual(config);
  });

  test("skips persistence when config is unchanged", async () => {
    const config = {
      name: "unchanged",
      version: 1,
      enabled: false,
      settings: {
        timeout: 5000,
        retries: 3,
      },
    };

    // Write initial config
    await writeFile(configPath, JSON.stringify(config, null, 2));

    const result = await persister.persist(config);

    expect(result).toBe(false);
  });

  test("loads and validates config from file", async () => {
    const config = {
      name: "file-test",
      version: 3,
      enabled: true,
      settings: {
        timeout: 2000,
        retries: 1,
      },
    };
    await writeFile(configPath, JSON.stringify(config));

    const result = await persister.getFileHandler().readConfigFile();

    expect(result).toEqual(config);
  });

  test("throws error when file doesn't exist", async () => {
    await expect(persister.getFileHandler().readConfigFile()).rejects.toThrow(
      "Config file does not exist"
    );
  });

  test("throws error when file contains invalid JSON", async () => {
    await writeFile(configPath, "{ invalid json");

    await expect(persister.getFileHandler().readConfigFile()).rejects.toThrow();
  });

  test("throws error when config is invalid", async () => {
    const invalidConfig = {
      name: "invalid",
      version: -1,
      enabled: true,
      settings: {
        timeout: 100,
        retries: 1,
      },
    };
    await writeFile(configPath, JSON.stringify(invalidConfig));

    await expect(persister.getFileHandler().readConfigFile()).rejects.toThrow(
      "Invalid version"
    );
  });

  test("base class migration throws not implemented error", async () => {
    const basePersister = new (class extends ConfigFilePersister<TestConfig> {
      fileName() {
        return "base-test.json";
      }
      configKey() {
        return "baseTest";
      }
      defaultConfig() {
        return persister.defaultConfig();
      }
    })(configService);

    await expect(basePersister.migrateConfig()).rejects.toThrow(
      "Not implemented"
    );
  });

  test("unsubscribes from config changes and persists final state", async () => {
    await persister.onModuleInit();

    // Setup final config state
    configStore["testConfig"] = {
      name: "final",
      version: 4,
      enabled: false,
      settings: {
        timeout: 1000,
        retries: 10,
      },
    };

    await persister.onModuleDestroy();

    // Should persist final state
    const fileContent = await readFile(configPath, "utf8");
    const parsedConfig = JSON.parse(fileContent);
    expect(parsedConfig.name).toBe("final");
  });

  test("handles destroy when not initialized", async () => {
    // Should not throw error
    await expect(persister.onModuleDestroy()).resolves.toBeUndefined();
  });

  test("config change subscription is properly set up", async () => {
    // Pre-create config file to avoid migration
    const initialConfig = persister.defaultConfig();
    await writeFile(configPath, JSON.stringify(initialConfig, null, 2));

    await persister.onModuleInit();

    // Verify that the config observer is active by checking internal state
    // This tests that the subscription was created without relying on timing
    expect((persister as any).configObserver).toBeDefined();
    expect((persister as any).configObserver.closed).toBe(false);

    // Test that non-matching changes are ignored (synchronous test)
    configStore["testConfig"] = persister.defaultConfig();
    const initialFileContent = await readFile(configPath, "utf8");

    // Emit a non-matching config change
    changesSubject.next({ path: "otherConfig.setting" });

    // Wait briefly to ensure no processing occurs
    await new Promise((resolve) => setTimeout(resolve, 30));

    // File should remain unchanged
    const afterFileContent = await readFile(configPath, "utf8");
    expect(afterFileContent).toBe(initialFileContent);
  });

  test("ignores non-matching config changes", async () => {
    // Pre-create config file
    const initialConfig = persister.defaultConfig();
    await writeFile(configPath, JSON.stringify(initialConfig, null, 2));

    await persister.onModuleInit();

    // Set initial config and write to file
    configStore["testConfig"] = persister.defaultConfig();

    // Get initial modification time
    const stats1 = await import("fs/promises").then((fs) =>
      fs.stat(configPath)
    );

    // Wait a bit to ensure timestamp difference
    await new Promise((resolve) => setTimeout(resolve, 10));

    // Emit change for different config key
    changesSubject.next({ path: "otherConfig.setting" });

    // Wait for buffer time
    await new Promise((resolve) => setTimeout(resolve, 50));

    // File should remain unchanged (same modification time)
    const stats2 = await import("fs/promises").then((fs) =>
      fs.stat(configPath)
    );
    expect(stats2.mtime).toEqual(stats1.mtime);
  });

  test("handles config service errors gracefully", async () => {
    // Mock config service to throw error on get
    const errorConfigService = {
      ...configService,
      get: () => {
        throw new Error("Config service error");
      },
    };

    const errorPersister = new TestConfigFilePersister(errorConfigService);

    // Should still initialize (migration will be called due to no file)
    await errorPersister.onModuleInit();

    // Should have migrated config since get failed
    const expectedMigrated = await errorPersister.migrateConfig();
    expect(configStore.testConfig).toEqual(expectedMigrated);
  });

  test("handles persistence errors gracefully", async () => {
    await persister.onModuleInit();

    // Create a persister that points to invalid directory
    const invalidPersister = new TestConfigFilePersister({
      ...configService,
      getOrThrow: (key: string) => {
        if (key === "PATHS_CONFIG_MODULES")
          return "/invalid/path/that/does/not/exist";
        throw new Error(`Config key ${key} not found`);
      },
    });

    const config = { ...persister.defaultConfig(), name: "error-test" };

    // Should not throw despite write error
    const result = await invalidPersister.persist(config);
    expect(result).toBe(false);
  });

  test("migration priority over defaults when file doesn't exist", async () => {
    // No file exists, should trigger migration path
    await persister.onModuleInit();

    // ConfigFilePersister prioritizes migration over defaults when file doesn't exist
    expect(configStore.testConfig).toEqual({
      name: "migrated",
      version: 2,
      enabled: true,
      settings: {
        timeout: 3000,
        retries: 5,
      },
    });

    // Should persist migrated config to file
    const fileContent = await readFile(configPath, "utf8");
    const parsedConfig = JSON.parse(fileContent);
    expect(parsedConfig).toEqual({
      name: "migrated",
      version: 2,
      enabled: true,
      settings: {
        timeout: 3000,
        retries: 5,
      },
    });
  });

  test("full lifecycle integration", async () => {
    // Initialize - will use migration since no file exists
    await persister.onModuleInit();

    // Verify initial state (migrated, not defaults)
    expect(configStore.testConfig).toEqual({
      name: "migrated",
      version: 2,
      enabled: true,
      settings: {
        timeout: 3000,
        retries: 5,
      },
    });

    // Simulate config change
    configStore["testConfig"] = {
      name: "lifecycle-test",
      version: 5,
      enabled: true,
      settings: {
        timeout: 1500,
        retries: 7,
      },
    };

    // Trigger change notification
    changesSubject.next({ path: "testConfig.enabled" });

    // Wait for persistence
    await new Promise((resolve) => setTimeout(resolve, 50));

    // Cleanup
    await persister.onModuleDestroy();

    // Verify final persisted state
    const fileContent = await readFile(configPath, "utf8");
    const parsedConfig = JSON.parse(fileContent);
    expect(parsedConfig).toEqual({
      name: "lifecycle-test",
      version: 5,
      enabled: true,
      settings: {
        timeout: 1500,
        retries: 7,
      },
    });
  });
});
