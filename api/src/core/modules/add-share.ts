import type { CoreContext, CoreResult } from '@app/core/types/index.js';
import { AppError } from '@app/core/errors/app-error.js';
import { NotImplementedError } from '@app/core/errors/not-implemented-error.js';
import { ensurePermission } from '@app/core/utils/permissions/ensure-permission.js';
import { getters } from '@app/store/index.js';

export const addShare = async (context: CoreContext<unknown, { name: string }>): Promise<CoreResult> => {
    const { user, data } = context;

    if (!data?.name) {
        throw new AppError('No name provided');
    }

    // Check permissions
    ensurePermission(user, {
        resource: 'share',
        action: 'create',
        possession: 'any',
    });

    const { shares, disks } = getters.emhttp();

    const { name } = data;
    const userShares = shares.map(({ name }) => name);
    const diskShares = disks
        .filter((slot) => slot.exportable)
        .filter(({ name }) => name?.startsWith('disk'))
        .map(({ name }) => name);

    // Existing share names
    const inUseNames = new Set([...userShares, ...diskShares]);

    if (inUseNames.has(name)) {
        throw new AppError(`Share already exists with name: ${name}`, 400);
    }

    throw new NotImplementedError();
};
