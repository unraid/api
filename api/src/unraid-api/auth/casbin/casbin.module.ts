import { Module } from '@nestjs/common';

import { CasbinService } from '@app/unraid-api/auth/casbin/casbin.service.js';

@Module({
    providers: [CasbinService],
    exports: [CasbinService],
})
export class CasbinModule {}
