import { existsSync, readFileSync } from 'node:fs';
import { basename, join } from 'node:path';

import type { ViteUserConfig } from 'vitest/config';
import { viteCommonjs } from '@originjs/vite-plugin-commonjs';
import nodeResolve from '@rollup/plugin-node-resolve';
import nodeExternals from 'rollup-plugin-node-externals';
import swc from 'unplugin-swc';
import { VitePluginNode } from 'vite-plugin-node';
import tsconfigPaths from 'vite-tsconfig-paths';
import { defineConfig } from 'vitest/config';

/**------------------------------------------------------------------------
 *                Place Workspace Dependencies Here
 *
 *  Since we vendor them via node_modules, we must exclude them from optimization,
 *  so they aren't loaded twice (eg effectful imports like gql type registration).
 *
 *  See api/scripts/build.ts for the vendoring implementation.
 *------------------------------------------------------------------------**/
/**
 * Record of monorepo workspace packages to their paths from the root of the monorepo.
 */
const workspaceDependencies = {
    '@unraid/shared': 'packages/unraid-shared',
    'unraid-api-plugin-connect': 'packages/unraid-api-plugin-connect-2',
};

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
            // Copy PHP files to assets directory
            {
                name: 'copy-php-files',
                buildStart() {
                    const phpFiles = ['src/core/utils/plugins/wrapper.php'];
                    phpFiles.forEach((file) => this.addWatchFile(file));
                },
                async generateBundle() {
                    const phpFiles = ['src/core/utils/plugins/wrapper.php'];
                    phpFiles.forEach((file) => {
                        if (!existsSync(file)) {
                            this.warn(`[copy-php-files] PHP file ${file} does not exist`);
                            return;
                        }
                        const content = readFileSync(file);
                        this.emitFile({
                            type: 'asset',
                            fileName: join('assets', basename(file)),
                            source: content,
                        });
                    });
                },
            },
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
                // Exclude workspace dependencies except in test mode to avoid GraphQL version conflicts
                ...(mode === 'test' ? [] : Object.keys(workspaceDependencies)),
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
                    banner: (chunk) => {
                        if (chunk.fileName === 'main.js' || chunk.fileName === 'cli.js') {
                            if (process.env.COMMAND_TESTER) {
                                return '#!/usr/bin/env node\n';
                            }
                            return '#!/usr/local/bin/node\n';
                        }
                        return '';
                    },
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
                    ...Object.keys(workspaceDependencies),
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
        ssr: {
            external: mode === 'test' ? [] : [...Object.keys(workspaceDependencies)],
        },
        server: {
            hmr: true,
            watch: {
                usePolling: true,
            },
        },
        test: {
            browser: {
                enabled: false,
            },
            open: false,
            isolate: true,
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
            environment: 'node',
            coverage: {
                all: true,
                include: ['src/**/*'],
                reporter: ['text', 'json', 'html'],
            },
            setupFiles: ['dotenv/config', 'reflect-metadata', 'src/__test__/setup.ts'],
            exclude: ['**/deploy/**', '**/node_modules/**'],
        },
    };
});
