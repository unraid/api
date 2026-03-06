import { Module } from '@nestjs/common';

import { UnraidPluginsMutationsResolver } from '@app/unraid-api/graph/resolvers/unraid-plugins/unraid-plugins.mutation.js';
import { UnraidPluginsResolver } from '@app/unraid-api/graph/resolvers/unraid-plugins/unraid-plugins.resolver.js';
import { UnraidPluginsService } from '@app/unraid-api/graph/resolvers/unraid-plugins/unraid-plugins.service.js';

@Module({
    providers: [UnraidPluginsMutationsResolver, UnraidPluginsResolver, UnraidPluginsService],
    exports: [UnraidPluginsService],
})
export class UnraidPluginsModule {}
