import { Args, Query, ResolveField, Resolver } from '@nestjs/graphql';

import { AuthActionVerb, AuthPossession, UsePermissions } from 'nest-authz';

import type { ConnectSettings } from '@app/graphql/generated/api/types.js';
import { Resource } from '@app/graphql/generated/api/types.js';

import { ConnectSettingsService } from './connect-settings.service.js';

@Resolver('ConnectSettings')
export class ConnectSettingsResolver {
    constructor(private readonly connectSettingsService: ConnectSettingsService) {}

    @Query()
    @UsePermissions({
        action: AuthActionVerb.READ,
        resource: Resource.CONNECT,
        possession: AuthPossession.ANY,
    })
    public async connectSettingsForm(): Promise<ConnectSettings> {
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
            values: await this.connectSettingsService.getCurrentSettings(),
        };
    }
}
