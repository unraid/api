import { readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import type { PackageJson, SetRequired } from 'type-fest';

import { fileExistsSync } from '@app/core/utils/files/file-exists.js';

/**
 * Returns the absolute path to the given file.
 * @param location - The location of the file, relative to the current file
 * @returns The absolute path to the file
 */
function getAbsolutePath(location: string): string {
    try {
        const fileUrl = import.meta.resolve(location);
        return fileURLToPath(fileUrl);
    } catch {
        return fileURLToPath(new URL(location, import.meta.url));
    }
}
/**
 * Returns the path to the api's package.json file. Throws if unable to find.
 * @param possiblePaths - The possible locations of the package.json file, relative to the current file
 * @returns The absolute path to the package.json file
 */
export function getPackageJsonPath(possiblePaths = ['../package.json', '../../package.json']): string {
    for (const location of possiblePaths) {
        const packageJsonPath = getAbsolutePath(location);
        if (fileExistsSync(packageJsonPath)) {
            return packageJsonPath;
        }
    }
    throw new Error(
        `Could not find package.json in any of the expected locations: ${possiblePaths.join(', ')}`
    );
}

/**
 * Retrieves the Unraid API package.json. Throws if unable to find or parse.
 * This should be considered a fatal error.
 *
 * @param pathOverride - The path to the package.json file. If not provided, the default path will be found & used.
 * @returns The package.json object
 */
export const getPackageJson = (pathOverride?: string) => {
    const packageJsonPath = pathOverride ?? getPackageJsonPath();
    const packageJsonRaw = readFileSync(packageJsonPath, 'utf-8');
    return JSON.parse(packageJsonRaw) as SetRequired<PackageJson, 'version' | 'dependencies'>;
};

/**
 * Returns list of runtime dependencies from the Unraid-API package.json. Returns undefined if
 * the package.json or its dependency object cannot be found or read.
 *
 * Does not log or produce side effects.
 * @returns The names of all runtime dependencies. Undefined if failed.
 */
export const getPackageJsonDependencies = (): string[] | undefined => {
    const { dependencies } = getPackageJson();
    return Object.keys(dependencies);
};

export const API_VERSION = process.env.npm_package_version ?? getPackageJson().version;

export const NODE_ENV =
    (process.env.NODE_ENV as 'development' | 'test' | 'staging' | 'production') ?? 'production';
export const environment = {
    IS_MAIN_PROCESS: false,
};
export const CHOKIDAR_USEPOLLING = process.env.CHOKIDAR_USEPOLLING === 'true';
export const IS_DOCKER = process.env.IS_DOCKER === 'true';
export const DEBUG = process.env.DEBUG === 'true';
export const INTROSPECTION = process.env.INTROSPECTION === 'true';
export const ENVIRONMENT = process.env.ENVIRONMENT
    ? (process.env.ENVIRONMENT as 'production' | 'staging' | 'development')
    : 'production';
export const GRAPHQL_INTROSPECTION = Boolean(INTROSPECTION ?? DEBUG ?? ENVIRONMENT !== 'production');
export const PORT = process.env.PORT ?? '/var/run/unraid-api.sock';
export const BYPASS_PERMISSION_CHECKS = process.env.BYPASS_PERMISSION_CHECKS === 'true';
export const BYPASS_CORS_CHECKS = process.env.BYPASS_CORS_CHECKS === 'true';
export const LOG_CORS = process.env.LOG_CORS === 'true';
export const LOG_TYPE = (process.env.LOG_TYPE as 'pretty' | 'raw') ?? 'pretty';
export const LOG_LEVEL = process.env.LOG_LEVEL
    ? (process.env.LOG_LEVEL.toUpperCase() as 'TRACE' | 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'FATAL')
    : process.env.ENVIRONMENT === 'production'
      ? 'INFO'
      : 'DEBUG';
export const MOTHERSHIP_GRAPHQL_LINK = process.env.MOTHERSHIP_GRAPHQL_LINK
    ? process.env.MOTHERSHIP_GRAPHQL_LINK
    : ENVIRONMENT === 'staging'
      ? 'https://staging.mothership.unraid.net/ws'
      : 'https://mothership.unraid.net/ws';

export const PM2_HOME = process.env.PM2_HOME ?? join(homedir(), '.pm2');
export const PATHS_CONFIG_MODULES =
    process.env.PATHS_CONFIG_MODULES ?? '/usr/local/unraid-api/config/modules';
