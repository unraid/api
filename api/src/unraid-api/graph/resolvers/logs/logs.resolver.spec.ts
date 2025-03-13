import { Test, TestingModule } from '@nestjs/testing';

import { LogsResolver } from '@app/unraid-api/graph/resolvers/logs/logs.resolver';

describe('LogsResolver', () => {
    let resolver: LogsResolver;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [LogsResolver],
        }).compile();

        resolver = module.get<LogsResolver>(LogsResolver);
    });

    it('should be defined', () => {
        expect(resolver).toBeDefined();
    });
});
