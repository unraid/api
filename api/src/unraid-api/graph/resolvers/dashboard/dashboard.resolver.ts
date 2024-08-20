import { dashboardDataServer } from '@app/common/dashboard/generate-server-data';
import { Dashboard } from '@app/graphql/generated/api/types';
import { getServerIps } from '@app/graphql/resolvers/subscription/network';
import { Query, ResolveField, Resolver } from '@nestjs/graphql';
import { UseRoles } from 'nest-access-control';
import { ZodError } from 'zod';

@Resolver('Dashboard')
@UseRoles({
    resource: 'connect',
    action: 'read',
    possession: 'own',
})
export class DashboardResolver {
    @Query('serverDashboard')
    public async serverDashboard(): Promise<Dashboard> {
        console.log('Dashboard is', await dashboardDataServer());
        return await dashboardDataServer();
    }
    @ResolveField()
    public network(): Dashboard['network'] {
        const datapacket = getServerIps();
        if (datapacket.errors) {
            const zodErrors = datapacket.errors.filter(
                (error) => error instanceof ZodError
            );
            if (zodErrors.length) {
                console.warn(
                    'Validation Errors Encountered with Network Payload: %s',
                    zodErrors.map((error) => error.message).join(',')
                );
            }
        }
        const networkPacket: Dashboard['network'] = { accessUrls: datapacket.urls };

        return networkPacket;
    }
}
