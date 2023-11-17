import { getters } from '@app/store/index';
import { Query, Resolver } from '@nestjs/graphql';
import { UseRoles } from 'nest-access-control';

@Resolver()
export class OwnerResolver {
    @Query()
    @UseRoles({
        resource: 'owner',
        action: 'read',
        possession: 'own',
    })
    public async owner() {
        const { remote } = getters.config();

        if (!remote.username) {
            return {
                username: 'root',
                avatar: '',
                url: '',
            };
        }

        return {
            username: remote.username,
            avatar: remote.avatar,
        };
    }
}
