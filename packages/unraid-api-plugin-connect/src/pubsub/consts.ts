/**
 * Shared constants between the Unraid API and the Connect Plugin.
 *
 * These MUST match their counterparts in the Unraid API.
 *
 * This exists due to a complication in our build/release system preventing
 * us from using a shared workspace package. It will be replaced.
 */

/** PUBSUB_CHANNELS enum for the GRAPHQL_PUB_SUB event bus */
export enum PUBSUB_CHANNEL {
    SERVERS = 'servers',
    OWNER = 'owner',
}

/** The Dependency Injection token for the GRAPHQL_PUB_SUB event bus. */
export const GRAPHQL_PUB_SUB_TOKEN = 'GRAPHQL_PUB_SUB';

export enum EVENTS {
    LOGIN = 'connect.login',
    LOGOUT = 'connect.logout',
}
