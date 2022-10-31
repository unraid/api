declare module '*.json';

export type RecursivePartial<T> = {
	[P in keyof T]?: RecursivePartial<T[P]>;
};