import { Test, type TestingModule } from '@nestjs/testing';
import { DockerResolver } from './docker.resolver';

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
