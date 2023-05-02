/* eslint-disable */
import type { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: string;
  String: string;
  Boolean: boolean;
  Int: number;
  Float: number;
  /** A date-time string at UTC, such as 2007-12-03T10:15:30Z, compliant with the `date-time` format outlined in section 5.6 of the RFC 3339 profile of the ISO 8601 standard for representation of dates and times using the Gregorian calendar. */
  DateTime: string;
  /** A field whose value is a IPv4 address: https://en.wikipedia.org/wiki/IPv4. */
  IPv4: any;
  /** A field whose value is a IPv6 address: https://en.wikipedia.org/wiki/IPv6. */
  IPv6: any;
  /** The `JSON` scalar type represents JSON values as specified by [ECMA-404](http://www.ecma-international.org/publications/files/ECMA-ST/ECMA-404.pdf). */
  JSON: { [key: string]: any };
  /** The `Long` scalar type represents 52-bit integers */
  Long: number;
  /** A field whose value is a valid TCP port within the range of 0 to 65535: https://en.wikipedia.org/wiki/Transmission_Control_Protocol#TCP_ports */
  Port: number;
  /** A field whose value conforms to the standard URL format as specified in RFC3986: https://www.ietf.org/rfc/rfc3986.txt. */
  URL: URL;
};

export type AccessUrl = {
  __typename?: 'AccessUrl';
  ipv4?: Maybe<Scalars['URL']>;
  ipv6?: Maybe<Scalars['URL']>;
  name?: Maybe<Scalars['String']>;
  type: URL_TYPE;
};

export type AccessUrlInput = {
  ipv4?: InputMaybe<Scalars['URL']>;
  ipv6?: InputMaybe<Scalars['URL']>;
  name?: InputMaybe<Scalars['String']>;
  type: URL_TYPE;
};

export type ArrayCapacity = {
  __typename?: 'ArrayCapacity';
  bytes?: Maybe<ArrayCapacityBytes>;
};

export type ArrayCapacityBytes = {
  __typename?: 'ArrayCapacityBytes';
  free?: Maybe<Scalars['Long']>;
  total?: Maybe<Scalars['Long']>;
  used?: Maybe<Scalars['Long']>;
};

export type ArrayCapacityBytesInput = {
  free?: InputMaybe<Scalars['Long']>;
  total?: InputMaybe<Scalars['Long']>;
  used?: InputMaybe<Scalars['Long']>;
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
  apiKey: Scalars['String'];
  type: ClientType;
  version: Scalars['String'];
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
  DASHBOARD = 'DASHBOARD'
}

export type Config = {
  __typename?: 'Config';
  error?: Maybe<ConfigErrorState>;
  valid?: Maybe<Scalars['Boolean']>;
};

export enum ConfigErrorState {
  INVALID = 'INVALID',
  NO_KEY_SERVER = 'NO_KEY_SERVER',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
  WITHDRAWN = 'WITHDRAWN'
}

export type Dashboard = {
  __typename?: 'Dashboard';
  apps?: Maybe<DashboardApps>;
  array?: Maybe<DashboardArray>;
  config?: Maybe<DashboardConfig>;
  display?: Maybe<DashboardDisplay>;
  id: Scalars['ID'];
  lastPublish?: Maybe<Scalars['DateTime']>;
  network?: Maybe<Network>;
  online?: Maybe<Scalars['Boolean']>;
  os?: Maybe<DashboardOs>;
  services?: Maybe<Array<Maybe<DashboardService>>>;
  twoFactor?: Maybe<DashboardTwoFactor>;
  vars?: Maybe<DashboardVars>;
  versions?: Maybe<DashboardVersions>;
  vms?: Maybe<DashboardVms>;
};

export type DashboardApps = {
  __typename?: 'DashboardApps';
  installed?: Maybe<Scalars['Int']>;
  started?: Maybe<Scalars['Int']>;
};

export type DashboardAppsInput = {
  installed: Scalars['Int'];
  started: Scalars['Int'];
};

export type DashboardArray = {
  __typename?: 'DashboardArray';
  /** Current array capacity */
  capacity?: Maybe<ArrayCapacity>;
  /** Current array state */
  state?: Maybe<Scalars['String']>;
};

export type DashboardArrayInput = {
  /** Current array capacity */
  capacity: ArrayCapacityInput;
  /** Current array state */
  state: Scalars['String'];
};

