import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';

import { beforeEach, describe, expect, it } from 'vitest';

import { RegistrationResolver } from '@app/unraid-api/graph/resolvers/registration/registration.resolver';

describe('RegistrationResolver', () => {
    let resolver: RegistrationResolver;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [RegistrationResolver],
        }).compile();

        resolver = module.get<RegistrationResolver>(RegistrationResolver);
    });

    it('should be defined', () => {
        expect(resolver).toBeDefined();
    });
});
