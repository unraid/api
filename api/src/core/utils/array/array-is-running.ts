/*!
 * Copyright 2019-2022 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

import { getters } from '@app/store';

/**
 * Is the array running?
 */
export const arrayIsRunning = () => {
	const emhttp = getters.emhttp();
	return emhttp.var.mdState.toLowerCase() === 'started';
};
