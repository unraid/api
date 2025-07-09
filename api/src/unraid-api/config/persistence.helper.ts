import { Injectable } from '@nestjs/common';
import { readFile, writeFile } from 'fs/promises';

import { fileExists } from '@unraid/shared/util/file.js';
import { isEqual } from 'lodash-es';

@Injectable()
export class ConfigPersistenceHelper {
    /**
     * Persist the config to disk if the given data is different from the data on-disk.
     * This helps preserve the boot flash drive's life by avoiding unnecessary writes.
     *
     * @param filePath - The path to the config file.
     * @param data - The data to persist.
     * @returns `true` if the config was persisted, `false` if no changes were needed or if persistence failed.
     *
     * This method is designed to never throw errors. If the existing file is corrupted or unreadable,
     * it will attempt to overwrite it with the new data. If write operations fail, it returns false
     * but does not crash the application.
     */
    async persistIfChanged(filePath: string, data: unknown): Promise<boolean> {
        if (!(await fileExists(filePath))) {
            try {
                const jsonString = JSON.stringify(data ?? {}, null, 2);
                await writeFile(filePath, jsonString);
                return true;
            } catch (error) {
                // JSON serialization or write failed, but don't crash - just return false
                return false;
            }
        }

        let currentData: unknown;
        try {
            const fileContent = await readFile(filePath, 'utf8');
            currentData = JSON.parse(fileContent);
        } catch (error) {
            // If existing file is corrupted, treat it as if it doesn't exist
            // and write the new data
            try {
                const jsonString = JSON.stringify(data ?? {}, null, 2);
                await writeFile(filePath, jsonString);
                return true;
            } catch (writeError) {
                // JSON serialization or write failed, but don't crash - just return false
                return false;
            }
        }

        let stagedData: unknown;
        try {
            stagedData = JSON.parse(JSON.stringify(data));
        } catch (error) {
            // If data can't be serialized to JSON, we can't persist it
            return false;
        }

        if (isEqual(currentData, stagedData)) {
            return false;
        }

        try {
            await writeFile(filePath, JSON.stringify(stagedData, null, 2));
            return true;
        } catch (error) {
            // Write failed, but don't crash - just return false
            return false;
        }
    }
}
