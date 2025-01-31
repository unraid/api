import { readFile, writeFile } from 'fs/promises';
import { applyPatch, parsePatch, reversePatch } from 'diff';

export async function rollbackPatch(targetFile: string, patch: string): Promise<void> {
    const currentContent = await readFile(targetFile, 'utf8');
    const parsedPatch = parsePatch(patch)[0];
    
    if (!parsedPatch || !parsedPatch.hunks || parsedPatch.hunks.length === 0) {
        throw new Error('Invalid or empty patch content');
    }

    const reversedPatch = reversePatch(parsedPatch);
    const results = applyPatch(currentContent, reversedPatch);

    if (results === false) {
        throw new Error(`Failed to rollback patch from ${targetFile}`);
    }

    await writeFile(targetFile, results);
} 