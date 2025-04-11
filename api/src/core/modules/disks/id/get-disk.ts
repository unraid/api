import { AppError } from '@app/core/errors/app-error.js';
import { type CoreContext, type CoreResult } from '@app/core/types/index.js';
import { ArrayDisk } from '@app/unraid-api/graph/resolvers/array/array.model.js';

interface Context extends CoreContext {
    params: {
        id: string;
    };
}

/**
 * Get a single disk.
 */
export const getDisk = async (context: Context, Disks: ArrayDisk[]): Promise<CoreResult> => {
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
