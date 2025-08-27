import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';

import { CANONICAL_INTERNAL_CLIENT_TOKEN, INTERNAL_CLIENT_FACTORY_TOKEN } from '@unraid/shared';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { CliServicesModule } from '@app/unraid-api/cli/cli-services.module.js';
import { InternalGraphQLClientFactory } from '@app/unraid-api/shared/internal-graphql-client.factory.js';

describe('CliServicesModule', () => {
    let module: TestingModule;

    beforeEach(async () => {
        module = await Test.createTestingModule({
            imports: [CliServicesModule],
        }).compile();
    });

    afterEach(async () => {
        await module?.close();
    });

    it('should compile the module', () => {
        expect(module).toBeDefined();
    });

    it('should provide CanonicalInternalClient', () => {
        const service = module.get(CANONICAL_INTERNAL_CLIENT_TOKEN);
        expect(service).toBeDefined();
        expect(service.getClient).toBeInstanceOf(Function);
    });

    it('should provide InternalGraphQLClientFactory via token', () => {
        const factory = module.get(INTERNAL_CLIENT_FACTORY_TOKEN);
        expect(factory).toBeDefined();
        expect(factory).toBeInstanceOf(InternalGraphQLClientFactory);
    });

    describe('CanonicalInternalClient dependencies', () => {
        it('should have all required dependencies available', () => {
            // This test ensures that CanonicalInternalClient can be instantiated
            // with all its dependencies properly resolved
            const service = module.get(CANONICAL_INTERNAL_CLIENT_TOKEN);
            expect(service).toBeDefined();

            // Verify the service has its dependencies injected
            // The service should be able to create a client without errors
            expect(service.getClient).toBeDefined();
            expect(service.clearClient).toBeDefined();
        });

        it('should resolve InternalGraphQLClientFactory dependency via token', () => {
            // Explicitly test that the factory is available in the module context via token
            const factory = module.get(INTERNAL_CLIENT_FACTORY_TOKEN);
            expect(factory).toBeDefined();
            expect(factory.createClient).toBeDefined();
        });
    });
});
