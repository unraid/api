import { getDisks } from '@app/core/modules/get-disks';
import { Query, Resolver } from '@nestjs/graphql';
import { UseRoles } from 'nest-access-control';

@Resolver('Disks')
export class DisksResolver {
    @Query()
    @UseRoles({
        resource: 'disks',
        action: 'read',
        possession: 'own',
    })
    public async disks() {
        const disks = await getDisks({
            temperature: true,
        });
        return disks;
    }
}
