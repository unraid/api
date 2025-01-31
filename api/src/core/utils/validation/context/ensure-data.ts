import { FieldMissingError } from '@app/core/errors/field-missing-error';
import { type CoreContext } from '@app/core/types';

export const ensureData = (context: CoreContext, field: string) => {
    const hasData = context.data && Object.keys(context.data).includes(field);

    if (!hasData) {
        throw new FieldMissingError(`context.data.${field}`);
    }

    return true;
};
