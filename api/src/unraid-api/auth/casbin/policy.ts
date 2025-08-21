import { Resource, Role } from '@unraid/shared/graphql.model.js';
import { AuthAction } from 'nest-authz';

// Generate VIEWER permissions for all resources except API_KEY
const viewerPermissions = Object.values(Resource)
    .filter((resource) => resource !== Resource.API_KEY)
    .map((resource) => `p, ${Role.VIEWER}, ${resource}, ${AuthAction.READ_ANY}`)
    .join('\n');

export const BASE_POLICY = `
# Admin permissions - full access
p, ${Role.ADMIN}, *, *

# Connect permissions - read all, manage remote access
p, ${Role.CONNECT}, *, ${AuthAction.READ_ANY}
p, ${Role.CONNECT}, ${Resource.CONNECT__REMOTE_ACCESS}, ${AuthAction.UPDATE_ANY}

# Guest permissions - basic profile access
p, ${Role.GUEST}, ${Resource.ME}, ${AuthAction.READ_ANY}

# Viewer permissions - read-only access to all resources except API_KEY
${viewerPermissions}

# Role inheritance
g, ${Role.ADMIN}, ${Role.GUEST}
g, ${Role.CONNECT}, ${Role.GUEST}
g, ${Role.VIEWER}, ${Role.GUEST}
`;
