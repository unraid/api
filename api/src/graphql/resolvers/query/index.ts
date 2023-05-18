import { getArray } from '@app/core/modules/get-array';
import { type QueryResolvers } from '@app/graphql/generated/api/types';
import cloud from '@app/graphql/resolvers/query/cloud';
import { config } from '@app/graphql/resolvers/query/config';
import crashReportingEnabled from '@app/graphql/resolvers/query/crash-reporting-enabled';
import { disksResolver } from '@app/graphql/resolvers/query/disks';
import display from '@app/graphql/resolvers/query/display';
import { dockerContainersResolver } from '@app/graphql/resolvers/query/docker';
import flash from '@app/graphql/resolvers/query/flash';
import { notificationsResolver } from '@app/graphql/resolvers/query/notifications';
import online from '@app/graphql/resolvers/query/online';
import owner from '@app/graphql/resolvers/query/owner';
import { registration } from '@app/graphql/resolvers/query/registration';
import { server } from '@app/graphql/resolvers/query/server';
import { servers } from '@app/graphql/resolvers/query/servers';
import twoFactor from '@app/graphql/resolvers/query/two-factor';
import { vmsResolver } from '@app/graphql/resolvers/query/vms';

export const Query: QueryResolvers = {
    array: getArray,
    cloud,
    config,
    crashReportingEnabled,
    disks: disksResolver,
    dockerContainers: dockerContainersResolver,
    display,
    flash,
    notifications: notificationsResolver,
    online,
    owner,
    registration,
    server,
    servers,
    twoFactor,
    vms: vmsResolver,
    info() {
        // Returns an empty object because the subfield resolvers live at the root (allows for partial fetching)
        return {};
    },
};