export type DashboardCase = {
  __typename?: 'DashboardCase';
  base64?: Maybe<Scalars['String']>;
  error?: Maybe<Scalars['String']>;
  icon?: Maybe<Scalars['String']>;
  url?: Maybe<Scalars['String']>;
};

export type DashboardCaseInput = {
  base64: Scalars['String'];
  error?: InputMaybe<Scalars['String']>;
  icon: Scalars['String'];
  url: Scalars['String'];
};

export type DashboardConfig = {
  __typename?: 'DashboardConfig';
  error?: Maybe<Scalars['String']>;
  valid?: Maybe<Scalars['Boolean']>;
};

export type DashboardConfigInput = {
  error?: InputMaybe<Scalars['String']>;
  valid: Scalars['Boolean'];
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
  hostname?: Maybe<Scalars['String']>;
  uptime?: Maybe<Scalars['DateTime']>;
};

export type DashboardOsInput = {
  hostname: Scalars['String'];
  uptime: Scalars['DateTime'];
};

export type DashboardService = {
  __typename?: 'DashboardService';
  name?: Maybe<Scalars['String']>;
  online?: Maybe<Scalars['Boolean']>;
  uptime?: Maybe<DashboardServiceUptime>;
  version?: Maybe<Scalars['String']>;
};

export type DashboardServiceInput = {
  name: Scalars['String'];
  online: Scalars['Boolean'];
  uptime?: InputMaybe<DashboardServiceUptimeInput>;
  version: Scalars['String'];
};

export type DashboardServiceUptime = {
  __typename?: 'DashboardServiceUptime';
  timestamp?: Maybe<Scalars['DateTime']>;
};

export type DashboardServiceUptimeInput = {
  timestamp: Scalars['DateTime'];
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
  enabled?: Maybe<Scalars['Boolean']>;
};

export type DashboardTwoFactorLocalInput = {
  enabled: Scalars['Boolean'];
};

export type DashboardTwoFactorRemote = {
  __typename?: 'DashboardTwoFactorRemote';
  enabled?: Maybe<Scalars['Boolean']>;
};

export type DashboardTwoFactorRemoteInput = {
  enabled: Scalars['Boolean'];
};

export type DashboardVars = {
  __typename?: 'DashboardVars';
  flashGuid?: Maybe<Scalars['String']>;
  regState?: Maybe<Scalars['String']>;
  regTy?: Maybe<Scalars['String']>;
};

export type DashboardVarsInput = {
  flashGuid: Scalars['String'];
  regState: Scalars['String'];
  regTy: Scalars['String'];
};

export type DashboardVersions = {
  __typename?: 'DashboardVersions';
  unraid?: Maybe<Scalars['String']>;
};

export type DashboardVersionsInput = {
  unraid: Scalars['String'];
};

export type DashboardVms = {
  __typename?: 'DashboardVms';
  installed?: Maybe<Scalars['Int']>;
  started?: Maybe<Scalars['Int']>;
};

export type DashboardVmsInput = {
  installed: Scalars['Int'];
  started: Scalars['Int'];
};

export type Event = ClientConnectedEvent | ClientDisconnectedEvent | ClientPingEvent | RemoteAccessEvent | RemoteGraphQLEvent | UpdateEvent;

export enum EventType {
  CLIENT_CONNECTED_EVENT = 'CLIENT_CONNECTED_EVENT',
  CLIENT_DISCONNECTED_EVENT = 'CLIENT_DISCONNECTED_EVENT',
  CLIENT_PING_EVENT = 'CLIENT_PING_EVENT',
  REMOTE_ACCESS_EVENT = 'REMOTE_ACCESS_EVENT',
  REMOTE_GRAPHQL_EVENT = 'REMOTE_GRAPHQL_EVENT',
  UPDATE_EVENT = 'UPDATE_EVENT'
}

export type FullServerDetails = {
  __typename?: 'FullServerDetails';
  apiConnectedCount?: Maybe<Scalars['Int']>;
  apiVersion?: Maybe<Scalars['String']>;
  connectionTimestamp?: Maybe<Scalars['String']>;
  dashboard?: Maybe<Dashboard>;
  lastPublish?: Maybe<Scalars['String']>;
  network?: Maybe<Network>;
  online?: Maybe<Scalars['Boolean']>;
};

export enum Importance {
  ALERT = 'ALERT',
  INFO = 'INFO',
  WARNING = 'WARNING'
}

export enum KeyType {
  BASIC = 'BASIC',
  PLUS = 'PLUS',
  PRO = 'PRO',
  TRIAL = 'TRIAL'
}

