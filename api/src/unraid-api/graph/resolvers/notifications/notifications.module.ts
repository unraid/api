import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { NotificationsService } from '@app/unraid-api/graph/resolvers/notifications/notifications.service.js';

@Module({
    imports: [ConfigModule],
    providers: [NotificationsService],
    exports: [NotificationsService],
})
export class NotificationsModule {}
