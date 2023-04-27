declare module '*.json';

export type RecursivePartial<T> = {
	[P in keyof T]?: RecursivePartial<T[P]>;
};

export type RecursiveNullable<T> = {
	[P in keyof T]: RecursiveNullable<T[P]> | null;
};
