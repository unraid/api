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
			NODE_ENV: 'safe-mode',
			node_args: ['--max_old_space_size=60', '--optimize_for_size', '--always_compact']
		},
		env_debug: {
			PORT: '/var/run/graphql-api.sock',
			NODE_ENV: 'production',
			node_args: ['--max_old_space_size=60', '--optimize_for_size', '--always_compact'],
			DEBUG: true
		},
		env_production: {
			PORT: '/var/run/graphql-api.sock',
			NODE_ENV: 'production',
			error_file: '/var/log/graphql-api/error.log',
			out_file: '/var/log/graphql-api/out.log',
			exp_backoff_restart_delay: 100,
			node_args: ['--max_old_space_size=60', '--optimize_for_size', '--always_compact']
		}
	}]
};
