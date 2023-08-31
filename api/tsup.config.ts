import { execSync } from 'child_process';
import 'dotenv/config';
import { defineConfig } from 'tsup';
import { version } from './package.json';
import getTags from './scripts/get-tags.mjs'



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

        const tags = getTags();

        options.define['process.env.VERSION'] = tags.isTagged
            ? `"${version}"`
            : `"${version}+${tags.shortSha}"`;
    },
});
