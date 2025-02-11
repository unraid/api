import type { ViteUserConfig } from 'vitest/config';
import { viteCommonjs } from '@originjs/vite-plugin-commonjs';
import nodeResolve from '@rollup/plugin-node-resolve';
import nodeExternals from 'rollup-plugin-node-externals';
import swc from 'unplugin-swc';
import { VitePluginNode } from 'vite-plugin-node';
import tsconfigPaths from 'vite-tsconfig-paths';
import { defineConfig } from 'vitest/config';

export default defineConfig(({ mode }): ViteUserConfig => {
    return {
        assetsInclude: ['src/**/*.graphql', 'src/**/*.patch'],
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
            ...(mode === 'development'
                ? VitePluginNode({
                      adapter: 'nest',
                      appPath: 'src/index.ts',
                      tsCompiler: 'swc',
                      swcOptions: {
                          jsc: {
                              parser: {
                                  syntax: 'typescript',
                                  decorators: true,
                              },
                              target: 'es2024',
                              transform: {
                                  legacyDecorator: true,
                                  decoratorMetadata: true,
                              },
                          },
                      },
                      initAppOnBoot: true,
                  })
                : []),
            swc.vite({
                jsc: {
                    parser: {
                        syntax: 'typescript',
                        decorators: true,
                    },
                    target: 'es2024',
                    transform: {
                        legacyDecorator: true,
                        decoratorMetadata: true,
                    },
                },
            }),
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
            include: [
                '@nestjs/common',
                '@nestjs/core',
                'reflect-metadata',
                'fastify',
                'passport',
                'passport-custom',
            ],
        },
        build: {
            ssr: true,
            sourcemap: false,
            outDir: 'dist',
            rollupOptions: {
                input: {
                    main: 'src/index.ts',
                    cli: 'src/cli.ts',
                },
                output: {
                    entryFileNames: '[name].js',
                    format: 'es',
                    interop: 'auto',
                },
                preserveEntrySignatures: 'strict',
                external: [
                    'class-validator',
                    'class-transformer',
                    /^@nestjs\/.*/,
                    'reflect-metadata',
                    'rxjs',
                    'fastify',
                    '@fastify/cors',
                    '@fastify/cookie',
                    'passport',
                    'passport-custom',
                    'passport-http-header-strategy',
                    'casbin',
                    'nest-authz',
                    'nest-access-control',
                    '@nestjs/passport',
                    'passport-http-header-strategy',
                    'accesscontrol',
                ],
            },
            modulePreload: false,
            minify: false,
            target: 'node20',
            commonjsOptions: {
                transformMixedEsModules: true,
                include: [/node_modules/, /fastify/, /reflect-metadata/],
                exclude: [
                    'cpu-features',
                    '@nestjs',
                    'rxjs',
                    'passport',
                    'passport-custom',
                    'passport-http-header-strategy',
                ],
                requireReturnsDefault: 'preferred',
                strictRequires: true,
            },
        },
        server: {
            hmr: true,
            watch: {
                usePolling: true,
            },
        },
        test: {
            isolate: false,
            poolOptions: {
                threads: {
                    useAtomics: true,
                    minThreads: 8,
                    maxThreads: 16,
                },
                forks: {
                    maxForks: 16,
                    minForks: 8,
                },
            },
            maxConcurrency: 10,
            globals: true,
            coverage: {
                all: true,
                include: ['src/**/*'],
                reporter: ['text', 'json', 'html'],
            },
            clearMocks: true,
            setupFiles: [
                'dotenv/config',
                'reflect-metadata',
                'src/__test__/setup/env-setup.ts',
                'src/__test__/setup/keyserver-mock.ts',
            ],
            exclude: ['**/deploy/**', '**/node_modules/**'],
        },
    };
});
