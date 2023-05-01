import { getDockerContainers } from "@app/core/modules/index";
import { ensurePermission } from "@app/core/utils/permissions/ensure-permission";
import { type QueryResolvers } from "@app/graphql/generated/api/types";

export const dockerContainersResolver: QueryResolvers['dockerContainers'] = async (_, __, context) => {
	const { user } = context;

    // Check permissions
    ensurePermission(user, {
        resource: 'docker/container',
        action: 'read',
        possession: 'any',
    });

    return getDockerContainers();
}