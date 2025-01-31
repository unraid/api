import { FieldMissingError } from '@app/core/errors/field-missing-error';
import { type CoreContext } from '@app/core/types';

export const ensureParameter = (context: CoreContext, field: string) => {
    const hasParameter = context.params && Object.keys(context.params).includes(field);

    if (!hasParameter) {
        throw new FieldMissingError(`context.params.${field}`);
    }
};
