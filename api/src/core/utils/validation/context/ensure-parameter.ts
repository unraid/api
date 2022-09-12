import { CoreContext } from '@app/core/types';
import { FieldMissingError } from '@app/core/errors/field-missing-error';

export const ensureParameter = (context: CoreContext, field: string) => {
	const hasParameter = context.params && Object.keys(context.params).includes(field);

	if (!hasParameter) {
		throw new FieldMissingError(`context.params.${field}`);
	}
};
