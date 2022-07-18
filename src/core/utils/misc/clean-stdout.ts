/*!
 * Copyright 2019-2022 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

interface Options {
	/** Standard output from execa. */
	stdout: string;
}

/**
 * Execa helper to trim stdout.
 */
export const cleanStdout = (options: Options) => options.stdout.trim();
