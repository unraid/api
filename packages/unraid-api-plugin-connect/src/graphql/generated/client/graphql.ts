/* eslint-disable */
import type { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';

export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> =
    | T
    | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
    ID: { input: string; output: string };
    String: { input: string; output: string };
    Boolean: { input: boolean; output: boolean };
    Int: { input: number; output: number };
    Float: { input: number; output: number };
    /** A date-time string at UTC, such as 2007-12-03T10:15:30Z, compliant with the `date-time` format outlined in section 5.6 of the RFC 3339 profile of the ISO 8601 standard for representation of dates and times using the Gregorian calendar. */
    DateTime: { input: string; output: string };
    /** A field whose value is a IPv4 address: https://en.wikipedia.org/wiki/IPv4. */
    IPv4: { input: any; output: any };
    /** A field whose value is a IPv6 address: https://en.wikipedia.org/wiki/IPv6. */
    IPv6: { input: any; output: any };
    /** The `JSON` scalar type represents JSON values as specified by [ECMA-404](http://www.ecma-international.org/publications/files/ECMA-ST/ECMA-404.pdf). */
    JSON: { input: Record<string, any>; output: Record<string, any> };
    /** The `Long` scalar type represents 52-bit integers */
    Long: { input: number; output: number };
    /** A field whose value is a valid TCP port within the range of 0 to 65535: https://en.wikipedia.org/wiki/Transmission_Control_Protocol#TCP_ports */
    Port: { input: number; output: number };
    /** A field whose value conforms to the standard URL format as specified in RFC3986: https://www.ietf.org/rfc/rfc3986.txt. */
    URL: { input: URL; output: URL };
};

export type AccessUrl = {
    __typename?: 'AccessUrl';
    ipv4?: Maybe<Scalars['URL']['output']>;
    ipv6?: Maybe<Scalars['URL']['output']>;
    name?: Maybe<Scalars['String']['output']>;
    type: UrlType;
};

export type AccessUrlInput = {
    ipv4?: InputMaybe<Scalars['URL']['input']>;
    ipv6?: InputMaybe<Scalars['URL']['input']>;
    name?: InputMaybe<Scalars['String']['input']>;
    type: UrlType;
};

export type ArrayCapacity = {
    __typename?: 'ArrayCapacity';
    bytes?: Maybe<ArrayCapacityBytes>;
};

export type ArrayCapacityBytes = {
    __typename?: 'ArrayCapacityBytes';
    free?: Maybe<Scalars['Long']['output']>;
    total?: Maybe<Scalars['Long']['output']>;
    used?: Maybe<Scalars['Long']['output']>;
};

export type ArrayCapacityBytesInput = {
    free?: InputMaybe<Scalars['Long']['input']>;
    total?: InputMaybe<Scalars['Long']['input']>;
    used?: InputMaybe<Scalars['Long']['input']>;
};

export type ArrayCapacityInput = {
    bytes?: InputMaybe<ArrayCapacityBytesInput>;
};

export type ClientConnectedEvent = {
    __typename?: 'ClientConnectedEvent';
    data: ClientConnectionEventData;
    type: EventType;
};

export type ClientConnectionEventData = {
    __typename?: 'ClientConnectionEventData';
    apiKey: Scalars['String']['output'];
    type: ClientType;
    version: Scalars['String']['output'];
};

export type ClientDisconnectedEvent = {
    __typename?: 'ClientDisconnectedEvent';
    data: ClientConnectionEventData;
    type: EventType;
};

export type ClientPingEvent = {
    __typename?: 'ClientPingEvent';
    data: PingEventData;
    type: EventType;
};

export enum ClientType {
    API = 'API',
    DASHBOARD = 'DASHBOARD',
}

export type Config = {
    __typename?: 'Config';
    error?: Maybe<ConfigErrorState>;
    valid?: Maybe<Scalars['Boolean']['output']>;
};

export enum ConfigErrorState {
    INVALID = 'INVALID',
    NO_KEY_SERVER = 'NO_KEY_SERVER',
    UNKNOWN_ERROR = 'UNKNOWN_ERROR',
    WITHDRAWN = 'WITHDRAWN',
}

