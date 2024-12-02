import { viteCommonjs } from '@originjs/vite-plugin-commonjs';
import nodeResolve from '@rollup/plugin-node-resolve';
import nodeExternals from 'rollup-plugin-node-externals';
import native from 'vite-plugin-native';
import { VitePluginNode } from 'vite-plugin-node';
import { viteStaticCopy } from 'vite-plugin-static-copy';
import topLevelAwait from "vite-plugin-top-level-await";
import tsconfigPaths from 'vite-tsconfig-paths';
import { defineConfig } from 'vitest/config';

export default defineConfig(({ mode }) => {
    return {
        plugins: [
            native({}),
            topLevelAwait(),
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
            // Allows vite to preserve process.env variables and not hardcode them
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
                    format: 'es',
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
            setupFiles: ['src/__test__/setup/env-setup.ts', 'src/__test__/setup/keyserver-mock.ts'],
            exclude: ['**/deploy/**', '**/node_modules/**'],
            env: {
                NODE_ENV: 'test',
            },
        },
    };
});