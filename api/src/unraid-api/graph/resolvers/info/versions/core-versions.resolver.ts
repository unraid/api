import { ResolveField, Resolver } from '@nestjs/graphql';

import { AuthAction, Resource } from '@unraid/shared/graphql.model.js';
import { UsePermissions } from '@unraid/shared/use-permissions.directive.js';
import { versions } from 'systeminformation';

import { CoreVersions } from '@app/unraid-api/graph/resolvers/info/versions/versions.model.js';

@Resolver(() => CoreVersions)
export class CoreVersionsResolver {
    @UsePermissions({
        action: AuthAction.READ_ANY,
        resource: Resource.INFO,
    })
    @ResolveField(() => String, { nullable: true })
    async kernel(): Promise<string | undefined> {
        const softwareVersions = await versions();
        return softwareVersions.kernel;
    }
}
