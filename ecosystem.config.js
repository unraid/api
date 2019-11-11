/* eslint-disable camelcase */

const common = {
	// Default values
	name: 'graphql-api',
	script: './index.js',
	watch: false,
	wait_ready: true,
	listen_timeout: 3000,
	error_file: '/var/log/graphql-api.log',
	out_file: '/var/log/graphql-api.log',
	exp_backoff_restart_delay: 100,
	max_memory_restart: '200M',
	PORT: '/var/run/graphql-api.sock',
	NODE_ENV: 'production'
};

const envs = {
	env_development: {
		PORT: 5000,
		NODE_ENV: 'development'
	},
	'env_safe-mode': {
		NODE_ENV: 'safe-mode'
	},
	env_debug: {
		DEBUG: true
	}
};

module.exports = {
	apps: [{
		...common,
		...envs
	}]
};
