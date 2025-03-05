import { AppError } from '@app/core/errors/app-error.js';
import { type CoreContext, type CoreResult } from '@app/core/types/index.js';
import { Disk } from '@app/unraid-api/plugins/connect/api/graphql/generated/api/types.js';

interface Context extends CoreContext {
    params: {
        id: string;
    };
}

/**
 * Get a single disk.
 */
export const getDisk = async (context: Context, Disks: Disk[]): Promise<CoreResult> => {
    const { params } = context;

    const { id } = params;
    const disk = Disks.find((disk) => disk.id === id);

    if (!disk) {
        throw new AppError(`No disk found matching ${id}`, 404);
    }

    return {
        text: `Disk: ${JSON.stringify(disk, null, 2)}`,
        json: disk,
    };
};
