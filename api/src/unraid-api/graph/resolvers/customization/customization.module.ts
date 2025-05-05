import { Module } from '@nestjs/common';

import { CustomizationResolver } from '@app/unraid-api/graph/resolvers/customization/customization.resolver.js';
import { CustomizationService } from '@app/unraid-api/graph/resolvers/customization/customization.service.js';

@Module({
    providers: [CustomizationService, CustomizationResolver],
})
export class CustomizationModule {}
