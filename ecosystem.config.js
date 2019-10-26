/* eslint-disable camelcase */

module.exports = {
	apps: [{
		name: 'graphql-api',
		script: './index.js',
		watch: false,
		wait_ready: true,
		listen_timeout: 3000,
		env: {
			PORT: 5000,
			NODE_ENV: 'development'
		},
		'env_safe-mode': {
			PORT: '/var/run/graphql-api.sock',
			NODE_ENV: 'safe-mode'
		},
		env_debug: {
			PORT: '/var/run/graphql-api.sock',
			NODE_ENV: 'production',
			DEBUG: true
		},
		env_production: {
			PORT: '/var/run/graphql-api.sock',
			NODE_ENV: 'production',
			error_file: '/var/log/graphql-api/error.log',
			out_file: '/var/log/graphql-api/out.log',
			exp_backoff_restart_delay: 100,
			max_memory_restart: '300M'
		}
	}]
};
