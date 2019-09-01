/*
 * Copyright 2019 Lime Technology Inc.  All rights reserved.
 * Written by: Alexis Tyler
 */

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
    'http',
    'apollo-server-express',
    'apollo-server',
    'deepmerge',
    'express',
    'graphql-subscriptions',
    'graphql-tools',
    'graphql',
    'set-interval-async/dynamic',
    'stoppable'
]);

// Register modules that need require and not import
$injector.registerRequires([
    'graphql'
]);

// Register the imported modules with custom names.
$injector.registerImports({
    dee: '@gridplus/docker-events',
    get: 'lodash.get',
    gql: 'graphql-tag',
    graphqlDirective: 'graphql-directive',
    GraphQLJSON: 'graphql-type-json',
    GraphQLLong: 'graphql-type-long',
    GraphQLUUID: 'graphql-type-uuid',
    mergeGraphqlSchemas: 'merge-graphql-schemas'
});

$injector.registerValue('setIntervalAsync', $injector.resolve('set-interval-async/dynamic').setIntervalAsync);

// Register all of the single js files as modules.
$injector.registerPath([
    '*.js',
    'graphql/*.js'
], defaultName => camelcase(defaultName));

// Register graphql schema
$injector.registerPath([
    './graphql/schema/**/*.js',
], defaultName => camelcase(defaultName));

// Register core
$injector.registerPath(path.resolve(process.env.PATHS_CORE || path.join(__dirname, '../node_modules/@unraid/core')));

// Boot app
am(async () => {
    const core = $injector.resolve('core');

    // Load core
    await core.load().catch(coreError => {
        try {
            // Handler non fatal errors
            $injector.resolve('globalErrorHandler')(coreError);
        } catch (error) {
            throw coreError;
        }
    });

    // Load server
    await core.loadServer('graphql-api');
}, error => {
    // We should only end here if core has an issue loading

    // Log last error
    console.error(error);

    // Kill applicaiton
    process.exit(1);
});