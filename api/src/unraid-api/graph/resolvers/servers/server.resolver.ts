import { Query, Resolver } from '@nestjs/graphql';
import { getLocalServer } from '@app/graphql/schema/utils';
import { type Server } from '@app/graphql/generated/client/graphql';

@Resolver()
export class ServerResolver {
    @Query()
    public async server(): Promise<Server | null> {
        return getLocalServer()[0];
    }

    @Resolver('servers')
    @Query()
    public async servers(): Promise<Server[]> {
        return getLocalServer();
    }
}
