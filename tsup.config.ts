import 'dotenv/config';
import { defineConfig } from 'tsup';

export default defineConfig({
    name: 'tsup',
    target: 'node18',
    entry: {
        'unraid-api': "src/cli.ts",
        'index': "src/index.ts"
    },
    metafile: true,
    splitting: false,
    sourcemap: true,
    clean: true,
});
