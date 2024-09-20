import { ApolloServerPlugin } from "@apollo/server";
import { getServerIdentifier } from "@app/core/utils/server-identifier";

/**
 * Modify all ID fields in the GQL response object to include a prefix
 * @param obj GQL response object, to be modified in place
 */
const updateId = (obj: Record<string, unknown>) => {
    const serverId = getServerIdentifier();
    const stack = [obj];
    let iterations = 0;
    // Prevent infinite loops
    while (stack.length > 0 && iterations < 100) {
        const current = stack.pop();

        if (current && typeof current === 'object') {
            if ('id' in current && typeof current.id === 'string') {
                current.id = `${serverId}:${current.id}`;
            }

            for (const value of Object.values(current)) {
                if (value && typeof value === 'object') {
                    stack.push(value as Record<string, unknown>);
                }
            }
        }

        iterations++;
    }
};

export const idPrefixPlugin: ApolloServerPlugin = {
    async requestDidStart(requestContext) {
        if (requestContext.request.operationName === 'IntrospectionQuery') {
            // Don't modify the introspection query
            return;
        }
        // If ID is requested, return an ID field with an extra prefix
        return {
            async willSendResponse({ response }) {
                if (
                    response.body.kind === 'single' &&
                    response.body.singleResult.data
                ) {
                    // Iteratively update all ID fields with a prefix
                    updateId(response.body.singleResult.data);
                }
            },
        };
    },
};
