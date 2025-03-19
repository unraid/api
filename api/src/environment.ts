import { readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import type { PackageJson } from 'type-fest';

/**
 * Tries to get the package.json at the given location
 * @param location - The location of the package.json file, relative to the current file
 * @returns The package.json object or undefined if unable to read
 */
function getPackageJsonAt(location: string): PackageJson | undefined {
    try {
        const packageJsonUrl = import.meta.resolve(location);
        const packageJsonPath = fileURLToPath(packageJsonUrl);
        const packageJsonRaw = readFileSync(packageJsonPath, 'utf-8');
        return JSON.parse(packageJsonRaw) as PackageJson;
    } catch {
        return undefined;
    }
}

/**
 * Retrieves the Unraid API package.json
 * @returns The package.json object or undefined if unable to find
 */
export const getPackageJson = (): PackageJson | undefined => {
    return getPackageJsonAt('../package.json') || getPackageJsonAt('../../package.json');
};

const getPackageJsonVersion = () => {
    const packageJson = getPackageJson();
    if (!packageJson) {
        console.error('Could not find package.json in any of the expected locations');
        return undefined;
    }
    return packageJson.version;
};

export const API_VERSION =
    process.env.npm_package_version ?? getPackageJsonVersion() ?? new Error('API_VERSION not set');

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
export const DRY_RUN = process.env.DRY_RUN === 'true';
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
