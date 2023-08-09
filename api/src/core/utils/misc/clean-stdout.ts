interface Options {
	/** Standard output from execa. */
	stdout: string;
}

/**
 * Execa helper to trim stdout.
 */
export const cleanStdout = (options: Options) => options.stdout.trim();
