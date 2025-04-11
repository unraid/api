import type { StateFileToIniParserMap } from '@app/store/types.js';
import { toNumberOrNullConvert } from '@app/core/utils/casting.js';
import { Share } from '@app/unraid-api/graph/resolvers/array/array.model.js';

export type SharesIni = Array<{
    name: string;
    free: string;
    used: string;
    size: string;
    include: string;
    exclude: string;
    useCache: string;
}>;

export const parse: StateFileToIniParserMap['shares'] = (state) =>
    Object.values(state).map((item) => {
        const { name, free, used, size, include, exclude, useCache, ...rest } = item;
        const share: Share = {
            id: name,
            name: name ?? null,
            free:
                toNumberOrNullConvert(free, {
                    startingUnit: 'KiB',
                    endUnit: 'KB',
                }) ?? 0,
            used:
                toNumberOrNullConvert(used, {
                    startingUnit: 'KiB',
                    endUnit: 'KB',
                }) ?? 0,
            size:
                toNumberOrNullConvert(size, {
                    startingUnit: 'KiB',
                    endUnit: 'KB',
                }) ?? 0,
            include: include.split(',').filter((_) => _),
            exclude: exclude.split(',').filter((_) => _),
            cache: useCache === 'yes',
            ...rest,
        };

        return share;
    });
