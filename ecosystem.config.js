/* eslint-disable camelcase */

module.exports = {
    apps: [
        {
            name: 'my_servers-client',
            script: './index.js',
            watch: false,
            wait_ready: true,
            listen_timeout: 3000,
            env: {
                PORT: 5000,
                NODE_ENV: 'development'
            },
            env_production: {
                PORT: '/var/run/my_servers-client.sock',
                NODE_ENV: 'production'
            }
        }
    ]
};