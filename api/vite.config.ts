import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';
import nodeExternals from 'rollup-plugin-node-externals';
import { viteCommonjs } from '@originjs/vite-plugin-commonjs';
import { viteStaticCopy } from 'vite-plugin-static-copy';

export default defineConfig(() => {
    return {
        plugins: [
            tsconfigPaths(),
            nodeExternals(),
            viteCommonjs(),
            viteStaticCopy({
                targets: [{ src: 'src/graphql/schema/types', dest: '' }],
            }),
        ],
        define: {
            'process.env': 'process.env',
        },
        build: {
            sourcemap: true,
            outDir: 'dist',
            rollupOptions: {
                input: {
                    main: 'src/index.ts',
                    cli: 'src/cli.ts',
                },
                output: {
                    entryFileNames: '[name].js',
                },
            },
            modulePreload: false,
            minify: false,
            target: 'node20',
        },
        test: {
            globals: true,
            coverage: {
                all: true,
                include: ['src/**/*'],
                reporter: ['text', 'json', 'html'],
            },
            clearMocks: true,
            setupFiles: ['src/__test__/setup/keyserver-mock.ts', 'dotenv/config'],
            exclude: ['deploy/', 'node_modules/'],
        },
    };
});
