/*!
 * Copyright 2019-2020 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

import { performance } from 'node:perf_hooks';
import { log } from '../../log';

const timers = new Map();

/**
 * Debug timer
 */
export const debugTimer = (timerName: string): void => {
	// Start new timer
	if (!timers.has(timerName)) {
		timers.set(timerName, performance.now());
		return;
	}

	const timeLengthInMs = performance.now() - timers.get(timerName);
	log.timer(`${timerName}: ${timeLengthInMs}`);

	// Remove existing timer
	timers.delete(timerName);
};
