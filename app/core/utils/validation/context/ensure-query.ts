import { CoreContext } from '../../../types';
import { FieldMissingError } from '../../../errors';

export const ensureQuery = (context: CoreContext, field: any) => {
	const hasQuery = context.query && Object.keys(context.query).includes(field);

	if (!hasQuery) {
		throw new FieldMissingError(`context.query.${field}`);
	}
};
