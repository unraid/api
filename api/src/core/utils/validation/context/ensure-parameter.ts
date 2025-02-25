import { FieldMissingError } from '@app/core/errors/field-missing-error.js';
import { type CoreContext } from '@app/core/types/index.js';

export const ensureParameter = (context: CoreContext, field: string) => {
    const hasParameter = context.params && Object.keys(context.params).includes(field);

    if (!hasParameter) {
        throw new FieldMissingError(`context.params.${field}`);
    }
};