export type Dashboard = {
    __typename?: 'Dashboard';
    apps?: Maybe<DashboardApps>;
    array?: Maybe<DashboardArray>;
    config?: Maybe<DashboardConfig>;
    display?: Maybe<DashboardDisplay>;
    id: Scalars['ID']['output'];
    lastPublish?: Maybe<Scalars['DateTime']['output']>;
    network?: Maybe<Network>;
    online?: Maybe<Scalars['Boolean']['output']>;
    os?: Maybe<DashboardOs>;
    services?: Maybe<Array<Maybe<DashboardService>>>;
    twoFactor?: Maybe<DashboardTwoFactor>;
    vars?: Maybe<DashboardVars>;
    versions?: Maybe<DashboardVersions>;
    vms?: Maybe<DashboardVms>;
};

export type DashboardApps = {
    __typename?: 'DashboardApps';
    installed?: Maybe<Scalars['Int']['output']>;
    started?: Maybe<Scalars['Int']['output']>;
};

export type DashboardAppsInput = {
    installed: Scalars['Int']['input'];
    started: Scalars['Int']['input'];
};

export type DashboardArray = {
    __typename?: 'DashboardArray';
    /** Current array capacity */
    capacity?: Maybe<ArrayCapacity>;
    /** Current array state */
    state?: Maybe<Scalars['String']['output']>;
};

export type DashboardArrayInput = {
    /** Current array capacity */
    capacity: ArrayCapacityInput;
    /** Current array state */
    state: Scalars['String']['input'];
};

export type DashboardCase = {
    __typename?: 'DashboardCase';
    base64?: Maybe<Scalars['String']['output']>;
    error?: Maybe<Scalars['String']['output']>;
    icon?: Maybe<Scalars['String']['output']>;
    url?: Maybe<Scalars['String']['output']>;
};

export type DashboardCaseInput = {
    base64: Scalars['String']['input'];
    error?: InputMaybe<Scalars['String']['input']>;
    icon: Scalars['String']['input'];
    url: Scalars['String']['input'];
};

export type DashboardConfig = {
    __typename?: 'DashboardConfig';
    error?: Maybe<Scalars['String']['output']>;
    valid?: Maybe<Scalars['Boolean']['output']>;
};

export type DashboardConfigInput = {
    error?: InputMaybe<Scalars['String']['input']>;
    valid: Scalars['Boolean']['input'];
};

export type DashboardDisplay = {
    __typename?: 'DashboardDisplay';
    case?: Maybe<DashboardCase>;
};

export type DashboardDisplayInput = {
    case: DashboardCaseInput;
};

export type DashboardInput = {
    apps: DashboardAppsInput;
    array: DashboardArrayInput;
    config: DashboardConfigInput;
    display: DashboardDisplayInput;
    os: DashboardOsInput;
    services: Array<DashboardServiceInput>;
    twoFactor?: InputMaybe<DashboardTwoFactorInput>;
    vars: DashboardVarsInput;
    versions: DashboardVersionsInput;
    vms: DashboardVmsInput;
};

export type DashboardOs = {
    __typename?: 'DashboardOs';
    hostname?: Maybe<Scalars['String']['output']>;
    uptime?: Maybe<Scalars['DateTime']['output']>;
};

export type DashboardOsInput = {
    hostname: Scalars['String']['input'];
    uptime: Scalars['DateTime']['input'];
};

export type DashboardService = {
    __typename?: 'DashboardService';
    name?: Maybe<Scalars['String']['output']>;
    online?: Maybe<Scalars['Boolean']['output']>;
    uptime?: Maybe<DashboardServiceUptime>;
    version?: Maybe<Scalars['String']['output']>;
};

export type DashboardServiceInput = {
    name: Scalars['String']['input'];
    online: Scalars['Boolean']['input'];
    uptime?: InputMaybe<DashboardServiceUptimeInput>;
    version: Scalars['String']['input'];
};

export type DashboardServiceUptime = {
    __typename?: 'DashboardServiceUptime';
    timestamp?: Maybe<Scalars['DateTime']['output']>;
};

