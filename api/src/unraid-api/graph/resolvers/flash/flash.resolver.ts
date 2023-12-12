import { getters } from '@app/store/index';
import { Query, Resolver } from '@nestjs/graphql';
import { UseRoles } from 'nest-access-control';

@Resolver()
export class FlashResolver {
    @Query()
    @UseRoles({
        resource: 'flash',
        action: 'read',
        possession: 'own',
    })
    public async flash() {
        const emhttp = getters.emhttp();

        return {
            guid: emhttp.var.flashGuid,
            vendor: emhttp.var.flashVendor,
            product: emhttp.var.flashProduct,
        };
    }
}
