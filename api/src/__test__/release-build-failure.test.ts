import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { basename, join, resolve } from 'node:path';
import { runInNewContext } from 'node:vm';

import ts from 'typescript';
import { expect, it, vi } from 'vitest';

it.each([
    { exitCode: undefined, expected: 1 },
    { exitCode: 0, expected: 1 },
    { exitCode: 17, expected: 17 },
])('reports a failed release build with exit code $expected', async ({ exitCode, expected }) => {
    const source = await readFile(new URL('../../scripts/build.ts', import.meta.url), 'utf8');
    const { outputText } = ts.transpileModule(source.replace(/^#!.*\n/, ''), {
        compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    });
    const exit = vi.fn();
    const dependencies = new Map<string, unknown>([
        ['fs/promises', { mkdir: vi.fn(), readFile: vi.fn(), writeFile: vi.fn() }],
        ['node:fs', { existsSync }],
        ['node:path', { basename, join, resolve }],
        ['process', { exit }],
        [
            'zx',
            {
                $: vi
                    .fn()
                    .mockRejectedValue(Object.assign(new Error('Release build failed'), { exitCode })),
                cd: vi.fn(),
            },
        ],
        ['@app/../scripts/get-deployment-version.js', { getDeploymentVersion: vi.fn() }],
    ]);

    await runInNewContext(`(async () => { ${outputText} })()`, {
        exports: {},
        console: { log: vi.fn() },
        require: (id: string) => {
            if (!dependencies.has(id)) throw new Error(`Unexpected build dependency: ${id}`);
            return dependencies.get(id);
        },
    });

    expect(exit).toHaveBeenCalledExactlyOnceWith(expected);
});
