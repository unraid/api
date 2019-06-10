const path = require('path');
const am = require('am');
const camelcase = require('camelcase');
const Injector = require('bolus');

// Set the working directory to this one.
process.chdir(__dirname);

// Create an $injector.
const $injector = new Injector();

// Register the imported modules with default names.
$injector.registerImports([
    'net',
    'express',
    'apollo-server-express',
    'graphql',
    'deepmerge',
    'stoppable'
], module);

// Register modules that need require and not import
$injector.registerRequires([
    'graphql'
], module);

// Register the imported modules with custom names.
$injector.registerImports({
    get: 'lodash.get',
    graphqlDirective: 'graphql-directive',
    mergeGraphqlSchemas: 'merge-graphql-schemas',
    GraphQLJSON: 'graphql-type-json',
    GraphQLLong: 'graphql-type-long',
    GraphQLUUID: 'graphql-type-uuid'
}, module);

// Register all of the single js files as modules.
$injector.registerPath([
    '*.js',
], defaultName => camelcase(defaultName));

// Register graphql schema
$injector.registerPath([
    './graphql/schema/**/*.js',
], defaultName => camelcase(defaultName));

// Register core
$injector.registerPath(path.resolve(process.env.CORE_CWD || path.join(__dirname, '../node_modules/core')));

const main = async () => {
    const core = $injector.resolve('core');

    // Load core
    await core.load();

    // Must be loaded after core
    const log = $injector.resolve('log');
    const config = $injector.resolve('config');

    // Must be loaded after deps above and core
    const server = $injector.resolve('server');

    // Start the server.
    await server.start();

    log.info('Listening on port %s.', config.get('port'));

    process.on('SIGINT', () => {
        log.debug('SIGINT signal received.');
        server.stop();
    });
}

// Boot app
am(main, error => {
    try {
        const corePath = path.resolve(process.env.CORE_CWD || path.join(__dirname, '../node_modules/core'));
        const errorsRegistered = $injector.isRegistered('FileMissingError');
        const logRegistered = $injector.isRegistered('log');

        // Register errors if they're not already registered
        if (!errorsRegistered) {
            $injector.registerPath([
                corePath + '/errors/*.js'
            ], defaultName => camelcase(defaultName, { pascalCase: true }));
        }

        // Register log if it's not already registered
        if (!logRegistered) {
            $injector.registerPath([
                path.join(corePath, 'log.js')
            ]);
        }

        const log = $injector.resolve('log');
        const FileMissingError = $injector.resolve('FileMissingError');

        // Allow optional files to throw but keep the app running
        if (error instanceof FileMissingError) {
            log.warn(error.message);

            if (!error.filePath.includes('disk-load.ini')) {
                // Kill applicaiton
                process.exit(1);
            }
        } else {
            // Log last error
            log.error(error);

            // Kill applicaiton
            process.exit(1);
        }

    // We should only end here if errors or log have an issue loading
    } catch (error) {
        // Log last error
        console.error(error);

        // Kill applicaiton
        process.exit(1);
    }
});

// If repl exists we're in the repl so attach the injector for debugging
// We don't check for the NODE_ENV as we need this to debug all envs
if (global.repl) {
    global.$injector = $injector;
}