export type DashboardServiceUptimeInput = {
    timestamp: Scalars['DateTime']['input'];
};

export type DashboardTwoFactor = {
    __typename?: 'DashboardTwoFactor';
    local?: Maybe<DashboardTwoFactorLocal>;
    remote?: Maybe<DashboardTwoFactorRemote>;
};

export type DashboardTwoFactorInput = {
    local: DashboardTwoFactorLocalInput;
    remote: DashboardTwoFactorRemoteInput;
};

export type DashboardTwoFactorLocal = {
    __typename?: 'DashboardTwoFactorLocal';
    enabled?: Maybe<Scalars['Boolean']['output']>;
};

export type DashboardTwoFactorLocalInput = {
    enabled: Scalars['Boolean']['input'];
};

export type DashboardTwoFactorRemote = {
    __typename?: 'DashboardTwoFactorRemote';
    enabled?: Maybe<Scalars['Boolean']['output']>;
};

export type DashboardTwoFactorRemoteInput = {
    enabled: Scalars['Boolean']['input'];
};

export type DashboardVars = {
    __typename?: 'DashboardVars';
    flashGuid?: Maybe<Scalars['String']['output']>;
    regState?: Maybe<Scalars['String']['output']>;
    regTy?: Maybe<Scalars['String']['output']>;
    serverDescription?: Maybe<Scalars['String']['output']>;
    serverName?: Maybe<Scalars['String']['output']>;
};

export type DashboardVarsInput = {
    flashGuid: Scalars['String']['input'];
    regState: Scalars['String']['input'];
    regTy: Scalars['String']['input'];
    /**  Server description  */
    serverDescription?: InputMaybe<Scalars['String']['input']>;
    /**  Name of the server  */
    serverName?: InputMaybe<Scalars['String']['input']>;
};

export type DashboardVersions = {
    __typename?: 'DashboardVersions';
    unraid?: Maybe<Scalars['String']['output']>;
};

export type DashboardVersionsInput = {
    unraid: Scalars['String']['input'];
};

export type DashboardVms = {
    __typename?: 'DashboardVms';
    installed?: Maybe<Scalars['Int']['output']>;
    started?: Maybe<Scalars['Int']['output']>;
};

export type DashboardVmsInput = {
    installed: Scalars['Int']['input'];
    started: Scalars['Int']['input'];
};

export type Event =
    | ClientConnectedEvent
    | ClientDisconnectedEvent
    | ClientPingEvent
    | RemoteAccessEvent
    | RemoteGraphQlEvent
    | UpdateEvent;

export enum EventType {
    CLIENT_CONNECTED_EVENT = 'CLIENT_CONNECTED_EVENT',
    CLIENT_DISCONNECTED_EVENT = 'CLIENT_DISCONNECTED_EVENT',
    CLIENT_PING_EVENT = 'CLIENT_PING_EVENT',
    REMOTE_ACCESS_EVENT = 'REMOTE_ACCESS_EVENT',
    REMOTE_GRAPHQL_EVENT = 'REMOTE_GRAPHQL_EVENT',
    UPDATE_EVENT = 'UPDATE_EVENT',
}

export type FullServerDetails = {
    __typename?: 'FullServerDetails';
    apiConnectedCount?: Maybe<Scalars['Int']['output']>;
    apiVersion?: Maybe<Scalars['String']['output']>;
    connectionTimestamp?: Maybe<Scalars['String']['output']>;
    dashboard?: Maybe<Dashboard>;
    lastPublish?: Maybe<Scalars['String']['output']>;
    network?: Maybe<Network>;
    online?: Maybe<Scalars['Boolean']['output']>;
};

export enum Importance {
    ALERT = 'ALERT',
    INFO = 'INFO',
    WARNING = 'WARNING',
}

