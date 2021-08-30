const path = require('path');

const config = {
    environmentVariables: {
        DEBUG: 'true',
        NCHAN: 'disable',
        PATHS_UNRAID_DATA: path.resolve(__dirname, './dev/data'),
        PATHS_STATES: path.resolve(__dirname, './dev/states'),
        PATHS_DYNAMIX_BASE: path.resolve(__dirname, './dev/dynamix'),
        PATHS_DYNAMIX_CONFIG: path.resolve(__dirname, './dev/dynamix/dynamix.cfg'),
        PATHS_MY_SERVERS_CONFIG: path.resolve(__dirname, './dev/Unraid.net/myservers.cfg'),
        API_KEY: 'TEST_TEST_TEST_TEST_TEST_TEST_TEST_TEST_TEST_TEST_TEST_TEST_TEST'
    },
    files: [
        './test/**/*'
    ],
    "extensions": {
        "ts": "module"
    },
    "nonSemVerExperiments": {
        "configurableModuleFormat": true
    },
    "nodeArguments": [
        "--loader=ts-node/esm"
    ]
};

module.exports = config;