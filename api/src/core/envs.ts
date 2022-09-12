/*!
 * Copyright 2019-2022 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

const _ = process.env;

/**
 * Proxy for process.env
 *
 * @note Add known envs here for better typing
 */
export const envs = {
	..._,
	NODE_ENV: _.NODE_ENV!,
	DEBUG: _.DEBUG === 'true',
	PORT: _.PORT!,
	NODE_API_PORT: _.NODE_API_PORT!,
	DRY_RUN: Boolean(_.DRY_RUN),
};
