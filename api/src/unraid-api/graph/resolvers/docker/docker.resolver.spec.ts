import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';

import { beforeEach, describe, expect, it } from 'vitest';

import { DockerResolver } from '@app/unraid-api/graph/resolvers/docker/docker.resolver';

describe('DockerResolver', () => {
    let resolver: DockerResolver;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [DockerResolver],
        }).compile();

        resolver = module.get<DockerResolver>(DockerResolver);
    });

    it('should be defined', () => {
        expect(resolver).toBeDefined();
    });
});
