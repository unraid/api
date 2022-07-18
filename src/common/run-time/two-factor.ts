/* eslint-disable new-cap */
import { String, Boolean, Partial, Null } from 'runtypes';

export const TwoFactor = Partial({
	token: String.Or(Null),
	remote: Partial({
		enabled: Boolean.Or(Null),
	}).Or(Null),
	local: Partial({
		enabled: Boolean.Or(Null),
	}).Or(Null),
});
