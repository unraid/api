import { Module } from '@nestjs/common';

import { ArrayModule } from '@app/unraid-api/graph/resolvers/array/array.module.js';
import { DisksResolver } from '@app/unraid-api/graph/resolvers/disks/disks.resolver.js';
import { DisksService } from '@app/unraid-api/graph/resolvers/disks/disks.service.js';
import { InternalBootNotificationService } from '@app/unraid-api/graph/resolvers/disks/internal-boot-notification.service.js';
import { NotificationsModule } from '@app/unraid-api/graph/resolvers/notifications/notifications.module.js';

@Module({
    imports: [ArrayModule, NotificationsModule],
    providers: [DisksResolver, DisksService, InternalBootNotificationService],
    exports: [DisksResolver, DisksService],
})
export class DisksModule {}
