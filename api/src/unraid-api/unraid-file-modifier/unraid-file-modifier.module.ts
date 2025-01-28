import { Module } from '@nestjs/common';
import { FileModificationService } from './unraid-file-modifier.service';

@Module({
  providers: [FileModificationService]
})
export class UnraidFileModifierModule {}
