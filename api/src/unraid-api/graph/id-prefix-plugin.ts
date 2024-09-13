import { ApolloServerPlugin } from "@apollo/server";
import { getServerIdentifier } from "@app/core/utils/server-identifier";

const serverId = getServerIdentifier();

const updateId = (obj: any) => {
    if (obj && typeof obj === 'object') {
        if ('id' in obj && typeof obj.id === 'string') {
            obj.id = `${serverId}-${obj.id}`;
        }
        Object.values(obj).forEach((value) => updateId(value));
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
