/* eslint-disable new-cap */
import { String, Record, Static } from 'runtypes';

export const Display = Record({
	case: Record({
		url: String,
		icon: String,
		error: String
	})
});

export type Display = Static<typeof Display>;
