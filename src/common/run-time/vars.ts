/* eslint-disable new-cap */
import { String, Partial, Null } from 'runtypes';

export const Vars = Partial({
	flashGuid: String.withConstraint(flashGuid => flashGuid.length >= 5 || `Flash GUID is too short: "${flashGuid}"`),
	regState: String.withConstraint(regState => (regState.length >= 2 && regState === regState.toUpperCase()) || `Invalid regState value: "${regState}"`),
	regTy: String.Or(Null),
	regTm2: String.Or(Null)
});
