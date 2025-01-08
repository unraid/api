import { AuthAction } from 'nest-authz';

import { Resource, Role } from '@app/graphql/generated/api/types';

export const BASE_POLICY = `
# Admin permissions
p, ${Role.ADMIN}, *, *, *

# Connect Permissions
p, ${Role.CONNECT}, *, ${AuthAction.READ_ANY}
p, ${Role.CONNECT}, ${Resource.CONNECT__REMOTE_ACCESS}, ${AuthAction.UPDATE_ANY}

# Guest permissions
p, ${Role.GUEST}, ${Resource.ME}, ${AuthAction.READ_ANY}

# Role inheritance
g, ${Role.ADMIN}, ${Role.GUEST}
g, ${Role.CONNECT}, ${Role.GUEST}
`;
