/*!
 * Copyright 2019-2020 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

const _ = process.env;

/**
 * Proxy for process.env
 *
 * @note Add known environment variables here for better typing
 */
export const environmentVariables = {
	..._,
	NODE_ENV: _.NODE_ENV!,
	DEBUG: _.DEBUG === 'true',
	PORT: _.PORT!,
	NODE_API_PORT: _.NODE_API_PORT!,
	DRY_RUN: Boolean(_.DRY_RUN)
};
