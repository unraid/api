import { User } from './states';

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
export interface CoreContext {
	readonly query?: Readonly<Record<string, any>>;
	readonly data?: Readonly<Record<string, any>>;
	readonly params?: Readonly<Record<string, string>>;
	readonly user: Readonly<User>;
}

/**
 * Result object
 */
export interface CoreResult {
	json?: unknown;
	text?: string;
	html?: string;
}
