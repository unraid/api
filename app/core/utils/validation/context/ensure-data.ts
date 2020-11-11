import { CoreContext } from '../../../types';
import { FieldMissingError } from '../../../errors';

export const ensureData = (context: CoreContext, field) => {
	const hasData = context.data && Object.keys(context.data).includes(field);

	if (!hasData) {
		throw new FieldMissingError(`context.data.${field}`);
	}

	return true;
};
