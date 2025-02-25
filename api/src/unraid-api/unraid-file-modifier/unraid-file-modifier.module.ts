import { Module } from '@nestjs/common';

import { UnraidFileModificationService } from '@app/unraid-api/unraid-file-modifier/unraid-file-modifier.service.js';

@Module({
    providers: [UnraidFileModificationService],
})
export class UnraidFileModifierModule {}
