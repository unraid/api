/* eslint-disable new-cap */
import { String, Boolean, Partial, Null, Static } from 'runtypes';

export const TwoFactor = Partial({
	token: String.Or(Null),
	remote: Partial({
		enabled: Boolean.Or(Null),
	}).Or(Null),
	local: Partial({
		enabled: Boolean.Or(Null),
	}).Or(Null),
});

// eslint-disable-next-line @typescript-eslint/no-redeclare
export type TwoFactor = Static<typeof TwoFactor>;
