/*!
 * Copyright 2019-2020 Lime Technology Inc.  All rights reserved.
 * Written by: Alexis Tyler
 */

import os from 'os';
import am from 'am';
import * as Sentry from '@sentry/node';
import { core, loadServer } from '@unraid/core';
import { server } from './server';

// Send errors to server if enabled
Sentry.init({
	dsn: process.env.SENTRY_DSN,
	tracesSampleRate: 1.0,
	release: require('../package.json').short(),
	environment: process.env.NODE_ENV,
	serverName: os.hostname(),
	enabled: Boolean(process.env.SENTRY_DSN)
});

// Boot app
am(async () => {
	// Load core
	await core.load();

	// Load server
	await loadServer('graphql-api', server);
}, (error: NodeJS.ErrnoException) => {
	// We should only end here if core has an issue loading

	// Send last exception to Sentry
	Sentry.captureException(error);

	// Log last error
	console.error(error.message);

	// Kill application
	// eslint-disable-next-line unicorn/no-process-exit
	process.exit(1);
});
