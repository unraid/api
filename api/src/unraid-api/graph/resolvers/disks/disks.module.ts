import { Module } from '@nestjs/common';

import { DisksResolver } from '@app/unraid-api/graph/resolvers/disks/disks.resolver.js';
import { DisksService } from '@app/unraid-api/graph/resolvers/disks/disks.service.js';

@Module({
    providers: [DisksResolver, DisksService],
    exports: [DisksResolver, DisksService],
})
export class DisksModule {}
