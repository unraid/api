import { type DashboardArrayInput } from '@app/graphql/generated/client/graphql';
import { getArrayData } from '@app/core/modules/array/get-array-data';
import { ArrayState } from '@app/graphql/generated/api/types';
import { convert } from 'convert';

const KBToB = (kb: number | string): number =>
    convert(Number(kb), 'KB').to('B');

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
                free: KBToB(array.capacity.kilobytes.free),
                used: KBToB(array.capacity.kilobytes.used),
                total: KBToB(array.capacity.kilobytes.total),
            },
        },
    };
};
