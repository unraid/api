import { createHash } from 'node:crypto';
import { readFile, stat } from 'node:fs/promises';
import { join } from 'node:path';

export async function validateConnectConnector(sourceRoot: string): Promise<void> {
    const directory = join(sourceRoot, 'dynamix.unraid.net/usr/local/bin');
    const path = join(directory, 'unraid-connect-connector');
    const manifest = JSON.parse(await readFile(`${path}.json`, 'utf8'));
    const binary = await readFile(path);
    if (
        manifest.goos !== 'linux' ||
        manifest.goarch !== 'amd64' ||
        manifest.cgo !== false ||
        binary.subarray(0, 4).toString('hex') !== '7f454c46' ||
        binary.readUInt16LE(18) !== 62 ||
        ((await stat(path)).mode & 0o111) !== 0o111 ||
        createHash('sha256').update(binary).digest('hex') !== manifest.sha256
    ) {
        throw new Error('The vendored Connect connector does not match its pinned Linux artifact');
    }
}
