import { execSync } from 'child_process';
import 'dotenv/config';
import { defineConfig } from 'tsup';
import { version } from './package.json';

const runCommand = (command: string) => {
    try {
        return execSync(command, { stdio: 'pipe' }).toString().trim();
    } catch {
        return;
    }
};

export default defineConfig({
    name: 'tsup',
    target: 'node18',
    entry: {
        'unraid-api': 'src/cli.ts',
        index: 'src/index.ts',
    },
    metafile: true,
    splitting: false,
    sourcemap: true,
    clean: true,
    external: ['@vmngr/libvirt'],
    esbuildOptions(options) {
        if (!options.define) options.define = {};
        console.log('IS TAGGED', process.env.IS_TAGGED);
        if (process.env.GIT_SHA && process.env.IS_TAGGED) {
            const gitShortSHA = process.env.GIT_SHA;
            const isCommitTagged = process.env.IS_TAGGED;
            options.define['process.env.VERSION'] = isCommitTagged
                ? `"${version}"`
                : `"${version}+${gitShortSHA}"`;
        } else {
            const gitShortSHA = runCommand('git rev-parse --short HEAD');
            const isCommitTagged =
                runCommand('git describe --tags --abbrev=0 --exact-match') !==
                undefined;
            options.define['process.env.VERSION'] = isCommitTagged
                ? `"${version}"`
                : `"${version}+${gitShortSHA}"`;
        }
    },
});
