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
});
