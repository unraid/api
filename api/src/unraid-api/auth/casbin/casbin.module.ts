import { Module } from '@nestjs/common';

import { CasbinService } from './casbin.service';

@Module({
    providers: [CasbinService],
    exports: [CasbinService],
})
export class CasbinModule {}
