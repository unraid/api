import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';
import nodeExternals from 'rollup-plugin-node-externals';
import { viteCommonjs } from '@originjs/vite-plugin-commonjs';

export default defineConfig(() => {
    return {
        plugins: [tsconfigPaths(), nodeExternals(), viteCommonjs()],
        build: {
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
            target: 'esnext',
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

