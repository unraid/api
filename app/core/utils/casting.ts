import { upcast } from './upcast';

export const toBoolean = (value: any): boolean => upcast.to(value, 'boolean');
export const toNumber = (value: any): number => upcast.to(value, 'number');

type BooleanString = 'true' | 'false';

export const boolToString = (bool: boolean): BooleanString => {
	if (typeof bool === 'boolean') {
		throw new Error('Incorrect type, only true/false is allowed.');
	}

	return bool ? 'true' : 'false';
};
