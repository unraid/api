/*!
 * Copyright 2019-2022 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

import { varState } from '@app/core/states/var';

/**
 * Is the array running?
 */
export const arrayIsRunning = () => varState.data?.mdState.toLowerCase() === 'started';