export type KsServerDetails = {
    __typename?: 'KsServerDetails';
    accessLabel: Scalars['String']['output'];
    accessUrl: Scalars['String']['output'];
    apiKey?: Maybe<Scalars['String']['output']>;
    description: Scalars['String']['output'];
    dnsHash: Scalars['String']['output'];
    flashBackupDate?: Maybe<Scalars['Int']['output']>;
    flashBackupUrl: Scalars['String']['output'];
    flashProduct: Scalars['String']['output'];
    flashVendor: Scalars['String']['output'];
    guid: Scalars['String']['output'];
    ipsId?: Maybe<Scalars['String']['output']>;
    keyType?: Maybe<Scalars['String']['output']>;
    licenseKey: Scalars['String']['output'];
    name: Scalars['String']['output'];
    plgVersion?: Maybe<Scalars['String']['output']>;
    signedIn: Scalars['Boolean']['output'];
};

export type LegacyService = {
    __typename?: 'LegacyService';
    name?: Maybe<Scalars['String']['output']>;
    online?: Maybe<Scalars['Boolean']['output']>;
    uptime?: Maybe<Scalars['Int']['output']>;
    version?: Maybe<Scalars['String']['output']>;
};

export type Mutation = {
    __typename?: 'Mutation';
    remoteGraphQLResponse: Scalars['Boolean']['output'];
    remoteMutation: Scalars['String']['output'];
    remoteSession?: Maybe<Scalars['Boolean']['output']>;
    sendNotification?: Maybe<Notification>;
    sendPing?: Maybe<Scalars['Boolean']['output']>;
    updateDashboard: Dashboard;
    updateNetwork: Network;
};

export type MutationRemoteGraphQlResponseArgs = {
    input: RemoteGraphQlServerInput;
};

export type MutationRemoteMutationArgs = {
    input: RemoteGraphQlClientInput;
};

export type MutationRemoteSessionArgs = {
    remoteAccess: RemoteAccessInput;
};

export type MutationSendNotificationArgs = {
    notification: NotificationInput;
};

export type MutationUpdateDashboardArgs = {
    data: DashboardInput;
};

export type MutationUpdateNetworkArgs = {
    data: NetworkInput;
};

export type Network = {
    __typename?: 'Network';
    accessUrls?: Maybe<Array<AccessUrl>>;
};

export type NetworkInput = {
    accessUrls: Array<AccessUrlInput>;
};

export type Notification = {
    __typename?: 'Notification';
    description?: Maybe<Scalars['String']['output']>;
    importance?: Maybe<Importance>;
    link?: Maybe<Scalars['String']['output']>;
    status: NotificationStatus;
    subject?: Maybe<Scalars['String']['output']>;
    title?: Maybe<Scalars['String']['output']>;
};

export type NotificationInput = {
    description?: InputMaybe<Scalars['String']['input']>;
    importance: Importance;
    link?: InputMaybe<Scalars['String']['input']>;
    subject?: InputMaybe<Scalars['String']['input']>;
    title?: InputMaybe<Scalars['String']['input']>;
};

export enum NotificationStatus {
    FAILED_TO_SEND = 'FAILED_TO_SEND',
    NOT_FOUND = 'NOT_FOUND',
    PENDING = 'PENDING',
    SENT = 'SENT',
}

export type PingEvent = {
    __typename?: 'PingEvent';
    data?: Maybe<Scalars['String']['output']>;
    type: EventType;
};

export type PingEventData = {
    __typename?: 'PingEventData';
    source: PingEventSource;
};

export enum PingEventSource {
    API = 'API',
    MOTHERSHIP = 'MOTHERSHIP',
}

export type ProfileModel = {
    __typename?: 'ProfileModel';
    avatar?: Maybe<Scalars['String']['output']>;
    cognito_id?: Maybe<Scalars['String']['output']>;
    url?: Maybe<Scalars['String']['output']>;
    userId?: Maybe<Scalars['ID']['output']>;
    username?: Maybe<Scalars['String']['output']>;
};

export type Query = {
    __typename?: 'Query';
    apiVersion?: Maybe<Scalars['String']['output']>;
    dashboard?: Maybe<Dashboard>;
    ksServers: Array<KsServerDetails>;
    online?: Maybe<Scalars['Boolean']['output']>;
    remoteQuery: Scalars['String']['output'];
    serverStatus: ServerStatusResponse;
    servers: Array<Maybe<Server>>;
    status?: Maybe<ServerStatus>;
};

export type QueryDashboardArgs = {
    id: Scalars['String']['input'];
};

