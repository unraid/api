import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';
import nodeExternals from 'rollup-plugin-node-externals';
import { viteCommonjs } from '@originjs/vite-plugin-commonjs';
import { viteStaticCopy } from 'vite-plugin-static-copy';
import nodeResolve from '@rollup/plugin-node-resolve';
import { VitePluginNode } from 'vite-plugin-node';

export default defineConfig(({ mode }) => {
    return {
        plugins: [
            tsconfigPaths(),
            nodeExternals(),
            nodeResolve(),
            viteCommonjs(),
            viteStaticCopy({
                targets: [{ src: 'src/graphql/schema/types', dest: '' }],
            }),
            ...(mode === 'development'
                ? VitePluginNode({
                      adapter: ({ app, req, res }) => {
                          // Example adapter code to run src/index.ts with VitePluginNode
                          app(req, res);
                      },
                      appPath: 'src/index.ts',
                      initAppOnBoot: true,
                  })
                : []),
        ],
        define: {
            'process.env': 'process.env',
        },
        optimizeDeps: {
            exclude: [
                'cpu-features',
                'ssh2',
                'pty.js',
                'term.js',
                'class-transformer/storage',
                'unicorn-magic',
            ],
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
                    format: 'es', // Change the format to 'es' to support top-level await
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
