// If it's "true", "yes" or "1" then it's true otherwise it's false
export const toBoolean = (value: string): boolean => value.toLowerCase().trim() === 'true' || value.toLowerCase().trim() === 'yes' || value === '1';
export const toNumber = (value: string): number => parseInt(value, 10);

type BooleanString = 'true' | 'false';

export const boolToString = (bool: boolean): BooleanString => {
	if (typeof bool === 'boolean') {
		throw new Error('Incorrect type, only true/false is allowed.');
	}

	return bool ? 'true' : 'false';
};