export type KsServerDetails = {
  __typename?: 'KsServerDetails';
  accessLabel: Scalars['String'];
  accessUrl: Scalars['String'];
  apiKey?: Maybe<Scalars['String']>;
  description: Scalars['String'];
  dnsHash: Scalars['String'];
  flashBackupDate?: Maybe<Scalars['Int']>;
  flashBackupUrl: Scalars['String'];
  flashProduct: Scalars['String'];
  flashVendor: Scalars['String'];
  guid: Scalars['String'];
  ipsId: Scalars['String'];
  keyType: KeyType;
  licenseKey: Scalars['String'];
  name: Scalars['String'];
  plgVersion?: Maybe<Scalars['String']>;
  signedIn: Scalars['Boolean'];
};

export type LegacyService = {
  __typename?: 'LegacyService';
  name?: Maybe<Scalars['String']>;
  online?: Maybe<Scalars['Boolean']>;
  uptime?: Maybe<Scalars['Int']>;
  version?: Maybe<Scalars['String']>;
};

export type Mutation = {
  __typename?: 'Mutation';
  remoteGraphQLResponse: Scalars['Boolean'];
  remoteMutation: Scalars['String'];
  remoteSession?: Maybe<Scalars['Boolean']>;
  sendNotification?: Maybe<Notification>;
  sendPing?: Maybe<Scalars['Boolean']>;
  updateDashboard: Dashboard;
  updateNetwork: Network;
};


export type MutationremoteGraphQLResponseArgs = {
  input: RemoteGraphQLServerInput;
};


export type MutationremoteMutationArgs = {
  input: RemoteGraphQLClientInput;
};


export type MutationremoteSessionArgs = {
  remoteAccess: RemoteAccessInput;
};


export type MutationsendNotificationArgs = {
  notification: NotificationInput;
};


export type MutationupdateDashboardArgs = {
  data: DashboardInput;
};


export type MutationupdateNetworkArgs = {
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
  description?: Maybe<Scalars['String']>;
  importance?: Maybe<Importance>;
  link?: Maybe<Scalars['String']>;
  status: NotificationStatus;
  subject?: Maybe<Scalars['String']>;
  title?: Maybe<Scalars['String']>;
};

export type NotificationInput = {
  description?: InputMaybe<Scalars['String']>;
  importance: Importance;
  link?: InputMaybe<Scalars['String']>;
  subject?: InputMaybe<Scalars['String']>;
  title?: InputMaybe<Scalars['String']>;
};

export enum NotificationStatus {
  FAILED_TO_SEND = 'FAILED_TO_SEND',
  NOT_FOUND = 'NOT_FOUND',
  PENDING = 'PENDING',
  SENT = 'SENT'
}

export type PingEvent = {
  __typename?: 'PingEvent';
  data?: Maybe<Scalars['String']>;
  type: EventType;
};

export type PingEventData = {
  __typename?: 'PingEventData';
  source: PingEventSource;
};

export enum PingEventSource {
  API = 'API',
  MOTHERSHIP = 'MOTHERSHIP'
}

export type ProfileModel = {
  __typename?: 'ProfileModel';
  avatar?: Maybe<Scalars['String']>;
  url?: Maybe<Scalars['String']>;
  userId?: Maybe<Scalars['ID']>;
  username?: Maybe<Scalars['String']>;
};

export type Query = {
  __typename?: 'Query';
  apiVersion?: Maybe<Scalars['String']>;
  dashboard?: Maybe<Dashboard>;
  ksServers: Array<KsServerDetails>;
  online?: Maybe<Scalars['Boolean']>;
  remoteQuery: Scalars['String'];
  servers: Array<Maybe<Server>>;
  status?: Maybe<ServerStatus>;
};


export type QuerydashboardArgs = {
  id: Scalars['String'];
};


export type QueryremoteQueryArgs = {
  input: RemoteGraphQLClientInput;
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
  TRIAL = 'TRIAL'
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
  PING = 'PING'
}

export type RemoteAccessEventData = {
  __typename?: 'RemoteAccessEventData';
  apiKey: Scalars['String'];
  type: RemoteAccessEventActionType;
  url?: Maybe<AccessUrl>;
};

export type RemoteAccessInput = {
  apiKey: Scalars['String'];
  type: RemoteAccessEventActionType;
  url?: InputMaybe<AccessUrlInput>;
};

export type RemoteGraphQLClientInput = {
  apiKey: Scalars['String'];
  body: Scalars['String'];
};

