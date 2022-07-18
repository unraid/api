import { User } from '@app/core/types/states';

/**
 * Example: 1, 2, 3 or 1,2,3
 */
export type CommaSeparatedString = string;

export type LooseObject = Record<string, any>;

export type LooseStringObject = Record<string, string>;

/**
 * Context object
 * @property query Query params. e.g. { limit: 50 }
 * @property data Data object.
 * @property param Params object.
 */
export interface CoreContext<Query = Record<string, unknown>, Data = Record<string, unknown>, Params = Record<string, unknown>> {
	readonly query?: Readonly<Query>;
	readonly data?: Readonly<Data>;
	readonly params?: Readonly<Params>;
	readonly user: Readonly<User>;
}

/**
 * Result object
 */
export interface CoreResult<JSON = unknown> {
	json?: JSON;
	text?: string;
	html?: string;
}
