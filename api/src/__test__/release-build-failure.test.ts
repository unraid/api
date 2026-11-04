import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { basename, join, resolve } from 'node:path';
import { runInNewContext } from 'node:vm';

import ts from 'typescript';
import { expect, it, vi } from 'vitest';

const runReleaseBuild = async (dependencies: Map<string, unknown>) => {
    const source = await readFile(new URL('../../scripts/build.ts', import.meta.url), 'utf8');
    const { outputText } = ts.transpileModule(source.replace(/^#!.*\n/, ''), {
        compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    });

    await runInNewContext(`(async () => { ${outputText} })()`, {
        exports: {},
        process: { env: {} },
        console: { log: vi.fn() },
        require: (id: string) => {
            if (!dependencies.has(id)) throw new Error(`Unexpected build dependency: ${id}`);
            return dependencies.get(id);
        },
    });
};

it.each([
    { exitCode: undefined, expected: 1 },
    { exitCode: 0, expected: 1 },
    { exitCode: 17, expected: 17 },
])('reports a failed release build with exit code $expected', async ({ exitCode, expected }) => {
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

    await runReleaseBuild(dependencies);

    expect(exit).toHaveBeenCalledExactlyOnceWith(expected);
});

it('pins the patched SSH version before the first production dependency install', async () => {
    const inputs = new Map([
        ['./package.json', await readFile(new URL('../../package.json', import.meta.url), 'utf8')],
        ['../package.json', await readFile(new URL('../../../package.json', import.meta.url), 'utf8')],
    ]);
    const writes = new Map<string, string>();
    let installingDependencies = false;
    const dependencies = new Map<string, unknown>([
        [
            'fs/promises',
            {
                mkdir: vi.fn(),
                readFile: async (path: string) => {
                    const content = inputs.get(path);
                    if (content === undefined) throw new Error(`Unexpected build input: ${path}`);
                    return content;
                },
                writeFile: async (path: string, content: string) => writes.set(path, content),
            },
        ],
        ['node:fs', { existsSync }],
        ['node:path', { basename, join, resolve }],
        ['process', { exit: vi.fn() }],
        [
            'zx',
            {
                $: async (command: TemplateStringsArray) => {
                    if (command[0] === 'npm install --omit=dev') {
                        installingDependencies = true;
                        throw new Error('Stop before installing external dependencies');
                    }
                },
                cd: vi.fn(),
            },
        ],
        [
            '@app/../scripts/get-deployment-version.js',
            { getDeploymentVersion: vi.fn().mockResolvedValue('4.37.10') },
        ],
    ]);

    await runReleaseBuild(dependencies);

    expect(installingDependencies).toBe(true);
    const manifest = writes.get('./deploy/pack/package.json');
    if (manifest === undefined) throw new Error('Production manifest was not written');
    expect(JSON.parse(manifest).overrides.ssh2).toBe('1.17.0');
});
