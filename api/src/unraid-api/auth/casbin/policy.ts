import { AuthAction } from 'nest-authz';

import { Resource, Role } from '@app/graphql/generated/api/types';

export const BASE_POLICY = `
# Admin permissions
p, ${Role.ADMIN}, *, *, *

# UPC permissions for API keys
p, ${Role.UPC}, ${Resource.API_KEY}, ${AuthAction.CREATE_ANY}
p, ${Role.UPC}, ${Resource.API_KEY}, ${AuthAction.UPDATE_ANY}
p, ${Role.UPC}, ${Resource.API_KEY}, ${AuthAction.READ_ANY}

# UPC permissions
p, ${Role.UPC}, ${Resource.CLOUD}, ${AuthAction.READ_ANY}
p, ${Role.UPC}, ${Resource.CONFIG}, ${AuthAction.READ_ANY}
p, ${Role.UPC}, crash-reporting-enabled, ${AuthAction.READ_ANY}
p, ${Role.UPC}, ${Resource.CUSTOMIZATIONS}, ${AuthAction.READ_ANY}
p, ${Role.UPC}, ${Resource.DISK}, ${AuthAction.READ_ANY}
p, ${Role.UPC}, ${Resource.DISPLAY}, ${AuthAction.READ_ANY}
p, ${Role.UPC}, ${Resource.FLASH}, ${AuthAction.READ_ANY}
p, ${Role.UPC}, ${Resource.INFO}, ${AuthAction.READ_ANY}
p, ${Role.UPC}, ${Resource.LOGS}, ${AuthAction.READ_ANY}
p, ${Role.UPC}, ${Resource.OS}, ${AuthAction.READ_ANY}
p, ${Role.UPC}, ${Resource.OWNER}, ${AuthAction.READ_ANY}
p, ${Role.UPC}, ${Resource.REGISTRATION}, ${AuthAction.READ_ANY}
p, ${Role.UPC}, ${Resource.SERVERS}, ${AuthAction.READ_ANY}
p, ${Role.UPC}, ${Resource.VARS}, ${AuthAction.READ_ANY}
p, ${Role.UPC}, ${Resource.CONFIG}, ${AuthAction.UPDATE_ANY}
p, ${Role.UPC}, ${Resource.CONNECT}, ${AuthAction.READ_ANY}
p, ${Role.UPC}, ${Resource.CONNECT}, ${AuthAction.UPDATE_ANY}
p, ${Role.UPC}, ${Resource.NOTIFICATIONS}, ${AuthAction.READ_ANY}
p, ${Role.UPC}, ${Resource.NOTIFICATIONS}, ${AuthAction.UPDATE_ANY}

# My Servers permissions
p, ${Role.MY_SERVERS}, ${Resource.ARRAY}, ${AuthAction.READ_ANY}
p, ${Role.MY_SERVERS}, ${Resource.CONFIG}, ${AuthAction.READ_ANY}
p, ${Role.MY_SERVERS}, ${Resource.CONNECT}, ${AuthAction.READ_ANY}
p, ${Role.MY_SERVERS}, connect/dynamic-remote-access, ${AuthAction.READ_ANY}
p, ${Role.MY_SERVERS}, connect/dynamic-remote-access, ${AuthAction.UPDATE_ANY}
p, ${Role.MY_SERVERS}, ${Resource.CUSTOMIZATIONS}, ${AuthAction.READ_ANY}
p, ${Role.MY_SERVERS}, ${Resource.DASHBOARD}, ${AuthAction.READ_ANY}
p, ${Role.MY_SERVERS}, ${Resource.DISPLAY}, ${AuthAction.READ_ANY}
p, ${Role.MY_SERVERS}, docker/container, ${AuthAction.READ_ANY}
p, ${Role.MY_SERVERS}, ${Resource.DOCKER}, ${AuthAction.READ_ANY}
p, ${Role.MY_SERVERS}, ${Resource.INFO}, ${AuthAction.READ_ANY}
p, ${Role.MY_SERVERS}, ${Resource.LOGS}, ${AuthAction.READ_ANY}
p, ${Role.MY_SERVERS}, ${Resource.NETWORK}, ${AuthAction.READ_ANY}
p, ${Role.MY_SERVERS}, ${Resource.NOTIFICATIONS}, ${AuthAction.READ_ANY}
p, ${Role.MY_SERVERS}, ${Resource.SERVICES}, ${AuthAction.READ_ANY}
p, ${Role.MY_SERVERS}, ${Resource.VARS}, ${AuthAction.READ_ANY}
p, ${Role.MY_SERVERS}, ${Resource.VMS}, ${AuthAction.READ_ANY}
p, ${Role.MY_SERVERS}, vms/domain, ${AuthAction.READ_ANY}
p, ${Role.MY_SERVERS}, unraid-version, ${AuthAction.READ_ANY}

# Notifier permissions
p, ${Role.NOTIFIER}, ${Resource.NOTIFICATIONS}, ${AuthAction.CREATE_OWN}

# Guest permissions
p, ${Role.GUEST}, ${Resource.ME}, ${AuthAction.READ_ANY}
p, ${Role.GUEST}, ${Resource.WELCOME}, ${AuthAction.READ_ANY}

# Role inheritance
g, ${Role.ADMIN}, ${Role.GUEST}
g, ${Role.UPC}, ${Role.GUEST}
g, ${Role.MY_SERVERS}, ${Role.GUEST}
g, ${Role.NOTIFIER}, ${Role.GUEST}
`;
