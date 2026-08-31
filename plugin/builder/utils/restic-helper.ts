import { createHash, randomUUID } from 'node:crypto';
import { createReadStream, createWriteStream, existsSync } from 'node:fs';
import { chmod, readFile, rename, stat, unlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { spawn } from 'node:child_process';

import manifest from '../../restic.manifest.json' with { type: 'json' };
import { startingDir } from './consts.js';

const destination = join(
    startingDir,
    'source/dynamix.unraid.net/usr/local/bin/restic'
);

export async function ensureRestic(): Promise<void> {
    if (await validRestic(destination)) return;
    const archive = join(tmpdir(), manifest.asset);
    if (!(await validArchive(archive))) await download(archive);
    if (!(await validArchive(archive))) throw new Error('Restic download failed checksum validation');

    const temporary = `${destination}.${randomUUID()}.tmp`;
    try {
        const child = spawn('bzip2', ['-dc', archive], { stdio: ['ignore', 'pipe', 'pipe'] });
        if (!child.stdout) throw new Error('Could not read the Restic archive');
        await pipeline(child.stdout, createWriteStream(temporary, { mode: 0o755, flags: 'wx' }));
        const exitCode = await new Promise<number | null>((resolve, reject) => {
            child.once('error', reject);
            child.once('close', resolve);
        });
        if (exitCode !== 0) throw new Error('Could not extract the Restic archive');
        await chmod(temporary, 0o755);
        if (!(await validRestic(temporary))) throw new Error('Restic artifact is not Linux amd64');
        await rename(temporary, destination);
    } finally {
        await unlink(temporary).catch(() => undefined);
    }
}

async function download(path: string): Promise<void> {
    const response = await fetch(manifest.url, { redirect: 'follow' });
    if (!response.ok || !response.body) throw new Error(`Restic download failed (${response.status})`);
    const temporary = `${path}.${randomUUID()}.tmp`;
    try {
        await pipeline(
            Readable.fromWeb(response.body as import('node:stream/web').ReadableStream),
            createWriteStream(temporary, { mode: 0o600, flags: 'wx' })
        );
        await rename(temporary, path);
    } finally {
        await unlink(temporary).catch(() => undefined);
    }
}

async function validArchive(path: string): Promise<boolean> {
    if (!existsSync(path)) return false;
    const hash = createHash('sha256');
    await pipeline(createReadStream(path), hash);
    return hash.digest('hex') === manifest.sha256;
}

async function validRestic(path: string): Promise<boolean> {
    try {
        const [binary, info] = await Promise.all([readFile(path), stat(path)]);
        return (
            binary.subarray(0, 4).toString('hex') === '7f454c46' &&
            binary.readUInt16LE(18) === 62 &&
            (info.mode & 0o111) === 0o111
        );
    } catch {
        return false;
    }
}
