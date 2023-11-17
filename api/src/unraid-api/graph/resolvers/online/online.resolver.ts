import { Query, Resolver } from '@nestjs/graphql';
import { UseRoles } from 'nest-access-control';

@Resolver()
export class OnlineResolver {
    @Query()
    @UseRoles({
        resource: 'online',
        action: 'read',
        possession: 'any',
    })
    public async online() {
        return true;
    }
}
