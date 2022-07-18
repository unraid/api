/* eslint-disable new-cap */
import { String, Partial, Null } from 'runtypes';

export const Vm = Partial({
	name: String.Or(Null),
	uuid: String.Or(Null),
	state: String.Or(Null),
});
