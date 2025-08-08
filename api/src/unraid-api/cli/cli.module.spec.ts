import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { AdminKeyService } from '@app/unraid-api/cli/admin-key.service.js';
import { CliServicesModule } from '@app/unraid-api/cli/cli-services.module.js';
import { CliInternalClientService } from '@app/unraid-api/cli/internal-client.service.js';
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

    it('should provide CliInternalClientService', () => {
        const service = module.get(CliInternalClientService);
        expect(service).toBeDefined();
        expect(service).toBeInstanceOf(CliInternalClientService);
    });

    it('should provide AdminKeyService', () => {
        const service = module.get(AdminKeyService);
        expect(service).toBeDefined();
        expect(service).toBeInstanceOf(AdminKeyService);
    });

    it('should provide InternalGraphQLClientFactory', () => {
        const factory = module.get(InternalGraphQLClientFactory);
        expect(factory).toBeDefined();
        expect(factory).toBeInstanceOf(InternalGraphQLClientFactory);
    });

    describe('CliInternalClientService dependencies', () => {
        it('should have all required dependencies available', () => {
            // This test ensures that CliInternalClientService can be instantiated
            // with all its dependencies properly resolved
            const service = module.get(CliInternalClientService);
            expect(service).toBeDefined();

            // Verify the service has its dependencies injected
            // The service should be able to create a client without errors
            expect(service.getClient).toBeDefined();
            expect(service.clearClient).toBeDefined();
        });

        it('should resolve InternalGraphQLClientFactory dependency', () => {
            // Explicitly test that the factory is available in the module context
            const factory = module.get(InternalGraphQLClientFactory);
            expect(factory).toBeDefined();
            expect(factory.createClient).toBeDefined();
        });

        it('should resolve AdminKeyService dependency', () => {
            // Explicitly test that AdminKeyService is available in the module context
            const adminKeyService = module.get(AdminKeyService);
            expect(adminKeyService).toBeDefined();
            expect(adminKeyService.getOrCreateLocalAdminKey).toBeDefined();
        });
    });
});
