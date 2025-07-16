import { accessSync } from 'fs';
import { access, mkdir, writeFile } from 'fs/promises';
import { mkdirSync, writeFileSync } from 'fs';
import { F_OK } from 'node:constants';
import { dirname } from 'path';

/**
 * Checks if a file exists asynchronously.
 * @param path - The file path to check
 * @returns Promise that resolves to true if file exists, false otherwise
 */
export const fileExists = async (path: string) =>
    access(path, F_OK)
        .then(() => true)
        .catch(() => false);

/**
 * Checks if a file exists synchronously.
 * @param path - The file path to check
 * @returns true if file exists, false otherwise
 */
export const fileExistsSync = (path: string) => {
    try {
        accessSync(path, F_OK);
        return true;
    } catch (error: unknown) {
        return false;
    }
};

/**
 * Writes data to a file, creating parent directories if they don't exist.
 * 
 * This function ensures the directory structure exists before writing the file,
 * equivalent to `mkdir -p` followed by file writing.
 * 
 * @param path - The file path to write to
 * @param data - The data to write (string or Buffer)
 * @throws {Error} If path is invalid (null, empty, or not a string)
 * @throws {Error} For any file system errors (EACCES, EPERM, ENOSPC, EISDIR, etc.)
 */
export const ensureWrite = async (path: string, data: string | Buffer) => {
    if (!path || typeof path !== 'string') {
        throw new Error(`Invalid path provided: ${path}`);
    }

    await mkdir(dirname(path), { recursive: true });
    return await writeFile(path, data);
};

/**
 * Writes data to a file synchronously, creating parent directories if they don't exist.
 * 
 * This function ensures the directory structure exists before writing the file,
 * equivalent to `mkdir -p` followed by file writing.
 * 
 * @param path - The file path to write to
 * @param data - The data to write (string or Buffer)
 * @throws {Error} If path is invalid (null, empty, or not a string)
 * @throws {Error} For any file system errors (EACCES, EPERM, ENOSPC, EISDIR, etc.)
 */
export const ensureWriteSync = (path: string, data: string | Buffer) => {
    if (!path || typeof path !== 'string') {
        throw new Error(`Invalid path provided: ${path}`);
    }

    mkdirSync(dirname(path), { recursive: true });
    return writeFileSync(path, data);
};

