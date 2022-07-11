/* eslint-disable new-cap */
import { Number, String, Record, Partial, Null } from 'runtypes';

export const Info = Partial({
	apps: Record({
		installed: Number,
		started: Number
	}),
	versions: Partial({
		unraid: String.Or(Null)
	}),
	os: Partial({
		hostname: String,
		uptime: String.Or(Null)
	}),
	vms: Record({
		installed: Number,
		started: Number
	}).Or(Null)
});