export type QueryRemoteQueryArgs = {
    input: RemoteGraphQlClientInput;
};

export type QueryServerStatusArgs = {
    apiKey: Scalars['String']['input'];
};

export enum RegistrationState {
    /** Basic */
    BASIC = 'BASIC',
    /** BLACKLISTED */
    EBLACKLISTED = 'EBLACKLISTED',
    /** BLACKLISTED */
    EBLACKLISTED1 = 'EBLACKLISTED1',
    /** BLACKLISTED */
    EBLACKLISTED2 = 'EBLACKLISTED2',
    /** Trial Expired */
    EEXPIRED = 'EEXPIRED',
    /** GUID Error */
    EGUID = 'EGUID',
    /** Multiple License Keys Present */
    EGUID1 = 'EGUID1',
    /** Trial Requires Internet Connection */
    ENOCONN = 'ENOCONN',
    /** No Flash */
    ENOFLASH = 'ENOFLASH',
    ENOFLASH1 = 'ENOFLASH1',
    ENOFLASH2 = 'ENOFLASH2',
    ENOFLASH3 = 'ENOFLASH3',
    ENOFLASH4 = 'ENOFLASH4',
    ENOFLASH5 = 'ENOFLASH5',
    ENOFLASH6 = 'ENOFLASH6',
    ENOFLASH7 = 'ENOFLASH7',
    /** No Keyfile */
    ENOKEYFILE = 'ENOKEYFILE',
    /** No Keyfile */
    ENOKEYFILE1 = 'ENOKEYFILE1',
    /** Missing key file */
    ENOKEYFILE2 = 'ENOKEYFILE2',
    /** Invalid installation */
    ETRIAL = 'ETRIAL',
    /** Plus */
    PLUS = 'PLUS',
    /** Pro */
    PRO = 'PRO',
    /** Trial */
    TRIAL = 'TRIAL',
}

export type RemoteAccessEvent = {
    __typename?: 'RemoteAccessEvent';
    data: RemoteAccessEventData;
    type: EventType;
};

/** Defines whether remote access event is the initiation (from connect) or the response (from the server) */
export enum RemoteAccessEventActionType {
    ACK = 'ACK',
    END = 'END',
    INIT = 'INIT',
    PING = 'PING',
}

export type RemoteAccessEventData = {
    __typename?: 'RemoteAccessEventData';
    apiKey: Scalars['String']['output'];
    type: RemoteAccessEventActionType;
    url?: Maybe<AccessUrl>;
};

export type RemoteAccessInput = {
    apiKey: Scalars['String']['input'];
    type: RemoteAccessEventActionType;
    url?: InputMaybe<AccessUrlInput>;
};

export type RemoteGraphQlClientInput = {
    apiKey: Scalars['String']['input'];
    body: Scalars['String']['input'];
    /** Time in milliseconds to wait for a response from the remote server (defaults to 15000) */
    timeout?: InputMaybe<Scalars['Int']['input']>;
    /** How long mothership should cache the result of this query in seconds, only valid on queries */
    ttl?: InputMaybe<Scalars['Int']['input']>;
};

export type RemoteGraphQlEvent = {
    __typename?: 'RemoteGraphQLEvent';
    data: RemoteGraphQlEventData;
    type: EventType;
};

export type RemoteGraphQlEventData = {
    __typename?: 'RemoteGraphQLEventData';
    /** Contains mutation / subscription / query data in the form of body: JSON, variables: JSON */
    body: Scalars['String']['output'];
    /** sha256 hash of the body */
    sha256: Scalars['String']['output'];
    type: RemoteGraphQlEventType;
};

export enum RemoteGraphQlEventType {
    REMOTE_MUTATION_EVENT = 'REMOTE_MUTATION_EVENT',
    REMOTE_QUERY_EVENT = 'REMOTE_QUERY_EVENT',
    REMOTE_SUBSCRIPTION_EVENT = 'REMOTE_SUBSCRIPTION_EVENT',
    REMOTE_SUBSCRIPTION_EVENT_PING = 'REMOTE_SUBSCRIPTION_EVENT_PING',
}

