import { Logger } from '@nestjs/common';
import { execFile } from 'node:child_process';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';

import { createPatch } from 'diff';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import RcNginxModification from '@app/unraid-api/unraid-file-modifier/modifications/rc-nginx.modification.js';

describe('rc.nginx client identity lifecycle', () => {
    let directory: string;
    beforeEach(async () => {
        directory = await mkdtemp(join(tmpdir(), 'api-nginx-'));
    });
    afterEach(async () => {
        await rm(directory, { recursive: true, force: true });
    });

    it('patches integrated API versions, survives reapply, and rolls back cleanly', async () => {
        const original = `CONNECT_CONFIG="existing"
build_locations(){
  cat <<- 'EOF'
\tlocation /graphql {
\t    proxy_set_header X-Forwarded-For \\$http_x_forwarded_for;
\t    proxy_pass http://unix:/var/run/unraid-api.sock:/graphql;
\t    proxy_set_header Host \\$host;
\t}
\tEOF
}
`;
        const file = join(directory, 'rc.nginx');
        const previous = original.replace('CONNECT_CONFIG="existing"', 'CONNECT_CONFIG="previous"');
        await writeFile(file, previous);
        await writeFile(`${file}.patch`, createPatch(file, original, previous));
        const modification = new RcNginxModification(new Logger());
        modification.filePath = file;
        expect((await modification.shouldApply()).shouldApply).toBe(true);
        await modification.apply();
        const patched = await readFile(file, 'utf8');
        expect(patched).toContain('proxy_set_header X-Forwarded-For $remote_addr;');
        expect(patched).not.toContain('$http_x_forwarded_for');
        expect(patched.match(/proxy_set_header X-Forwarded-For/g)).toHaveLength(1);
        const { stdout } = await promisify(execFile)('/bin/bash', [
            '-c',
            'source "$1"; build_locations',
            'nginx-test',
            file,
        ]);
        expect(stdout).toContain('proxy_set_header X-Forwarded-For $remote_addr;');
        await modification.apply();
        expect(await readFile(file, 'utf8')).toBe(patched);
        await modification.rollback();
        expect(await readFile(file, 'utf8')).toBe(original);
    });
    it('emits a valid client address variable from the bundled nginx generator', async () => {
        const original = await readFile(
            new URL('./__fixtures__/downloaded/rc.nginx', import.meta.url),
            'utf8'
        );
        const file = join(directory, 'rc.nginx');
        await writeFile(file, original);
        const modification = new RcNginxModification(new Logger());
        modification.filePath = file;
        await modification.apply();
        const patched = await readFile(file, 'utf8');
        const start = patched.indexOf('build_locations(){');
        const end = patched.indexOf('\n}\n', start);
        expect(start).toBeGreaterThan(-1);
        expect(end).toBeGreaterThan(start);
        const generator = join(directory, 'locations.sh');
        const locations = join(directory, 'locations.conf');
        await writeFile(generator, patched.slice(start, end + 3));
        await promisify(execFile)('/bin/bash', [
            '-c',
            'source "$1"; LOCATIONS="$2"; build_locations',
            'nginx-test',
            generator,
            locations,
        ]);
        const generated = await readFile(locations, 'utf8');
        const header = generated
            .split('\n')
            .filter((line) => line.includes('proxy_set_header X-Forwarded-For'));
        expect(header.map((line) => line.trim())).toEqual([
            'proxy_set_header X-Forwarded-For $remote_addr;',
        ]);
        await modification.apply();
        expect(await readFile(file, 'utf8')).toBe(patched);
        await modification.rollback();
        expect(await readFile(file, 'utf8')).toBe(original);
    });
});
