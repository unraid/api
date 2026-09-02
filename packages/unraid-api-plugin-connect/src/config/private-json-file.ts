import { spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { mkdir, readFile, rename, stat, unlink, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';

const lockCommand = process.platform === 'darwin' ? '/usr/bin/lockf' : '/usr/bin/flock';
const lockScript = 'printf ready; IFS= read -r _';

async function acquireKernelLock(path: string): Promise<ReturnType<typeof spawn>> {
    const args =
        process.platform === 'darwin'
            ? ['-t', '2', path, '/bin/sh', '-c', lockScript]
            : ['-x', '-w', '2', path, '/bin/sh', '-c', lockScript];
    const child = spawn(lockCommand, args, { stdio: ['pipe', 'pipe', 'pipe'] });
    await new Promise<void>((resolve, reject) => {
        let stderr = '';
        child.stderr.setEncoding('utf8');
        child.stderr.on('data', (chunk: string) => (stderr += chunk));
        child.stdout.once('data', (chunk: Buffer) => {
            if (chunk.toString() === 'ready') resolve();
            else reject(new Error('Connect settings lock returned an invalid response'));
        });
        child.once('error', reject);
        child.once('exit', (code) => {
            if (code !== 0) reject(new Error(stderr.trim() || 'Connect settings are busy; try again'));
        });
    });
    return child;
}

export async function withPrivateJsonLock<T>(path: string, action: () => Promise<T>): Promise<T> {
    const lockPath = `${path}.writer-lock`;
    await mkdir(dirname(path), { recursive: true });
    const lock = await acquireKernelLock(lockPath);
    try {
        return await action();
    } finally {
        lock.stdin?.end('release\n');
    }
}

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
