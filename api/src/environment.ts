export const API_VERSION = process.env.npm_package_version ?? 'PLEASE_RUN_PACKAGE_AS_NPM_SCRIPT';

export const NODE_ENV = process.env.NODE_ENV as 'development' | 'test' | 'staging' | 'production';
export const environment = {
	IS_MAIN_PROCESS: false,
};
export const CHOKIDAR_USEPOLLING = process.env.CHOKIDAR_USEPOLLING === 'true';
export const IS_DOCKER = process.env.IS_DOCKER === 'true';
export const DEBUG = process.env.DEBUG === 'true';
export const INTROSPECTION = process.env.INTROSPECTION === 'true';
export const ENVIRONMENT = process.env.ENVIRONMENT as 'production' | 'staging' | 'development'
export const GRAPHQL_INTROSPECTION = Boolean(
    INTROSPECTION ?? DEBUG ?? ENVIRONMENT !== 'production'
);
export const PORT = process.env.PORT ?? '/var/run/unraid-api.sock';
export const DRY_RUN = process.env.DRY_RUN === 'true';
export const BYPASS_PERMISSION_CHECKS = process.env.BYPASS_PERMISSION_CHECKS === 'true';
export const BYPASS_CORS_CHECKS = process.env.BYPASS_CORS_CHECKS === 'true';
export const LOG_CORS = process.env.LOG_CORS === 'true';
export const LOG_TYPE = process.env.LOG_TYPE as 'pretty' | 'raw'  ?? 'pretty';
export const LOG_LEVEL = process.env.LOG_LEVEL as 'TRACE' | 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'FATAL';
export const LOG_TRANSPORT = process.env.LOG_TRANSPORT as 'file' | 'stdout';