export type RemoteGraphQLEvent = {
  __typename?: 'RemoteGraphQLEvent';
  data: RemoteGraphQLEventData;
  type: EventType;
};

export type RemoteGraphQLEventData = {
  __typename?: 'RemoteGraphQLEventData';
  /** Contains mutation / subscription / query data in the form of body: JSON, variables: JSON */
  body: Scalars['String'];
  /** sha256 hash of the body */
  sha256: Scalars['String'];
  type: RemoteGraphQLEventType;
};

export enum RemoteGraphQLEventType {
  REMOTE_MUTATION_EVENT = 'REMOTE_MUTATION_EVENT',
  REMOTE_QUERY_EVENT = 'REMOTE_QUERY_EVENT',
  REMOTE_SUBSCRIPTION_EVENT = 'REMOTE_SUBSCRIPTION_EVENT',
  REMOTE_SUBSCRIPTION_EVENT_PING = 'REMOTE_SUBSCRIPTION_EVENT_PING'
}

export type RemoteGraphQLServerInput = {
  /** Body - contains an object containing data: (GQL response data) or errors: (GQL Errors) */
  body: Scalars['String'];
  /** sha256 hash of the body */
  sha256: Scalars['String'];
  type: RemoteGraphQLEventType;
};

export type Server = {
  __typename?: 'Server';
  apikey?: Maybe<Scalars['String']>;
  guid?: Maybe<Scalars['String']>;
  lanip?: Maybe<Scalars['String']>;
  localurl?: Maybe<Scalars['String']>;
  name?: Maybe<Scalars['String']>;
  owner?: Maybe<ProfileModel>;
  remoteurl?: Maybe<Scalars['String']>;
  status?: Maybe<ServerStatus>;
  wanip?: Maybe<Scalars['String']>;
};

/**  Defines server fields that have a TTL on them, for example last ping  */
export type ServerFieldsWithTtl = {
  __typename?: 'ServerFieldsWithTtl';
  lastPing?: Maybe<Scalars['String']>;
};

export type ServerModel = {
  apikey: Scalars['String'];
  guid: Scalars['String'];
  lanip: Scalars['String'];
  localurl: Scalars['String'];
  name: Scalars['String'];
  remoteurl: Scalars['String'];
  wanip: Scalars['String'];
};

export enum ServerStatus {
  NEVER_CONNECTED = 'never_connected',
  OFFLINE = 'offline',
  ONLINE = 'online'
}

export type Service = {
  __typename?: 'Service';
  name?: Maybe<Scalars['String']>;
  online?: Maybe<Scalars['Boolean']>;
  uptime?: Maybe<Uptime>;
  version?: Maybe<Scalars['String']>;
};

export type Subscription = {
  __typename?: 'Subscription';
  events?: Maybe<Array<Event>>;
  remoteSubscription: Scalars['String'];
  servers: Array<Server>;
};


export type SubscriptionremoteSubscriptionArgs = {
  input: RemoteGraphQLClientInput;
};

export type TwoFactorLocal = {
  __typename?: 'TwoFactorLocal';
  enabled?: Maybe<Scalars['Boolean']>;
};

export type TwoFactorRemote = {
  __typename?: 'TwoFactorRemote';
  enabled?: Maybe<Scalars['Boolean']>;
};

export type TwoFactorWithToken = {
  __typename?: 'TwoFactorWithToken';
  local?: Maybe<TwoFactorLocal>;
  remote?: Maybe<TwoFactorRemote>;
  token?: Maybe<Scalars['String']>;
};

export type TwoFactorWithoutToken = {
  __typename?: 'TwoFactorWithoutToken';
  local?: Maybe<TwoFactorLocal>;
  remote?: Maybe<TwoFactorRemote>;
};

export enum URL_TYPE {
  DEFAULT = 'DEFAULT',
  LAN = 'LAN',
  MDNS = 'MDNS',
  WAN = 'WAN',
  WIREGUARD = 'WIREGUARD'
}

export type UpdateEvent = {
  __typename?: 'UpdateEvent';
  data: UpdateEventData;
  type: EventType;
};

export type UpdateEventData = {
  __typename?: 'UpdateEventData';
  apiKey: Scalars['String'];
  type: UpdateType;
};

export enum UpdateType {
  DASHBOARD = 'DASHBOARD',
  NETWORK = 'NETWORK'
}

export type Uptime = {
  __typename?: 'Uptime';
  timestamp?: Maybe<Scalars['String']>;
};

