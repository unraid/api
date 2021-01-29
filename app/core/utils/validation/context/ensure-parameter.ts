import { CoreContext } from '../../../types';
import { FieldMissingError } from '../../../errors';

export const ensureParameter = (context: CoreContext, field: string) => {
	const hasParameter = context.params && Object.keys(context.params).includes(field);

	if (!hasParameter) {
		throw new FieldMissingError(`context.params.${field}`);
	}
};
