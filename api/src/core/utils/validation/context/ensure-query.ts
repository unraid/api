import { type CoreContext } from '@app/core/types';
import { FieldMissingError } from '@app/core/errors/field-missing-error';

export const ensureQuery = (context: CoreContext, field: string) => {
	const hasQuery = context.query && Object.keys(context.query).includes(field);

	if (!hasQuery) {
		throw new FieldMissingError(`context.query.${field}`);
	}
};
