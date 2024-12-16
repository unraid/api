import { viteCommonjs } from '@originjs/vite-plugin-commonjs';
import nodeResolve from '@rollup/plugin-node-resolve';
import nodeExternals from 'rollup-plugin-node-externals';
import { VitePluginNode } from 'vite-plugin-node';
import { viteStaticCopy } from 'vite-plugin-static-copy';
import tsconfigPaths from 'vite-tsconfig-paths';
import { defineConfig } from 'vitest/config';

export default defineConfig(({ mode }) => {
    return {
        plugins: [
            tsconfigPaths(),
            nodeExternals(),
            nodeResolve({
                preferBuiltins: true,
                exportConditions: ['node'],
            }),
            viteCommonjs({
                include: ['@fastify/type-provider-typebox', 'node_modules/**'],
            }),
            viteStaticCopy({
                targets: [{ src: 'src/graphql/schema/types', dest: '' }],
            }),
            ...(mode === 'development'
                ? VitePluginNode({
                      adapter: 'nest',
                      appPath: 'src/index.ts',
                      tsCompiler: 'swc',
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
            include: ['@nestjs/common', '@nestjs/core', 'reflect-metadata', 'fastify'],
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
                preserveEntrySignatures: 'strict',
            },
            modulePreload: false,
            minify: false,
            target: 'node20',
            commonjsOptions: {
                transformMixedEsModules: true,
                include: [/node_modules/, /fastify/],
                exclude: ['cpu-features'],
            },
        },
        server: {
            hmr: true,
            watch: {
                usePolling: true,
            },
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
