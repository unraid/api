import { dirname, resolve } from 'node:path';

import { AppError } from '@app/core/errors/app-error.js';

export function resolveFileInDirectory(directory: string, filename: string): string {
    if (!filename || filename === '.' || filename === '..' || /[/\\:\0]/u.test(filename)) {
        throw new AppError('Invalid filename', 400);
    }

    const basePath = resolve(directory);
    const filePath = resolve(basePath, filename);
    if (dirname(filePath) !== basePath) {
        throw new AppError('Invalid filename', 400);
    }
    return filePath;
}
