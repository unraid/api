import { Module } from '@nestjs/common';

import { UnraidFileModificationService } from './unraid-file-modifier.service';

@Module({
    providers: [UnraidFileModificationService],
})
export class UnraidFileModifierModule {}
