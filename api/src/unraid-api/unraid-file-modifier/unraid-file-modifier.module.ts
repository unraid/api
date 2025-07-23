import { Module } from '@nestjs/common';

import { NginxModule } from '@app/unraid-api/nginx/nginx.module.js';
import { FileModificationEffectService } from '@app/unraid-api/unraid-file-modifier/file-modification-effect.service.js';
import { UnraidFileModificationService } from '@app/unraid-api/unraid-file-modifier/unraid-file-modifier.service.js';

@Module({
    imports: [NginxModule],
    providers: [UnraidFileModificationService, FileModificationEffectService],
    exports: [UnraidFileModificationService],
})
export class UnraidFileModifierModule {}
