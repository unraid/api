/* eslint-disable new-cap */
import { String, Partial, Null } from 'runtypes';
import { Permissions } from '@app/common/run-time/permissions';

export const Me = Partial({
	id: String.Or(Null),
	name: String.Or(Null),
	description: String.Or(Null),
	role: String.Or(Null),
	permissions: Permissions.Or(Null),
});
