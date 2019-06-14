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
        env_production: {
            PORT: '/var/run/graphql-api.sock',
            NODE_ENV: 'production'
        }
    }]
};
