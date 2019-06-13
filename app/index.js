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
$injector.registerPath(path.resolve(process.env.CORE_CWD || path.join(__dirname, '../node_modules/@unraid/core')));

// Boot app
am(async () => {
    const core = $injector.resolve('core');

    // Load core
    await core.load();

    // Load server
    await core.loadServer('graphql-api');
}, error => {
    try {
        // Run global error handler
        $injector.resolve('globalErrorHandler')(error);
    } catch (error) {
        // We should only end here if core has an issue loading

        // Log last error
        console.error(error);

        // Kill applicaiton
        process.exit(1);
    }
});