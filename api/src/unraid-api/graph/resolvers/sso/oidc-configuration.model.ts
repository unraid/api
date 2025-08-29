import { Field, ObjectType } from '@nestjs/graphql';

import { OidcProvider } from '@app/unraid-api/graph/resolvers/sso/oidc-provider.model.js';

@ObjectType()
export class OidcConfiguration {
    @Field(() => [OidcProvider], { description: 'List of configured OIDC providers' })
    providers!: OidcProvider[];

    @Field(() => [String], {
        nullable: true,
        description:
            'Default allowed redirect origins that apply to all OIDC providers (e.g., Tailscale domains)',
    })
    defaultAllowedOrigins?: string[];
}
