import { Args, Query, ResolveField, Resolver } from '@nestjs/graphql';

import { AuthActionVerb, AuthPossession, UsePermissions } from 'nest-authz';

import { Resource } from '@app/graphql/generated/api/types.js';
import { ConnectSettingsService } from '@app/unraid-api/graph/resolvers/settings/connect-settings.service.js';

@Resolver('ConnectSettings')
export class ConnectSettingsResolver {
    constructor(private readonly connectSettingsService: ConnectSettingsService) {}

    @Query()
    @UsePermissions({
        action: AuthActionVerb.READ,
        resource: Resource.CONNECT,
        possession: AuthPossession.ANY,
    })
    public async connectSettingsForm() {
        const { properties, elements } = await this.connectSettingsService.buildSettingsSchema();
        return {
            id: 'connectSettingsForm',
            dataSchema: {
                type: 'object',
                properties,
            },
            uiSchema: {
                type: 'VerticalLayout',
                elements,
            },
        };
    }
}
