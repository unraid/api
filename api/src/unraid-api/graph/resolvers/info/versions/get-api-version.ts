import { readFileSync } from 'node:fs';
import { join } from 'node:path';

let cachedVersion: string | undefined;

export function getApiVersion(): string {
    if (cachedVersion) {
        return cachedVersion;
    }

    try {
        const packagePath = join(process.cwd(), 'package.json');
        const packageJson = JSON.parse(readFileSync(packagePath, 'utf-8'));
        cachedVersion = packageJson.version || 'unknown';
        return cachedVersion;
    } catch (error) {
        console.error('Failed to read API version from package.json:', error);
        return 'unknown';
    }
}
