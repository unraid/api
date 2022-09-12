/* eslint-disable new-cap */
import { String, Record } from 'runtypes';

export const Domain = Record({
	uuid: String,
	name: String,
	state: String,
});
