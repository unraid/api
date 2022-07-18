/* eslint-disable new-cap */
import { String, Record, Static } from 'runtypes';

export const Display = Record({
	case: Record({
		url: String,
		icon: String,
		error: String,
	}),
});

// eslint-disable-next-line @typescript-eslint/no-redeclare -- intentionally naming the variable the same as the type
export type Display = Static<typeof Display>;
