import { ResolveField, Resolver } from '@nestjs/graphql';

import { versions } from 'systeminformation';

import { CoreVersions } from '@app/unraid-api/graph/resolvers/info/versions/versions.model.js';

@Resolver(() => CoreVersions)
export class CoreVersionsResolver {
    @ResolveField(() => String, { nullable: true })
    async kernel(): Promise<string | undefined> {
        const softwareVersions = await versions();
        return softwareVersions.kernel;
    }
}