export type RemoteGraphQlServerInput = {
    /** Body - contains an object containing data: (GQL response data) or errors: (GQL Errors) */
    body: Scalars['String']['input'];
    /** sha256 hash of the body */
    sha256: Scalars['String']['input'];
    type: RemoteGraphQlEventType;
};

export type Server = {
    __typename?: 'Server';
    apikey?: Maybe<Scalars['String']['output']>;
    guid?: Maybe<Scalars['String']['output']>;
    lanip?: Maybe<Scalars['String']['output']>;
    localurl?: Maybe<Scalars['String']['output']>;
    name?: Maybe<Scalars['String']['output']>;
    owner?: Maybe<ProfileModel>;
    remoteurl?: Maybe<Scalars['String']['output']>;
    status?: Maybe<ServerStatus>;
    wanip?: Maybe<Scalars['String']['output']>;
};

/**  Defines server fields that have a TTL on them, for example last ping  */
export type ServerFieldsWithTtl = {
    __typename?: 'ServerFieldsWithTtl';
    lastPing?: Maybe<Scalars['String']['output']>;
};

export type ServerModel = {
    apikey: Scalars['String']['output'];
    guid: Scalars['String']['output'];
    lanip: Scalars['String']['output'];
    localurl: Scalars['String']['output'];
    name: Scalars['String']['output'];
    remoteurl: Scalars['String']['output'];
    wanip: Scalars['String']['output'];
};

export enum ServerStatus {
    NEVER_CONNECTED = 'never_connected',
    OFFLINE = 'offline',
    ONLINE = 'online',
}

export type ServerStatusResponse = {
    __typename?: 'ServerStatusResponse';
    id: Scalars['ID']['output'];
    lastPublish?: Maybe<Scalars['String']['output']>;
    online: Scalars['Boolean']['output'];
};

export type Service = {
    __typename?: 'Service';
    name?: Maybe<Scalars['String']['output']>;
    online?: Maybe<Scalars['Boolean']['output']>;
    uptime?: Maybe<Uptime>;
    version?: Maybe<Scalars['String']['output']>;
};

export type Subscription = {
    __typename?: 'Subscription';
    events?: Maybe<Array<Event>>;
    remoteSubscription: Scalars['String']['output'];
    servers: Array<Server>;
};

export type SubscriptionRemoteSubscriptionArgs = {
    input: RemoteGraphQlClientInput;
};

export type TwoFactorLocal = {
    __typename?: 'TwoFactorLocal';
    enabled?: Maybe<Scalars['Boolean']['output']>;
};

export type TwoFactorRemote = {
    __typename?: 'TwoFactorRemote';
    enabled?: Maybe<Scalars['Boolean']['output']>;
};

export type TwoFactorWithToken = {
    __typename?: 'TwoFactorWithToken';
    local?: Maybe<TwoFactorLocal>;
    remote?: Maybe<TwoFactorRemote>;
    token?: Maybe<Scalars['String']['output']>;
};

export type TwoFactorWithoutToken = {
    __typename?: 'TwoFactorWithoutToken';
    local?: Maybe<TwoFactorLocal>;
    remote?: Maybe<TwoFactorRemote>;
};

export enum UrlType {
    DEFAULT = 'DEFAULT',
    LAN = 'LAN',
    MDNS = 'MDNS',
    WAN = 'WAN',
    WIREGUARD = 'WIREGUARD',
}

export type UpdateEvent = {
    __typename?: 'UpdateEvent';
    data: UpdateEventData;
    type: EventType;
};

export type UpdateEventData = {
    __typename?: 'UpdateEventData';
    apiKey: Scalars['String']['output'];
    type: UpdateType;
};

export enum UpdateType {
    DASHBOARD = 'DASHBOARD',
    NETWORK = 'NETWORK',
}

export type Uptime = {
    __typename?: 'Uptime';
    timestamp?: Maybe<Scalars['String']['output']>;
};

export type UserProfileModelWithServers = {
    __typename?: 'UserProfileModelWithServers';
    profile: ProfileModel;
    servers: Array<Server>;
};

