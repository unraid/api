import { Test, TestingModule } from '@nestjs/testing';

import { UnraidFileModifierService } from './unraid-file-modifier.service';

describe('FileModificationService', () => {
    let service: UnraidFileModifierService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [UnraidFileModifierService],
        }).compile();

        service = module.get<UnraidFileModifierService>(UnraidFileModifierService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });
});
