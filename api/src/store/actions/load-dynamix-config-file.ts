import { createTtlMemoizedLoader } from '@unraid/shared';

import type { RecursivePartial } from '@app/types/index.js';
import { type DynamixConfig } from '@app/core/types/ini.js';
import { fileExistsSync } from '@app/core/utils/files/file-exists.js';
import { parseConfig } from '@app/core/utils/misc/parse-config.js';

/**
 * Loads a configuration file from disk, parses it to a RecursivePartial of the provided type, and returns it.
 *
 * If the file is inaccessible, an empty object is returned instead.
 *
 * @param path The path to the configuration file on disk.
 * @returns A parsed RecursivePartial of the provided type.
 */
function loadConfigFileSync<ConfigType>(path: string): RecursivePartial<ConfigType> {
    return fileExistsSync(path)
        ? parseConfig<RecursivePartial<ConfigType>>({
              filePath: path,
              type: 'ini',
          })
        : {};
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === 'object' && value !== null && !Array.isArray(value);

const deepMergeConfig = (
    base: RecursivePartial<DynamixConfig>,
    override: RecursivePartial<DynamixConfig>
): RecursivePartial<DynamixConfig> => {
    const output: Record<string, unknown> = { ...(base as Record<string, unknown>) };

    Object.entries(override as Record<string, unknown>).forEach(([key, value]) => {
        const existingValue = output[key];
        if (isRecord(existingValue) && isRecord(value)) {
            output[key] = deepMergeConfig(
                existingValue as RecursivePartial<DynamixConfig>,
                value as RecursivePartial<DynamixConfig>
            );
            return;
        }
        output[key] = value;
    });

    return output as RecursivePartial<DynamixConfig>;
};

type ConfigPaths = readonly (string | undefined | null)[];
const CACHE_WINDOW_MS = 250;

const memoizedConfigLoader = createTtlMemoizedLoader<
    RecursivePartial<DynamixConfig>,
    ConfigPaths,
    string
>({
    ttlMs: CACHE_WINDOW_MS,
    getCacheKey: (configPaths: ConfigPaths): string => JSON.stringify(configPaths),
    load: (configPaths: ConfigPaths) => {
        const validPaths = configPaths.filter((path): path is string => Boolean(path));
        if (validPaths.length === 0) {
            return {};
        }
        const configFiles = validPaths.map((path) => loadConfigFileSync<DynamixConfig>(path));
        return configFiles.reduce<RecursivePartial<DynamixConfig>>(
            (accumulator, configFile) => deepMergeConfig(accumulator, configFile),
            {}
        );
    },
});

/**
 * Loads dynamix config from disk with TTL caching.
 *
 * @param configPaths - Array of config file paths to load and merge
 * @returns Merged config object from all valid paths
 */
export const loadDynamixConfigFromDiskSync = (
    configPaths: readonly (string | undefined | null)[]
): RecursivePartial<DynamixConfig> => {
    return memoizedConfigLoader.get(configPaths);
};
