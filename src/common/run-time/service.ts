/* eslint-disable new-cap */
import { Number, String, Boolean, Record, Null } from 'runtypes';

const uptime = Record({
	timestamp: String.Or(Null)
});

export const Service = Record({
	name: String.Or(Null),
	online: Boolean.Or(Null),
	uptime: Number.Or(uptime).Or(Null),
	version: String.Or(Null)
});
