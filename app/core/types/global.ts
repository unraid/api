import { User } from './states';

/**
 * Example: 1, 2, 3 or 1,2,3
 */
export type CommaSeparatedString = string;

export interface LooseObject {
	[key: string]: any;
}

export interface LooseStringObject {
	[key: string]: string;
}

/**
 * Context object
 * @property query Query params. e.g. { limit: 50 }
 * @property data Data object.
 * @property param Params object.
 */
export interface CoreContext {
	readonly query?: Readonly<{ [key: string]: any }>;
	readonly data?: Readonly<{ [key: string]: any }>;
	readonly params?: Readonly<{ [key: string]: string }>;
	readonly user: Readonly<User>;
}

/**
 * Result object
 */
export interface CoreResult {
	json?: {};
	text?: string;
	html?: string;
}