export type Vars = {
    __typename?: 'Vars';
    expireTime?: Maybe<Scalars['DateTime']['output']>;
    flashGuid?: Maybe<Scalars['String']['output']>;
    regState?: Maybe<RegistrationState>;
    regTm2?: Maybe<Scalars['String']['output']>;
    regTy?: Maybe<Scalars['String']['output']>;
};

export type RemoteGraphQlEventFragmentFragment = {
    __typename?: 'RemoteGraphQLEvent';
    remoteGraphQLEventData: {
        __typename?: 'RemoteGraphQLEventData';
        type: RemoteGraphQlEventType;
        body: string;
        sha256: string;
    };
} & { ' $fragmentName'?: 'RemoteGraphQlEventFragmentFragment' };

export type EventsSubscriptionVariables = Exact<{ [key: string]: never }>;

export type EventsSubscription = {
    __typename?: 'Subscription';
    events?: Array<
        | {
              __typename: 'ClientConnectedEvent';
              connectedEvent: EventType;
              connectedData: {
                  __typename?: 'ClientConnectionEventData';
                  type: ClientType;
                  version: string;
                  apiKey: string;
              };
          }
        | {
              __typename: 'ClientDisconnectedEvent';
              disconnectedEvent: EventType;
              disconnectedData: {
                  __typename?: 'ClientConnectionEventData';
                  type: ClientType;
                  version: string;
                  apiKey: string;
              };
          }
        | { __typename: 'ClientPingEvent' }
        | { __typename: 'RemoteAccessEvent' }
        | ({ __typename: 'RemoteGraphQLEvent' } & {
              ' $fragmentRefs'?: {
                  RemoteGraphQlEventFragmentFragment: RemoteGraphQlEventFragmentFragment;
              };
          })
        | { __typename: 'UpdateEvent' }
    > | null;
};

export type SendRemoteGraphQlResponseMutationVariables = Exact<{
    input: RemoteGraphQlServerInput;
}>;

export type SendRemoteGraphQlResponseMutation = {
    __typename?: 'Mutation';
    remoteGraphQLResponse: boolean;
};

