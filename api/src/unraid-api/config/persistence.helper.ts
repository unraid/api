import { Injectable } from '@nestjs/common';
import { readFile, writeFile } from 'fs/promises';

import { isEqual } from 'lodash-es';

@Injectable()
export class ConfigPersistenceHelper {
    /**
     * Persist the config to disk if the given data is different from the data on-disk.
     * This helps preserve the boot flash drive's life by avoiding unnecessary writes.
     *
     * @param filePath - The path to the config file.
     * @param data - The data to persist.
     * @returns `true` if the config was persisted, `false` otherwise.
     *
     * @throws {Error} if the config file does not exist or is unreadable.
     * @throws {Error} if the config file is not valid JSON.
     * @throws {Error} if given data is not JSON (de)serializable.
     * @throws {Error} if the config file is not writable.
     */
    async persistIfChanged(filePath: string, data: unknown): Promise<boolean> {
        const currentData = JSON.parse(await readFile(filePath, 'utf8'));
        const stagedData = JSON.parse(JSON.stringify(data));
        if (isEqual(currentData, stagedData)) {
            return false;
        }
        await writeFile(filePath, JSON.stringify(stagedData, null, 2));
        return true;
    }
}
