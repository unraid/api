/* eslint-disable new-cap */
import { Array, Partial, Null } from 'runtypes';
import { Vm } from '@app/common/run-time/vm';

export const Vms = Partial({
	domain: Array(Vm).Or(Null)
});
