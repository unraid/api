/*!
 * Copyright 2019-2021 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

import { readFileSync } from 'fs';

// Get uptime on boot and convert to date
const bootTimestamp = (new Date().getTime()) - parseFloat(readFileSync('/proc/uptime', 'utf-8').split(' ')[0]);

export default () => ({
	os: {
		// Timestamp of when the server booted
		bootTime: bootTimestamp,
		// Milliseconds since the server booted
		uptime: new Date().getTime() - bootTimestamp
	}
});
