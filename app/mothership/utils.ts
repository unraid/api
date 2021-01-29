import { readFileSync } from 'fs';

/**
 * Get a number between the lowest and highest value.
 * @param low Lowest value.
 * @param high Highest value.
 */
export const getNumberBetween = (low: number, high: number) => Math.floor((Math.random() * (high - low + 1)) + low);

/**
 * Create a jitter of +/- 20%.
 */
export const applyJitter = (value: number) => {
	const jitter = getNumberBetween(80, 120) / 100;
	return Math.floor(value * jitter);
};

export const backoff = (attempt: number, maxDelay: number, multiplier: number) => {
	const delay = applyJitter(((2.0 ** attempt) - 1.0) * 0.5);
	return Math.round(Math.min(delay * multiplier, maxDelay));
};

export const readFileIfExists = (filePath: string) => {
	try {
		return readFileSync(filePath);
	} catch {}

	return Buffer.from('');
};
