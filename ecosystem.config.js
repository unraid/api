/* eslint-disable camelcase */
const path = require('path');

const staging = {
	MOTHERSHIP_RELAY_WS_LINK: 'wss://staging.mothership.unraid.net/relay',
	SENTRY_DSN: 'https://335a7a44d1a048648a585fc4fa053d65@o427961.ingest.sentry.io/5439629'
};
const production = {
	NODE_ENV: 'production',
	PORT: '/var/run/graphql-api.sock'
}

const envs = {
	env_development: {
		PORT: 5000,
		NODE_ENV: 'development',
		NCHAN: 'disable',
		PATHS_STATES: path.resolve(__dirname, './dev/states'),
		PATHS_DYNAMIX_DATA: '/tmp/dynamix/',
		PATHS_DYNAMIX_CONFIG: path.resolve(__dirname, './dev/dynamix.cfg'),
		DEBUG: true
	},
	'env_safe-mode': {
		NODE_ENV: 'safe-mode'
	},
	env_staging: staging,
	'env_staging-debug': {
		...staging,
		DEBUG: true,
	},
	env_production: production,
	'env_production-debug': {
		...production,
		DEBUG: true
	}
};

module.exports = {
	apps: [{
		name: 'graphql-api',
		script: path.resolve(__dirname, './index.js'),
		watch: false,
		wait_ready: true,
		listen_timeout: 3000,
		exp_backoff_restart_delay: 100,
		max_memory_restart: '200M',
		env: {
			PROCESS_TITLE: 'graphql-api'
		},
		...envs
	}]
};
