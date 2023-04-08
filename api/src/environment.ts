import { config } from "@app/core/config";

export const API_VERSION = process.env.VERSION ?? 'THIS_WILL_BE_REPLACED_WHEN_BUILT';
export const NODE_ENV = process.env.NODE_ENV as 'development' | 'test' | 'staging' | 'production';
export const environment = {
	IS_MAIN_PROCESS: false,
};
export const CHOKIDAR_USEPOLLING = process.env.CHOKIDAR_USEPOLLING === 'true';
export const IS_DOCKER = process.env.IS_DOCKER === 'true';
export const GRAPHQL_INTROSPECTION = Boolean(process.env.INTROSPECTION ?? config.debug ?? process.env.ENVIRONMENT !== 'production');