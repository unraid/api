import { Test } from '@nestjs/testing';

import { describe, expect, it } from 'vitest';

import { RestModule } from '@app/unraid-api/rest/rest.module.js';

describe('Module Dependencies Integration', () => {
    it('should compile RestModule without dependency injection errors', async () => {
        let module;
        try {
            module = await Test.createTestingModule({
                imports: [RestModule],
            }).compile();

            expect(module).toBeDefined();
        } finally {
            if (module) {
                await module.close();
            }
        }
    });

    it('should detect dependency injection issues at compile time', async () => {
        // This test validates that RestModule can be compiled without errors
        await expect(
            Test.createTestingModule({
                imports: [RestModule],
            }).compile()
        ).resolves.toBeDefined();
    });
});
