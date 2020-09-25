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
	release: require('../package.json').version,
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
}, async (error: NodeJS.ErrnoException) => {
	// Send error to server for debugging
	Sentry.captureException(error);

	// Stop server
	server.stop(async () => {
		/**
		 * Flush messages to server before stopping.
		 * 
		 * This may mean waiting up to 5s
		 * before the server actually stops.
		 */
		await Sentry.flush(5000);

		// Kill application
		// eslint-disable-next-line unicorn/no-process-exit
		process.exit(1);
	});
});
