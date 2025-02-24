import { type ApolloServerPlugin } from '@apollo/server';

import { getServerIdentifier } from '@app/core/utils/server-identifier.js';
import { updateObject } from '@app/utils.js';

type ObjectModifier = (obj: object) => void;

/**
 * Returns a function that takes an object and updates any 'id' properties to
 * include the given serverId as a prefix.
 *
 * e.g. If the object is { id: '1234' }, the returned function will update it to
 * { id: '<serverId>:1234' }.
 *
 * @param serverId - The server identifier to use as the prefix.
 * @returns A function that takes an object and updates any 'id' properties with the given serverId.
 */
function prefixWithServerId(serverId: string): ObjectModifier {
    return (currentObj) => {
        if ('id' in currentObj && typeof currentObj.id === 'string') {
            currentObj.id = `${serverId}:${currentObj.id}`;
        }
    };
}

/**
 * Takes an object and removes any server prefix from the 'id' property.
 *
 * e.g. If the object is { id: '<serverId>:1234' }, the returned function will update it to
 * { id: '1234' }.
 *
 * @param current - The object to update. If it has an 'id' property that is a string and
 *                  has a server prefix, the prefix is removed.
 */
const stripServerPrefixFromIds: ObjectModifier = (current) => {
    if ('id' in current && typeof current.id === 'string') {
        const parts = current.id.split(':');
        // if there are more or less than 2 parts to the split,
        // assume there is no server prefix and don't touch it.
        if (parts.length === 2) {
            current.id = parts[1];
        }
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
            async didResolveOperation({ request }) {
                if (request.variables) {
                    updateObject(request.variables, stripServerPrefixFromIds);
                }
            },
            async willSendResponse({ response }) {
                if (response.body.kind === 'single' && response.body.singleResult.data) {
                    const serverId = getServerIdentifier();
                    updateObject(response.body.singleResult.data, prefixWithServerId(serverId));
                }
            },
        };
    },
};
