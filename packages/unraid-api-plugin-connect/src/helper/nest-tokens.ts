// NestJS tokens. 
// Strings & Symbols used to identify jobs, services, events, etc.

export const UPNP_RENEWAL_JOB_TOKEN = 'upnp-renewal';

export { GRAPHQL_PUBSUB_TOKEN, GRAPHQL_PUBSUB_CHANNEL } from '@unraid/shared/pubsub/graphql.pubsub.js';

export enum EVENTS {
    LOGIN = 'connect.login',
    LOGOUT = 'connect.logout',
    IDENTITY_CHANGED = 'connect.identity.changed',
    MOTHERSHIP_CONNECTION_STATUS_CHANGED = 'connect.mothership.changed',
}
