/* eslint-disable new-cap */
import { String, Record, Union, type Static, Literal } from 'runtypes';

const ValidConfig = Record({
	valid: Literal(true),
});

const InvalidConfig = Record({
	valid: Literal(false),
	error: String,
});

export const Config = Union(ValidConfig, InvalidConfig);
// eslint-disable-next-line @typescript-eslint/no-redeclare -- intentionally naming the variable the same as the type
export type Config = Static<typeof Config>;
