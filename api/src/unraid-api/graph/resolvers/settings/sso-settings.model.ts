import { ObjectType } from '@nestjs/graphql';

import { Node } from '@unraid/shared/graphql.model.js';

@ObjectType({
    implements: () => Node,
})
export class SsoSettings extends Node {
    // oidcProviders field is resolved via SsoSettingsResolver
}