export type UserProfileModelWithServers = {
  __typename?: 'UserProfileModelWithServers';
  profile: ProfileModel;
  servers: Array<Server>;
};

export type Vars = {
  __typename?: 'Vars';
  expireTime?: Maybe<Scalars['DateTime']>;
  flashGuid?: Maybe<Scalars['String']>;
  regState?: Maybe<RegistrationState>;
  regTm2?: Maybe<Scalars['String']>;
  regTy?: Maybe<Scalars['String']>;
};

export type updateDashboardMutationVariables = Exact<{
  data: DashboardInput;
  apiKey: Scalars['String'];
}>;


export type updateDashboardMutation = { __typename?: 'Mutation', updateDashboard: { __typename?: 'Dashboard', apps?: { __typename?: 'DashboardApps', installed?: number | null } | null } };

export type sendNotificationMutationVariables = Exact<{
  notification: NotificationInput;
  apiKey: Scalars['String'];
}>;


export type sendNotificationMutation = { __typename?: 'Mutation', sendNotification?: { __typename?: 'Notification', title?: string | null, subject?: string | null, description?: string | null, importance?: Importance | null, link?: string | null, status: NotificationStatus } | null };

export type updateNetworkMutationVariables = Exact<{
  data: NetworkInput;
  apiKey: Scalars['String'];
}>;


export type updateNetworkMutation = { __typename?: 'Mutation', updateNetwork: { __typename?: 'Network', accessUrls?: Array<{ __typename?: 'AccessUrl', name?: string | null, type: URL_TYPE, ipv4?: URL | null, ipv6?: URL | null }> | null } };

export type sendRemoteAccessMutationMutationVariables = Exact<{
  remoteAccess: RemoteAccessInput;
}>;


export type sendRemoteAccessMutationMutation = { __typename?: 'Mutation', remoteSession?: boolean | null };

export type sendRemoteGraphQLResponseMutationVariables = Exact<{
  input: RemoteGraphQLServerInput;
}>;


export type sendRemoteGraphQLResponseMutation = { __typename?: 'Mutation', remoteGraphQLResponse: boolean };

export type RemoteGraphQLEventFragmentFragment = { __typename?: 'RemoteGraphQLEvent', remoteGraphQLEventData: { __typename?: 'RemoteGraphQLEventData', type: RemoteGraphQLEventType, body: string, sha256: string } } & { ' $fragmentName'?: 'RemoteGraphQLEventFragmentFragment' };

export type RemoteAccessEventFragmentFragment = { __typename?: 'RemoteAccessEvent', type: EventType, data: { __typename?: 'RemoteAccessEventData', type: RemoteAccessEventActionType, apiKey: string, url?: { __typename?: 'AccessUrl', type: URL_TYPE, name?: string | null, ipv4?: URL | null, ipv6?: URL | null } | null } } & { ' $fragmentName'?: 'RemoteAccessEventFragmentFragment' };

export type eventsSubscriptionVariables = Exact<{ [key: string]: never; }>;


export type eventsSubscription = { __typename?: 'Subscription', events?: Array<{ __typename: 'ClientConnectedEvent', connectedEvent: EventType, connectedData: { __typename?: 'ClientConnectionEventData', type: ClientType, version: string, apiKey: string } } | { __typename: 'ClientDisconnectedEvent', disconnectedEvent: EventType, disconnectedData: { __typename?: 'ClientConnectionEventData', type: ClientType, version: string, apiKey: string } } | { __typename: 'ClientPingEvent' } | (
    { __typename: 'RemoteAccessEvent' }
    & { ' $fragmentRefs'?: { 'RemoteAccessEventFragmentFragment': RemoteAccessEventFragmentFragment } }
  ) | (
    { __typename: 'RemoteGraphQLEvent' }
    & { ' $fragmentRefs'?: { 'RemoteGraphQLEventFragmentFragment': RemoteGraphQLEventFragmentFragment } }
  ) | { __typename: 'UpdateEvent' }> | null };

export const RemoteGraphQLEventFragmentFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"RemoteGraphQLEventFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"RemoteGraphQLEvent"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","alias":{"kind":"Name","value":"remoteGraphQLEventData"},"name":{"kind":"Name","value":"data"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"body"}},{"kind":"Field","name":{"kind":"Name","value":"sha256"}}]}}]}}]} as unknown as DocumentNode<RemoteGraphQLEventFragmentFragment, unknown>;
export const RemoteAccessEventFragmentFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"RemoteAccessEventFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"RemoteAccessEvent"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"data"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"url"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"ipv4"}},{"kind":"Field","name":{"kind":"Name","value":"ipv6"}}]}},{"kind":"Field","name":{"kind":"Name","value":"apiKey"}}]}}]}}]} as unknown as DocumentNode<RemoteAccessEventFragmentFragment, unknown>;
export const updateDashboardDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"updateDashboard"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"data"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"DashboardInput"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"apiKey"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateDashboard"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"data"},"value":{"kind":"Variable","name":{"kind":"Name","value":"data"}}}],"directives":[{"kind":"Directive","name":{"kind":"Name","value":"auth"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"apiKey"},"value":{"kind":"Variable","name":{"kind":"Name","value":"apiKey"}}}]}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"apps"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"installed"}}]}}]}}]}}]} as unknown as DocumentNode<updateDashboardMutation, updateDashboardMutationVariables>;
export const sendNotificationDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"sendNotification"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"notification"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"NotificationInput"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"apiKey"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"sendNotification"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"notification"},"value":{"kind":"Variable","name":{"kind":"Name","value":"notification"}}}],"directives":[{"kind":"Directive","name":{"kind":"Name","value":"auth"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"apiKey"},"value":{"kind":"Variable","name":{"kind":"Name","value":"apiKey"}}}]}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"subject"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"importance"}},{"kind":"Field","name":{"kind":"Name","value":"link"}},{"kind":"Field","name":{"kind":"Name","value":"status"}}]}}]}}]} as unknown as DocumentNode<sendNotificationMutation, sendNotificationMutationVariables>;
export const updateNetworkDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"updateNetwork"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"data"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"NetworkInput"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"apiKey"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateNetwork"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"data"},"value":{"kind":"Variable","name":{"kind":"Name","value":"data"}}}],"directives":[{"kind":"Directive","name":{"kind":"Name","value":"auth"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"apiKey"},"value":{"kind":"Variable","name":{"kind":"Name","value":"apiKey"}}}]}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"accessUrls"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"ipv4"}},{"kind":"Field","name":{"kind":"Name","value":"ipv6"}}]}}]}}]}}]} as unknown as DocumentNode<updateNetworkMutation, updateNetworkMutationVariables>;
export const sendRemoteAccessMutationDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"sendRemoteAccessMutation"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"remoteAccess"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"RemoteAccessInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"remoteSession"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"remoteAccess"},"value":{"kind":"Variable","name":{"kind":"Name","value":"remoteAccess"}}}]}]}}]} as unknown as DocumentNode<sendRemoteAccessMutationMutation, sendRemoteAccessMutationMutationVariables>;
export const sendRemoteGraphQLResponseDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"sendRemoteGraphQLResponse"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"RemoteGraphQLServerInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"remoteGraphQLResponse"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}]}]}}]} as unknown as DocumentNode<sendRemoteGraphQLResponseMutation, sendRemoteGraphQLResponseMutationVariables>;
export const eventsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"subscription","name":{"kind":"Name","value":"events"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"events"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"__typename"}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"ClientConnectedEvent"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","alias":{"kind":"Name","value":"connectedData"},"name":{"kind":"Name","value":"data"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"version"}},{"kind":"Field","name":{"kind":"Name","value":"apiKey"}}]}},{"kind":"Field","alias":{"kind":"Name","value":"connectedEvent"},"name":{"kind":"Name","value":"type"}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"ClientDisconnectedEvent"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","alias":{"kind":"Name","value":"disconnectedData"},"name":{"kind":"Name","value":"data"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"version"}},{"kind":"Field","name":{"kind":"Name","value":"apiKey"}}]}},{"kind":"Field","alias":{"kind":"Name","value":"disconnectedEvent"},"name":{"kind":"Name","value":"type"}}]}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"RemoteAccessEventFragment"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"RemoteGraphQLEventFragment"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"RemoteAccessEventFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"RemoteAccessEvent"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"data"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"url"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"ipv4"}},{"kind":"Field","name":{"kind":"Name","value":"ipv6"}}]}},{"kind":"Field","name":{"kind":"Name","value":"apiKey"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"RemoteGraphQLEventFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"RemoteGraphQLEvent"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","alias":{"kind":"Name","value":"remoteGraphQLEventData"},"name":{"kind":"Name","value":"data"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"body"}},{"kind":"Field","name":{"kind":"Name","value":"sha256"}}]}}]}}]} as unknown as DocumentNode<eventsSubscription, eventsSubscriptionVariables>;