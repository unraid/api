import type { Type } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { LazyMetadataStorage } from '@nestjs/graphql/dist/schema-builder/storages/lazy-metadata.storage.js';
import { TypeMetadataStorage } from '@nestjs/graphql/dist/schema-builder/storages/type-metadata.storage.js';

import type { Permission } from 'nest-authz';
import { PERMISSIONS_METADATA } from 'nest-authz';
import { describe, expect, it, vi } from 'vitest';

import { IS_AUTHENTICATED_ENDPOINT_KEY } from '@app/unraid-api/auth/authenticated.decorator.js';
import { IS_PUBLIC_ENDPOINT_KEY } from '@app/unraid-api/auth/public.decorator.js';

const modules = import.meta.glob<Record<string, unknown>>([
    '../graph/**/*resolver.ts',
    '../graph/**/*.module.ts',
    '../../../../packages/unraid-api-plugin-*/src/**/*resolver.ts',
    '!../../../../packages/**/templates/**',
]);

describe('GraphQL authorization coverage', () => {
    it('requires an explicit access policy on every schema handler, including nested fields and plugins', async () => {
        const fieldRegistration = vi.spyOn(TypeMetadataStorage, 'addResolverPropertyMetadata');
        try {
            const exports = await Promise.all([
                import('@app/unraid-api/graph/resolvers/resolvers.module.js'),
                ...Object.values(modules).map((load) => load()),
            ]);
            const reflector = new Reflector();
            const classes = exports
                .flatMap((module) => Object.values(module))
                .filter((value): value is Type<unknown> => typeof value === 'function');
            const providers = classes
                .flatMap((target) => reflector.get<unknown[]>('providers', target) ?? [])
                .filter((value): value is Type<unknown> => typeof value === 'function');
            LazyMetadataStorage.load([...classes, ...providers]);
            const missing: string[] = [];
            const entries = [
                ...TypeMetadataStorage.getQueriesMetadata(),
                ...TypeMetadataStorage.getMutationsMetadata(),
                ...TypeMetadataStorage.getSubscriptionsMetadata(),
                ...fieldRegistration.mock.calls.map(([metadata]) => metadata),
            ];
            for (const entry of entries) {
                const handler = Reflect.get(entry.target.prototype, entry.methodName);
                expect(typeof handler).toBe('function');
                const permissions = reflector.get<Permission[]>(PERMISSIONS_METADATA, handler);
                const isPublic = reflector.get<boolean>(IS_PUBLIC_ENDPOINT_KEY, handler);
                const authenticated = reflector.get<boolean>(IS_AUTHENTICATED_ENDPOINT_KEY, handler);
                if (authenticated) expect(entry.target.name).toBe('RootMutationsResolver');
                if (!permissions?.length && !isPublic && !authenticated) {
                    missing.push(`${entry.target.name}.${entry.methodName}`);
                }
            }
            expect(entries.length).toBeGreaterThan(100);
            expect(fieldRegistration).toHaveBeenCalled();
            expect(missing.sort()).toEqual([]);
        } finally {
            fieldRegistration.mockRestore();
        }
    }, 30000);
});
