/*!
 * Copyright 2019-2021 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

import { uptime } from 'os';

// Get uptime on boot and convert to date
const bootTimestamp = new Date(new Date().getTime() - (uptime() * 1000));

export default () => ({
	os: {
		// Timestamp of when the server booted
		uptime: bootTimestamp
	}
});
