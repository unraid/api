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
  DateTime: any;
  JSON: any;
  Long: any;
};

export type ArrayType = {
  __typename?: 'Array';
  capacity?: Maybe<ArrayCapacity>;
  state?: Maybe<Scalars['String']>;
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
  installed?: InputMaybe<Scalars['Int']>;
  started?: InputMaybe<Scalars['Int']>;
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
  base64?: InputMaybe<Scalars['String']>;
  error?: InputMaybe<Scalars['String']>;
  icon?: InputMaybe<Scalars['String']>;
  url?: InputMaybe<Scalars['String']>;
};

export type DashboardConfig = {
  __typename?: 'DashboardConfig';
  error?: Maybe<Scalars['String']>;
  valid?: Maybe<Scalars['Boolean']>;
};

export type DashboardConfigInput = {
  error?: InputMaybe<Scalars['String']>;
  valid?: InputMaybe<Scalars['Boolean']>;
};

export type DashboardDisplay = {
  __typename?: 'DashboardDisplay';
  case?: Maybe<DashboardCase>;
};

export type DashboardDisplayInput = {
  case?: InputMaybe<DashboardCaseInput>;
};

export type DashboardInput = {
  apps?: InputMaybe<DashboardAppsInput>;
  array: DashboardArrayInput;
  config?: InputMaybe<DashboardConfigInput>;
  display?: InputMaybe<DashboardDisplayInput>;
  os?: InputMaybe<DashboardOsInput>;
  services?: InputMaybe<Array<InputMaybe<DashboardServiceInput>>>;
  twoFactor?: InputMaybe<DashboardTwoFactorInput>;
  vars?: InputMaybe<DashboardVarsInput>;
  versions?: InputMaybe<DashboardVersionsInput>;
  vms?: InputMaybe<DashboardVmsInput>;
};

export type DashboardOs = {
  __typename?: 'DashboardOs';
  hostname?: Maybe<Scalars['String']>;
  uptime?: Maybe<Scalars['DateTime']>;
};

export type DashboardOsInput = {
  hostname?: InputMaybe<Scalars['String']>;
  uptime?: InputMaybe<Scalars['DateTime']>;
};

export type DashboardService = {
  __typename?: 'DashboardService';
  name?: Maybe<Scalars['String']>;
  online?: Maybe<Scalars['Boolean']>;
  uptime?: Maybe<DashboardServiceUptime>;
  version?: Maybe<Scalars['String']>;
};

export type DashboardServiceInput = {
  name?: InputMaybe<Scalars['String']>;
  online?: InputMaybe<Scalars['Boolean']>;
  uptime?: InputMaybe<DashboardServiceUptimeInput>;
  version?: InputMaybe<Scalars['String']>;
};

export type DashboardServiceUptime = {
  __typename?: 'DashboardServiceUptime';
  timestamp?: Maybe<Scalars['DateTime']>;
};

export type DashboardServiceUptimeInput = {
  timestamp?: InputMaybe<Scalars['DateTime']>;
};

export type DashboardTwoFactor = {
  __typename?: 'DashboardTwoFactor';
  local?: Maybe<DashboardTwoFactorLocal>;
  remote?: Maybe<DashboardTwoFactorRemote>;
};

export type DashboardTwoFactorInput = {
  local?: InputMaybe<DashboardTwoFactorLocalInput>;
  remote?: InputMaybe<DashboardTwoFactorRemoteInput>;
};

export type DashboardTwoFactorLocal = {
  __typename?: 'DashboardTwoFactorLocal';
  enabled?: Maybe<Scalars['Boolean']>;
};

export type DashboardTwoFactorLocalInput = {
  enabled?: InputMaybe<Scalars['Boolean']>;
};

export type DashboardTwoFactorRemote = {
  __typename?: 'DashboardTwoFactorRemote';
  enabled?: Maybe<Scalars['Boolean']>;
};

export type DashboardTwoFactorRemoteInput = {
  enabled?: InputMaybe<Scalars['Boolean']>;
};

