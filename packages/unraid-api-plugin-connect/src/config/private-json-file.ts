import { randomUUID } from 'node:crypto';
import { mkdir, readFile, rename, stat, unlink, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';

export async function writePrivateJson(path: string, data: string): Promise<void> {
    if (
        (await readFile(path, 'utf8').catch(() => null)) === data &&
        ((await stat(path).catch(() => null))?.mode ?? 0) % 0o1000 === 0o600
    )
        return;
    await mkdir(dirname(path), { recursive: true });
    const temporary = `${path}.${randomUUID()}.tmp`;
    try {
        await writeFile(temporary, data, { mode: 0o600, flag: 'wx' });
        await rename(temporary, path);
    } finally {
        await unlink(temporary).catch(() => undefined);
    }
}
