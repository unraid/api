import { type DashboardArrayInput } from '@app/graphql/generated/client/graphql';
import { getArrayData } from '@app/core/modules/array/get-array-data';
import { ArrayState } from '@app/graphql/generated/api/types';
import { convert } from 'convert';

const KiBToB = (KiB: number | string): number =>
    convert(Number(KiB), 'KiB').to('B');

export const getArray = (): DashboardArrayInput => {
    const array = getArrayData();

    if (!array) {
        return {
            state: ArrayState.STOPPED,
            capacity: {
                bytes: { free: 0, used: 0, total: 0 },
            },
        };
    }

    return {
        state: array.state ?? ArrayState.STOPPED,
        capacity: {
            bytes: {
                free: KiBToB(array.capacity.kibibytes.free),
                used: KiBToB(array.capacity.kibibytes.used),
                total: KiBToB(array.capacity.kibibytes.total),
            },
        },
    };
};
