/*!
 * Copyright 2019-2020 Lime Technology Inc.  All rights reserved.
 * Written by: Alexis Tyler
 */

import am from 'am';
import core from '@unraid/core';
import { server } from './server';

// Boot app
am(async () => {
	// Load core
	await core.core.load();

	// Load server
	await core.loadServer('graphql-api', server);
}, error => {
	// We should only end here if core has an issue loading

	// Log last error
	console.error(error);

	// Kill application
	// eslint-disable-next-line unicorn/no-process-exit
	process.exit(1);
});