export type DashboardVars = {
  __typename?: 'DashboardVars';
  flashGuid?: Maybe<Scalars['String']>;
  regState?: Maybe<Scalars['String']>;
  regTy?: Maybe<Scalars['String']>;
};

export type DashboardVarsInput = {
  flashGuid?: InputMaybe<Scalars['String']>;
  regState?: InputMaybe<Scalars['String']>;
  regTy?: InputMaybe<Scalars['String']>;
};

export type DashboardVersions = {
  __typename?: 'DashboardVersions';
  unraid?: Maybe<Scalars['String']>;
};

export type DashboardVersionsInput = {
  unraid?: InputMaybe<Scalars['String']>;
};

export type DashboardVms = {
  __typename?: 'DashboardVms';
  installed?: Maybe<Scalars['Int']>;
  started?: Maybe<Scalars['Int']>;
};

export type DashboardVmsInput = {
  installed?: InputMaybe<Scalars['Int']>;
  started?: InputMaybe<Scalars['Int']>;
};

export type Display = {
  __typename?: 'Display';
  case?: Maybe<DisplayCase>;
};

export type DisplayCase = {
  __typename?: 'DisplayCase';
  base64: Scalars['String'];
  error: Scalars['String'];
  icon: Scalars['String'];
  url: Scalars['String'];
};

export type Event = ClientConnectedEvent | ClientDisconnectedEvent;

export enum EventType {
  CLIENT_CONNECTED_EVENT = 'CLIENT_CONNECTED_EVENT',
  CLIENT_DISCONNECTED_EVENT = 'CLIENT_DISCONNECTED_EVENT'
}

export type FullServerDetails = {
  __typename?: 'FullServerDetails';
  array?: Maybe<ArrayType>;
  config?: Maybe<Config>;
  dashboard?: Maybe<Dashboard>;
  display?: Maybe<Display>;
  domains?: Maybe<Array<VmDomain>>;
  info?: Maybe<Info>;
  me?: Maybe<Me>;
  online?: Maybe<Scalars['Boolean']>;
  services?: Maybe<Array<ServiceObject>>;
  twoFactor?: Maybe<TwoFactorWithoutToken>;
  vars?: Maybe<Vars>;
  vms?: Maybe<Vms>;
};

export enum Importance {
  ALERT = 'ALERT',
  INFO = 'INFO',
  WARNING = 'WARNING'
}

export type Info = {
  __typename?: 'Info';
  /** Count of docker containers */
  apps?: Maybe<InfoApps>;
  os?: Maybe<InfoOs>;
  versions?: Maybe<InfoVersions>;
  vms?: Maybe<InfoVms>;
};

export type InfoApps = {
  __typename?: 'InfoApps';
  /** How many docker containers are installed */
  installed?: Maybe<Scalars['Int']>;
  /** How many docker containers are running */
  started?: Maybe<Scalars['Int']>;
};

export type InfoOs = {
  __typename?: 'InfoOs';
  hostname?: Maybe<Scalars['String']>;
  uptime?: Maybe<Scalars['String']>;
};

export type InfoVersions = {
  __typename?: 'InfoVersions';
  unraid?: Maybe<Scalars['String']>;
};

export type InfoVms = {
  __typename?: 'InfoVms';
  /** How many vms are installed */
  installed?: Maybe<Scalars['Int']>;
  /** How many vms are running */
  started?: Maybe<Scalars['Int']>;
};

export type LegacyService = {
  __typename?: 'LegacyService';
  name?: Maybe<Scalars['String']>;
  online?: Maybe<Scalars['Boolean']>;
  uptime?: Maybe<Scalars['Int']>;
  version?: Maybe<Scalars['String']>;
};

export type Me = {
  __typename?: 'Me';
  description: Scalars['String'];
  id: Scalars['ID'];
  name: Scalars['String'];
  permissions?: Maybe<Scalars['JSON']>;
  role: Scalars['String'];
};

