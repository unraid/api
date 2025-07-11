import { Module } from '@nestjs/common';

import { NginxService } from '@app/unraid-api/nginx/nginx.service.js';

/**
 *
 */
@Module({
    providers: [NginxService],
    exports: [NginxService],
})
export class NginxModule {}
