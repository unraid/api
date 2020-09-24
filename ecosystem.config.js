/* eslint-disable camelcase */
const path = require('path');

const common = {
	name: 'graphql-api',
	script: path.resolve(__dirname, './dist/index.js'),
	watch: false,
	wait_ready: true,
	listen_timeout: 3000,
	exp_backoff_restart_delay: 100,
	max_memory_restart: '200M',
	PROCESS_TITLE: 'graphql-api'
};

const envs = {
	env_development: {
		PORT: 5000,
		NODE_ENV: 'development',
		NCHAN: 'disable',
		PATHS_STATES: path.resolve(__dirname, './dev/states'),
		PATHS_DYNAMIX_DATA: '/tmp/dynamix/',
		PATHS_DYNAMIX_CONFIG: path.resolve(__dirname, './dev/dynamix.cfg')
	},
	'env_safe-mode': {
		NODE_ENV: 'safe-mode'
	},
	env_debug: {
		DEBUG: true
	},
	env_production: {
		NODE_ENV: 'production',
		PORT: '/var/run/graphql-api.sock'
	}
};

module.exports = {
	apps: [{
		...common,
		...envs
	}]
};
