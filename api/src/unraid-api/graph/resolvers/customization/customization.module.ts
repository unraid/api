import { Module } from '@nestjs/common';

import { CustomizationMutationsResolver } from '@app/unraid-api/graph/resolvers/customization/customization.mutations.resolver.js';
import { CustomizationResolver } from '@app/unraid-api/graph/resolvers/customization/customization.resolver.js';
import { CustomizationService } from '@app/unraid-api/graph/resolvers/customization/customization.service.js';

@Module({
    providers: [CustomizationService, CustomizationResolver, CustomizationMutationsResolver],
    exports: [CustomizationService],
})
export class CustomizationModule {}
