import { Test, TestingModule } from '@nestjs/testing';

import { UnraidFileModificationService } from '@app/unraid-api/unraid-file-modifier/unraid-file-modifier.service';

describe('FileModificationService', () => {
    let service: UnraidFileModificationService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [UnraidFileModificationService],
        }).compile();

        service = module.get<UnraidFileModificationService>(UnraidFileModificationService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });
});