export type Mutation = {
  __typename?: 'Mutation';
  sendNotification?: Maybe<Notification>;
  updateDashboard: Dashboard;
};


export type MutationsendNotificationArgs = {
  notification: NotificationInput;
};


export type MutationupdateDashboardArgs = {
  data: DashboardInput;
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

export type ProfileModel = {
  __typename?: 'ProfileModel';
  avatar?: Maybe<Scalars['String']>;
  url?: Maybe<Scalars['String']>;
  username?: Maybe<Scalars['String']>;
};

export type Query = {
  __typename?: 'Query';
  apiVersion?: Maybe<Scalars['String']>;
  array?: Maybe<ArrayType>;
  config?: Maybe<Config>;
  dashboard?: Maybe<Dashboard>;
  display?: Maybe<Display>;
  info?: Maybe<Info>;
  me?: Maybe<Me>;
  online?: Maybe<Scalars['Boolean']>;
  servers: Array<Maybe<Server>>;
  services?: Maybe<Array<Maybe<ServiceObject>>>;
  status?: Maybe<ServerStatus>;
  twoFactor?: Maybe<TwoFactorWithToken>;
  vars?: Maybe<Vars>;
  vms?: Maybe<Vms>;
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

export type Server = {
  __typename?: 'Server';
  apikey?: Maybe<Scalars['String']>;
  guid?: Maybe<Scalars['String']>;
  lanip?: Maybe<Scalars['String']>;
  localurl?: Maybe<Scalars['String']>;
  name?: Maybe<Scalars['String']>;
  owner?: Maybe<ServerOwner>;
  remoteurl?: Maybe<Scalars['String']>;
  status?: Maybe<ServerStatus>;
  wanip?: Maybe<Scalars['String']>;
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

export type ServerOwner = {
  __typename?: 'ServerOwner';
  avatar?: Maybe<Scalars['String']>;
  url?: Maybe<Scalars['String']>;
  username?: Maybe<Scalars['String']>;
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

export type ServiceObject = LegacyService | Service;

export type Subscription = {
  __typename?: 'Subscription';
  array?: Maybe<ArrayType>;
  config?: Maybe<Config>;
  dashboard?: Maybe<Dashboard>;
  display?: Maybe<Display>;
  events?: Maybe<Array<Maybe<Event>>>;
  info?: Maybe<Info>;
  me?: Maybe<Me>;
  online?: Maybe<Scalars['Boolean']>;
  servers?: Maybe<Scalars['JSON']>;
  services?: Maybe<Array<Maybe<ServiceObject>>>;
  status?: Maybe<ServerStatus>;
  twoFactor?: Maybe<TwoFactorWithoutToken>;
  vars?: Maybe<Vars>;
  vms?: Maybe<Vms>;
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

/** A virtual machine */
export type VmDomain = {
  __typename?: 'VmDomain';
  /** A friendly name for the vm */
  name?: Maybe<Scalars['String']>;
  /** Current domain vm state */
  state?: Maybe<VmState>;
  uuid: Scalars['ID'];
};

export enum VmState {
  CRASHED = 'CRASHED',
  IDLE = 'IDLE',
  NOSTATE = 'NOSTATE',
  PAUSED = 'PAUSED',
  PMSUSPENDED = 'PMSUSPENDED',
  RUNNING = 'RUNNING',
  SHUTDOWN = 'SHUTDOWN',
  SHUTOFF = 'SHUTOFF'
}

export type Vms = {
  __typename?: 'Vms';
  domain?: Maybe<Array<VmDomain>>;
};

export type updateDashboardMutationVariables = Exact<{
  data: DashboardInput;
}>;


export type updateDashboardMutation = { __typename?: 'Mutation', updateDashboard: { __typename?: 'Dashboard', apps?: { __typename?: 'DashboardApps', installed?: number | null } | null } };

export type queryServersFromMothershipQueryVariables = Exact<{
  apiKey: Scalars['String'];
}>;


export type queryServersFromMothershipQuery = { __typename?: 'Query', servers: Array<{ __typename?: 'Server', guid?: string | null, apikey?: string | null, name?: string | null, status?: ServerStatus | null, wanip?: string | null, lanip?: string | null, localurl?: string | null, remoteurl?: string | null, owner?: { __typename?: 'ServerOwner', username?: string | null, url?: string | null, avatar?: string | null } | null } | null> };

export type eventsSubscriptionVariables = Exact<{
  apiKey: Scalars['String'];
}>;


export type eventsSubscription = { __typename?: 'Subscription', events?: Array<{ __typename?: 'ClientConnectedEvent', connectedEvent: EventType, connectedData: { __typename?: 'ClientConnectionEventData', type: ClientType, version: string, apiKey: string } } | { __typename?: 'ClientDisconnectedEvent', disconnectedEvent: EventType, disconnectedData: { __typename?: 'ClientConnectionEventData', type: ClientType, version: string, apiKey: string } } | null> | null };

export type serversSubscriptionVariables = Exact<{
  apiKey: Scalars['String'];
}>;


export type serversSubscription = { __typename?: 'Subscription', servers?: any | null };


export const updateDashboardDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"updateDashboard"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"data"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"DashboardInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateDashboard"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"data"},"value":{"kind":"Variable","name":{"kind":"Name","value":"data"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"apps"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"installed"}}]}}]}}]}}]} as unknown as DocumentNode<updateDashboardMutation, updateDashboardMutationVariables>;
export const queryServersFromMothershipDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"queryServersFromMothership"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"apiKey"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"servers"},"directives":[{"kind":"Directive","name":{"kind":"Name","value":"auth"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"apiKey"},"value":{"kind":"Variable","name":{"kind":"Name","value":"apiKey"}}}]}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"owner"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"username"}},{"kind":"Field","name":{"kind":"Name","value":"url"}},{"kind":"Field","name":{"kind":"Name","value":"avatar"}}]}},{"kind":"Field","name":{"kind":"Name","value":"guid"}},{"kind":"Field","name":{"kind":"Name","value":"apikey"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"wanip"}},{"kind":"Field","name":{"kind":"Name","value":"lanip"}},{"kind":"Field","name":{"kind":"Name","value":"localurl"}},{"kind":"Field","name":{"kind":"Name","value":"remoteurl"}}]}}]}}]} as unknown as DocumentNode<queryServersFromMothershipQuery, queryServersFromMothershipQueryVariables>;
export const eventsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"subscription","name":{"kind":"Name","value":"events"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"apiKey"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"events"},"directives":[{"kind":"Directive","name":{"kind":"Name","value":"auth"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"apiKey"},"value":{"kind":"Variable","name":{"kind":"Name","value":"apiKey"}}}]}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"ClientConnectedEvent"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","alias":{"kind":"Name","value":"connectedData"},"name":{"kind":"Name","value":"data"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"version"}},{"kind":"Field","name":{"kind":"Name","value":"apiKey"}}]}},{"kind":"Field","alias":{"kind":"Name","value":"connectedEvent"},"name":{"kind":"Name","value":"type"}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"ClientDisconnectedEvent"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","alias":{"kind":"Name","value":"disconnectedData"},"name":{"kind":"Name","value":"data"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"version"}},{"kind":"Field","name":{"kind":"Name","value":"apiKey"}}]}},{"kind":"Field","alias":{"kind":"Name","value":"disconnectedEvent"},"name":{"kind":"Name","value":"type"}}]}}]}}]}}]} as unknown as DocumentNode<eventsSubscription, eventsSubscriptionVariables>;
export const serversDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"subscription","name":{"kind":"Name","value":"servers"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"apiKey"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"servers"},"directives":[{"kind":"Directive","name":{"kind":"Name","value":"auth"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"apiKey"},"value":{"kind":"Variable","name":{"kind":"Name","value":"apiKey"}}}]}]}]}}]} as unknown as DocumentNode<serversSubscription, serversSubscriptionVariables>;