export const RemoteGraphQlEventFragmentFragmentDoc = {
    kind: 'Document',
    definitions: [
        {
            kind: 'FragmentDefinition',
            name: { kind: 'Name', value: 'RemoteGraphQLEventFragment' },
            typeCondition: { kind: 'NamedType', name: { kind: 'Name', value: 'RemoteGraphQLEvent' } },
            selectionSet: {
                kind: 'SelectionSet',
                selections: [
                    {
                        kind: 'Field',
                        alias: { kind: 'Name', value: 'remoteGraphQLEventData' },
                        name: { kind: 'Name', value: 'data' },
                        selectionSet: {
                            kind: 'SelectionSet',
                            selections: [
                                { kind: 'Field', name: { kind: 'Name', value: 'type' } },
                                { kind: 'Field', name: { kind: 'Name', value: 'body' } },
                                { kind: 'Field', name: { kind: 'Name', value: 'sha256' } },
                            ],
                        },
                    },
                ],
            },
        },
    ],
} as unknown as DocumentNode<RemoteGraphQlEventFragmentFragment, unknown>;
export const EventsDocument = {
    kind: 'Document',
    definitions: [
        {
            kind: 'OperationDefinition',
            operation: 'subscription',
            name: { kind: 'Name', value: 'events' },
            selectionSet: {
                kind: 'SelectionSet',
                selections: [
                    {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'events' },
                        selectionSet: {
                            kind: 'SelectionSet',
                            selections: [
                                { kind: 'Field', name: { kind: 'Name', value: '__typename' } },
                                {
                                    kind: 'InlineFragment',
                                    typeCondition: {
                                        kind: 'NamedType',
                                        name: { kind: 'Name', value: 'ClientConnectedEvent' },
                                    },
                                    selectionSet: {
                                        kind: 'SelectionSet',
                                        selections: [
                                            {
                                                kind: 'Field',
                                                alias: { kind: 'Name', value: 'connectedData' },
                                                name: { kind: 'Name', value: 'data' },
                                                selectionSet: {
                                                    kind: 'SelectionSet',
                                                    selections: [
                                                        {
                                                            kind: 'Field',
                                                            name: { kind: 'Name', value: 'type' },
                                                        },
                                                        {
                                                            kind: 'Field',
                                                            name: { kind: 'Name', value: 'version' },
                                                        },
                                                        {
                                                            kind: 'Field',
                                                            name: { kind: 'Name', value: 'apiKey' },
                                                        },
                                                    ],
                                                },
                                            },
                                            {
                                                kind: 'Field',
                                                alias: { kind: 'Name', value: 'connectedEvent' },
                                                name: { kind: 'Name', value: 'type' },
                                            },
                                        ],
                                    },
                                },
                                {
                                    kind: 'InlineFragment',
                                    typeCondition: {
                                        kind: 'NamedType',
                                        name: { kind: 'Name', value: 'ClientDisconnectedEvent' },
                                    },
                                    selectionSet: {
                                        kind: 'SelectionSet',
                                        selections: [
                                            {
                                                kind: 'Field',
                                                alias: { kind: 'Name', value: 'disconnectedData' },
                                                name: { kind: 'Name', value: 'data' },
                                                selectionSet: {
                                                    kind: 'SelectionSet',
                                                    selections: [
                                                        {
                                                            kind: 'Field',
                                                            name: { kind: 'Name', value: 'type' },
                                                        },
                                                        {
                                                            kind: 'Field',
                                                            name: { kind: 'Name', value: 'version' },
                                                        },
                                                        {
                                                            kind: 'Field',
                                                            name: { kind: 'Name', value: 'apiKey' },
                                                        },
                                                    ],
                                                },
                                            },
                                            {
                                                kind: 'Field',
                                                alias: { kind: 'Name', value: 'disconnectedEvent' },
                                                name: { kind: 'Name', value: 'type' },
                                            },
                                        ],
                                    },
                                },
                                {
                                    kind: 'FragmentSpread',
                                    name: { kind: 'Name', value: 'RemoteGraphQLEventFragment' },
                                },
                            ],
                        },
                    },
                ],
            },
        },
        {
            kind: 'FragmentDefinition',
            name: { kind: 'Name', value: 'RemoteGraphQLEventFragment' },
            typeCondition: { kind: 'NamedType', name: { kind: 'Name', value: 'RemoteGraphQLEvent' } },
            selectionSet: {
                kind: 'SelectionSet',
                selections: [
                    {
                        kind: 'Field',
                        alias: { kind: 'Name', value: 'remoteGraphQLEventData' },
                        name: { kind: 'Name', value: 'data' },
                        selectionSet: {
                            kind: 'SelectionSet',
                            selections: [
                                { kind: 'Field', name: { kind: 'Name', value: 'type' } },
                                { kind: 'Field', name: { kind: 'Name', value: 'body' } },
                                { kind: 'Field', name: { kind: 'Name', value: 'sha256' } },
                            ],
                        },
                    },
                ],
            },
        },
    ],
} as unknown as DocumentNode<EventsSubscription, EventsSubscriptionVariables>;
export const SendRemoteGraphQlResponseDocument = {
    kind: 'Document',
    definitions: [
        {
            kind: 'OperationDefinition',
            operation: 'mutation',
            name: { kind: 'Name', value: 'sendRemoteGraphQLResponse' },
            variableDefinitions: [
                {
                    kind: 'VariableDefinition',
                    variable: { kind: 'Variable', name: { kind: 'Name', value: 'input' } },
                    type: {
                        kind: 'NonNullType',
                        type: {
                            kind: 'NamedType',
                            name: { kind: 'Name', value: 'RemoteGraphQLServerInput' },
                        },
                    },
                },
            ],
            selectionSet: {
                kind: 'SelectionSet',
                selections: [
                    {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'remoteGraphQLResponse' },
                        arguments: [
                            {
                                kind: 'Argument',
                                name: { kind: 'Name', value: 'input' },
                                value: { kind: 'Variable', name: { kind: 'Name', value: 'input' } },
                            },
                        ],
                    },
                ],
            },
        },
    ],
} as unknown as DocumentNode<
    SendRemoteGraphQlResponseMutation,
    SendRemoteGraphQlResponseMutationVariables
>;
