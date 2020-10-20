/* eslint-disable camelcase */
const path = require('path');

const SENTRY_DSN = 'https://335a7a44d1a048648a585fc4fa053d65@o427961.ingest.sentry.io/5439629';

const staging = {
	MOTHERSHIP_RELAY_WS_LINK: 'wss://staging.mothership.unraid.net/relay',
	MOTHERSHIP_GRAPHQL_LINK: 'https://staging.mothership.unraid.net/graphql',
	SENTRY_DSN,
	ENVIRONMENT: 'staging'
};

const production = {
	NODE_ENV: 'production',
	ENVIRONMENT: 'production',
	PORT: '/var/run/unraid-api.sock',
	out_file: '/dev/null',
  	error_file: '/dev/null'
};

const envs = {
	env_development: {
		PORT: 5000,
		NODE_ENV: 'development',
		NCHAN: 'disable',
		PATHS_STATES: path.resolve(__dirname, './dev/states'),
		PATHS_DYNAMIX_DATA: '/tmp/dynamix/',
		PATHS_DYNAMIX_CONFIG: path.resolve(__dirname, './dev/dynamix.cfg'),
		DEBUG: true,
		SENTRY_DSN
	},
	'env_safe-mode': {
		NODE_ENV: 'production',
		ENVIRONMENT: 'safe-mode'
	},
	env_staging: staging,
	'env_staging-debug': {
		...staging,
		DEBUG: true,
		ENVIRONMENT: 'staging-debug'
	},
	env_production: production,
	'env_production-debug': {
		...production,
		DEBUG: true,
		ENVIRONMENT: 'production-debug'
	}
};

module.exports = {
	apps: [{
		name: 'node-api',
		script: path.resolve(__dirname, './index.js'),
		watch: false,
		wait_ready: true,
		listen_timeout: 3000,
		exp_backoff_restart_delay: 100,
		max_memory_restart: '150M',
		env: {
			PROCESS_TITLE: 'node-api'
		},
		...envs
	}]
};
