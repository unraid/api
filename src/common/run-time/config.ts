/* eslint-disable new-cap */
import { String, Boolean, Record, Union, Static } from 'runtypes';

const ValidConfig = Record({
	valid: Boolean.withConstraint(valid => valid),
});

const InvalidConfig = Record({
	valid: Boolean.withConstraint(valid => !valid),
	error: String,
});

export const Config = Union(ValidConfig, InvalidConfig);
// eslint-disable-next-line @typescript-eslint/no-redeclare -- intentionally naming the variable the same as the type
export type Config = Static<typeof Config>;
