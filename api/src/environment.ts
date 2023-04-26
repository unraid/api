export const API_VERSION = process.env.VERSION ?? 'THIS_WILL_BE_REPLACED_WHEN_BUILT';
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