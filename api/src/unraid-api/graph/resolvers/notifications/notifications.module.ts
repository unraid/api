import { Module } from '@nestjs/common';

import { NotificationsService } from '@app/unraid-api/graph/resolvers/notifications/notifications.service.js';

@Module({
    providers: [NotificationsService],
    exports: [NotificationsService],
})
export class NotificationsModule {}
