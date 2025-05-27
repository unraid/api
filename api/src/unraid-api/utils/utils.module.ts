import { Global, Module } from '@nestjs/common';

import { FormatService } from '@app/unraid-api/utils/format.service.js';

@Global()
@Module({
    providers: [FormatService],
    exports: [FormatService],
})
export class UtilsModule {}
