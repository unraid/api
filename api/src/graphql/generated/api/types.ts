/* eslint-disable */
/* @ts-nocheck */
import { GraphQLResolveInfo, GraphQLScalarType, GraphQLScalarTypeConfig } from 'graphql';
import { Context } from '@app/graphql/schema/utils.js';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
export type RequireFields<T, K extends keyof T> = Omit<T, K> & { [P in K]-?: NonNullable<T[P]> };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
  DateTime: { input: string; output: string; }
  JSON: { input: Record<string, any>; output: Record<string, any>; }
  Long: { input: number; output: number; }
  Port: { input: number; output: number; }
  URL: { input: URL; output: URL; }
  UUID: { input: string; output: string; }
};

export type AccessUrl = {
  __typename?: 'AccessUrl';
  ipv4?: Maybe<Scalars['URL']['output']>;
  ipv6?: Maybe<Scalars['URL']['output']>;
  name?: Maybe<Scalars['String']['output']>;
  type: URL_TYPE;
};

export type AccessUrlInput = {
  ipv4?: InputMaybe<Scalars['URL']['input']>;
  ipv6?: InputMaybe<Scalars['URL']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  type: URL_TYPE;
};

export type AddPermissionInput = {
  actions: Array<Scalars['String']['input']>;
  resource: Resource;
};

export type AddRoleForApiKeyInput = {
  apiKeyId: Scalars['ID']['input'];
  role: Role;
};

export type AddRoleForUserInput = {
  role: Role;
  userId: Scalars['ID']['input'];
};

export type AllowedOriginInput = {
  origins: Array<Scalars['String']['input']>;
};

export type ApiKey = {
  __typename?: 'ApiKey';
  createdAt: Scalars['DateTime']['output'];
  description?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
  permissions: Array<Permission>;
  roles: Array<Role>;
};

export type ApiKeyResponse = {
  __typename?: 'ApiKeyResponse';
  error?: Maybe<Scalars['String']['output']>;
  valid: Scalars['Boolean']['output'];
};

export type ApiKeyWithSecret = {
  __typename?: 'ApiKeyWithSecret';
  createdAt: Scalars['DateTime']['output'];
  description?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  key: Scalars['String']['output'];
  name: Scalars['String']['output'];
  permissions: Array<Permission>;
  roles: Array<Role>;
};

export type ArrayType = Node & {
  __typename?: 'Array';
  /** Current boot disk */
  boot?: Maybe<ArrayDisk>;
  /** Caches in the current array */
  caches: Array<ArrayDisk>;
  /** Current array capacity */
  capacity: ArrayCapacity;
  /** Data disks in the current array */
  disks: Array<ArrayDisk>;
  id: Scalars['ID']['output'];
  /** Parity disks in the current array */
  parities: Array<ArrayDisk>;
  /** Array state after this query/mutation */
  pendingState?: Maybe<ArrayPendingState>;
  /** Array state before this query/mutation */
  previousState?: Maybe<ArrayState>;
  /** Current array state */
  state: ArrayState;
};

export type ArrayCapacity = {
  __typename?: 'ArrayCapacity';
  disks: Capacity;
  kilobytes: Capacity;
};

export type ArrayDisk = {
  __typename?: 'ArrayDisk';
  /**  User comment on disk  */
  comment?: Maybe<Scalars['String']['output']>;
  /**  (%) Disk space left for critical  */
  critical?: Maybe<Scalars['Int']['output']>;
  device?: Maybe<Scalars['String']['output']>;
  exportable?: Maybe<Scalars['Boolean']['output']>;
  /**  File format (ex MBR: 4KiB-aligned)  */
  format?: Maybe<Scalars['String']['output']>;
  /**  (KB) Free Size on the FS (Not present on Parity type drive) */
  fsFree?: Maybe<Scalars['Long']['output']>;
  /**  (KB) Total Size of the FS (Not present on Parity type drive)  */
  fsSize?: Maybe<Scalars['Long']['output']>;
  /**  File system type for the disk  */
  fsType?: Maybe<Scalars['String']['output']>;
  /**  (KB) Used Size on the FS (Not present on Parity type drive) */
  fsUsed?: Maybe<Scalars['Long']['output']>;
  /**  Disk indentifier, only set for present disks on the system  */
  id: Scalars['ID']['output'];
  /**  Array slot number. Parity1 is always 0 and Parity2 is always 29. Array slots will be 1 - 28. Cache slots are 30 - 53. Flash is 54.  */
  idx: Scalars['Int']['output'];
  name?: Maybe<Scalars['String']['output']>;
  /** Number of unrecoverable errors reported by the device I/O drivers. Missing data due to unrecoverable array read errors is filled in on-the-fly using parity reconstruct (and we attempt to write this data back to the sector(s) which failed). Any unrecoverable write error results in disabling the disk. */
  numErrors: Scalars['Long']['output'];
  /** Count of I/O read requests sent to the device I/O drivers. These statistics may be cleared at any time. */
  numReads: Scalars['Long']['output'];
  /** Count of I/O writes requests sent to the device I/O drivers. These statistics may be cleared at any time. */
  numWrites: Scalars['Long']['output'];
  /**  Is the disk a HDD or SSD.  */
  rotational?: Maybe<Scalars['Boolean']['output']>;
  /**  (KB) Disk Size total  */
  size: Scalars['Long']['output'];
  status?: Maybe<ArrayDiskStatus>;
  /**  Disk temp - will be NaN if array is not started or DISK_NP  */
  temp?: Maybe<Scalars['Int']['output']>;
  /**  ata | nvme | usb | (others) */
  transport?: Maybe<Scalars['String']['output']>;
  /**  Type of Disk - used to differentiate Cache / Flash / Array / Parity  */
  type: ArrayDiskType;
  /**  (%) Disk space left to warn  */
  warning?: Maybe<Scalars['Int']['output']>;
};

export enum ArrayDiskFsColor {
  /** Disk is OK and not running */
  GREEN_OFF = 'green_off',
  /** Disk is OK and running */
  GREEN_ON = 'green_on',
  RED_OFF = 'red_off',
  RED_ON = 'red_on',
  YELLOW_OFF = 'yellow_off',
  YELLOW_ON = 'yellow_on'
}

export enum ArrayDiskStatus {
  /**  disabled, old disk still present  */
  DISK_DSBL = 'DISK_DSBL',
  /**  disabled, new disk present  */
  DISK_DSBL_NEW = 'DISK_DSBL_NEW',
  /**  enabled, disk present, but not valid  */
  DISK_INVALID = 'DISK_INVALID',
  /**  new disk  */
  DISK_NEW = 'DISK_NEW',
  /**  no disk present, no disk configured  */
  DISK_NP = 'DISK_NP',
  /**  disabled, no disk present  */
  DISK_NP_DSBL = 'DISK_NP_DSBL',
  /**  enabled, but missing  */
  DISK_NP_MISSING = 'DISK_NP_MISSING',
  /**  enabled, disk present, correct, valid  */
  DISK_OK = 'DISK_OK',
  /**  enablled, disk present, but not correct disk  */
  DISK_WRONG = 'DISK_WRONG'
}

export enum ArrayDiskType {
  /** Cache disk */
  CACHE = 'Cache',
  /** Data disk */
  DATA = 'Data',
  /** Flash disk */
  FLASH = 'Flash',
  /** Parity disk */
  PARITY = 'Parity'
}

export enum ArrayPendingState {
  /** Array has no data disks */
  NO_DATA_DISKS = 'no_data_disks',
  /** Array is starting */
  STARTING = 'starting',
  /** Array is stopping */
  STOPPING = 'stopping',
  /** Array has too many missing data disks */
  TOO_MANY_MISSING_DISKS = 'too_many_missing_disks'
}

export enum ArrayState {
  /** A disk is disabled in the array */
  DISABLE_DISK = 'DISABLE_DISK',
  /** Too many changes to array at the same time */
  INVALID_EXPANSION = 'INVALID_EXPANSION',
  /** Array has new disks */
  NEW_ARRAY = 'NEW_ARRAY',
  /** Array has new disks they're too small */
  NEW_DISK_TOO_SMALL = 'NEW_DISK_TOO_SMALL',
  /** Array has no data disks */
  NO_DATA_DISKS = 'NO_DATA_DISKS',
  /** Parity isn't the biggest, can't start array */
  PARITY_NOT_BIGGEST = 'PARITY_NOT_BIGGEST',
  /** A disk is being reconstructed */
  RECON_DISK = 'RECON_DISK',
  /** Array is running */
  STARTED = 'STARTED',
  /** Array has stopped */
  STOPPED = 'STOPPED',
  /** Array is disabled */
  SWAP_DSBL = 'SWAP_DSBL',
  /** Array has too many missing data disks */
  TOO_MANY_MISSING_DISKS = 'TOO_MANY_MISSING_DISKS'
}

export type Baseboard = {
  __typename?: 'Baseboard';
  assetTag?: Maybe<Scalars['String']['output']>;
  manufacturer: Scalars['String']['output'];
  model?: Maybe<Scalars['String']['output']>;
  serial?: Maybe<Scalars['String']['output']>;
  version?: Maybe<Scalars['String']['output']>;
};

export type Capacity = {
  __typename?: 'Capacity';
  free: Scalars['String']['output'];
  total: Scalars['String']['output'];
  used: Scalars['String']['output'];
};

export type Case = {
  __typename?: 'Case';
  base64?: Maybe<Scalars['String']['output']>;
  error?: Maybe<Scalars['String']['output']>;
  icon?: Maybe<Scalars['String']['output']>;
  url?: Maybe<Scalars['String']['output']>;
};

export type Cloud = {
  __typename?: 'Cloud';
  allowedOrigins: Array<Scalars['String']['output']>;
  apiKey: ApiKeyResponse;
  cloud: CloudResponse;
  error?: Maybe<Scalars['String']['output']>;
  minigraphql: MinigraphqlResponse;
  relay?: Maybe<RelayResponse>;
};

export type CloudResponse = {
  __typename?: 'CloudResponse';
  error?: Maybe<Scalars['String']['output']>;
  ip?: Maybe<Scalars['String']['output']>;
  status: Scalars['String']['output'];
};

export type Config = Node & {
  __typename?: 'Config';
  error?: Maybe<ConfigErrorState>;
  id: Scalars['ID']['output'];
  valid?: Maybe<Scalars['Boolean']['output']>;
};

export enum ConfigErrorState {
  INVALID = 'INVALID',
  NO_KEY_SERVER = 'NO_KEY_SERVER',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
  WITHDRAWN = 'WITHDRAWN'
}

export type Connect = Node & {
  __typename?: 'Connect';
  dynamicRemoteAccess: DynamicRemoteAccessStatus;
  id: Scalars['ID']['output'];
  settings: ConnectSettings;
};

export type ConnectSettings = Node & {
  __typename?: 'ConnectSettings';
  dataSchema: Scalars['JSON']['output'];
  id: Scalars['ID']['output'];
  uiSchema: Scalars['JSON']['output'];
  values: ConnectSettingsValues;
};

/** Intersection type of ApiSettings and RemoteAccess */
export type ConnectSettingsValues = {
  __typename?: 'ConnectSettingsValues';
  accessType: WAN_ACCESS_TYPE;
  extraOrigins: Array<Scalars['String']['output']>;
  forwardType?: Maybe<WAN_FORWARD_TYPE>;
  port?: Maybe<Scalars['Port']['output']>;
  sandbox: Scalars['Boolean']['output'];
};

export type ConnectSignInInput = {
  accessToken?: InputMaybe<Scalars['String']['input']>;
  apiKey: Scalars['String']['input'];
  idToken?: InputMaybe<Scalars['String']['input']>;
  refreshToken?: InputMaybe<Scalars['String']['input']>;
  userInfo?: InputMaybe<ConnectUserInfoInput>;
};

export type ConnectUserInfoInput = {
  avatar?: InputMaybe<Scalars['String']['input']>;
  email: Scalars['String']['input'];
  preferred_username: Scalars['String']['input'];
};

export type ContainerHostConfig = {
  __typename?: 'ContainerHostConfig';
  networkMode: Scalars['String']['output'];
};

export type ContainerMount = {
  __typename?: 'ContainerMount';
  destination: Scalars['String']['output'];
  driver: Scalars['String']['output'];
  mode: Scalars['String']['output'];
  name: Scalars['String']['output'];
  propagation: Scalars['String']['output'];
  rw: Scalars['Boolean']['output'];
  source: Scalars['String']['output'];
  type: Scalars['String']['output'];
};

export type ContainerPort = {
  __typename?: 'ContainerPort';
  ip?: Maybe<Scalars['String']['output']>;
  privatePort?: Maybe<Scalars['Int']['output']>;
  publicPort?: Maybe<Scalars['Int']['output']>;
  type?: Maybe<ContainerPortType>;
};

export enum ContainerPortType {
  TCP = 'TCP',
  UDP = 'UDP'
}

export enum ContainerState {
  EXITED = 'EXITED',
  RUNNING = 'RUNNING'
}

export type CreateApiKeyInput = {
  description?: InputMaybe<Scalars['String']['input']>;
  name: Scalars['String']['input'];
  /**  This will replace the existing key if one already exists with the same name, otherwise returns the existing key  */
  overwrite?: InputMaybe<Scalars['Boolean']['input']>;
  permissions?: InputMaybe<Array<AddPermissionInput>>;
  roles?: InputMaybe<Array<Role>>;
};

export type Devices = {
  __typename?: 'Devices';
  gpu?: Maybe<Array<Maybe<Gpu>>>;
  network?: Maybe<Array<Maybe<Network>>>;
  pci?: Maybe<Array<Maybe<Pci>>>;
  usb?: Maybe<Array<Maybe<Usb>>>;
};

export type Disk = {
  __typename?: 'Disk';
  bytesPerSector: Scalars['Long']['output'];
  device: Scalars['String']['output'];
  firmwareRevision: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  interfaceType: DiskInterfaceType;
  name: Scalars['String']['output'];
  partitions?: Maybe<Array<DiskPartition>>;
  sectorsPerTrack: Scalars['Long']['output'];
  serialNum: Scalars['String']['output'];
  size: Scalars['Long']['output'];
  smartStatus: DiskSmartStatus;
  temperature: Scalars['Long']['output'];
  totalCylinders: Scalars['Long']['output'];
  totalHeads: Scalars['Long']['output'];
  totalSectors: Scalars['Long']['output'];
  totalTracks: Scalars['Long']['output'];
  tracksPerCylinder: Scalars['Long']['output'];
  type: Scalars['String']['output'];
  vendor: Scalars['String']['output'];
};

export enum DiskFsType {
  BTRFS = 'btrfs',
  VFAT = 'vfat',
  XFS = 'xfs',
  ZFS = 'zfs'
}

export enum DiskInterfaceType {
  PCIE = 'PCIe',
  SAS = 'SAS',
  SATA = 'SATA',
  UNKNOWN = 'UNKNOWN',
  USB = 'USB'
}

export type DiskPartition = {
  __typename?: 'DiskPartition';
  fsType: DiskFsType;
  name: Scalars['String']['output'];
  size: Scalars['Long']['output'];
};

export enum DiskSmartStatus {
  OK = 'OK',
  UNKNOWN = 'UNKNOWN'
}

export type Display = {
  __typename?: 'Display';
  banner?: Maybe<Scalars['String']['output']>;
  case?: Maybe<Case>;
  critical?: Maybe<Scalars['Int']['output']>;
  dashapps?: Maybe<Scalars['String']['output']>;
  date?: Maybe<Scalars['String']['output']>;
  hot?: Maybe<Scalars['Int']['output']>;
  id: Scalars['ID']['output'];
  locale?: Maybe<Scalars['String']['output']>;
  max?: Maybe<Scalars['Int']['output']>;
  number?: Maybe<Scalars['String']['output']>;
  resize?: Maybe<Scalars['Boolean']['output']>;
  scale?: Maybe<Scalars['Boolean']['output']>;
  tabs?: Maybe<Scalars['Boolean']['output']>;
  text?: Maybe<Scalars['Boolean']['output']>;
  theme?: Maybe<Theme>;
  total?: Maybe<Scalars['Boolean']['output']>;
  unit?: Maybe<Temperature>;
  usage?: Maybe<Scalars['Boolean']['output']>;
  users?: Maybe<Scalars['String']['output']>;
  warning?: Maybe<Scalars['Int']['output']>;
  wwn?: Maybe<Scalars['Boolean']['output']>;
};

export type Docker = Node & {
  __typename?: 'Docker';
  containers?: Maybe<Array<DockerContainer>>;
  id: Scalars['ID']['output'];
  networks?: Maybe<Array<DockerNetwork>>;
};

export type DockerContainer = {
  __typename?: 'DockerContainer';
  autoStart: Scalars['Boolean']['output'];
  command: Scalars['String']['output'];
  created: Scalars['Int']['output'];
  hostConfig?: Maybe<ContainerHostConfig>;
  id: Scalars['ID']['output'];
  image: Scalars['String']['output'];
  imageId: Scalars['String']['output'];
  labels?: Maybe<Scalars['JSON']['output']>;
  mounts?: Maybe<Array<Maybe<Scalars['JSON']['output']>>>;
  names?: Maybe<Array<Scalars['String']['output']>>;
  networkSettings?: Maybe<Scalars['JSON']['output']>;
  ports: Array<ContainerPort>;
  /**  (B) Total size of all the files in the container  */
  sizeRootFs?: Maybe<Scalars['Long']['output']>;
  state: ContainerState;
  status: Scalars['String']['output'];
};

export type DockerNetwork = {
  __typename?: 'DockerNetwork';
  attachable: Scalars['Boolean']['output'];
  configFrom?: Maybe<Scalars['JSON']['output']>;
  configOnly: Scalars['Boolean']['output'];
  containers?: Maybe<Scalars['JSON']['output']>;
  created?: Maybe<Scalars['String']['output']>;
  driver?: Maybe<Scalars['String']['output']>;
  enableIPv6: Scalars['Boolean']['output'];
  id?: Maybe<Scalars['ID']['output']>;
  ingress: Scalars['Boolean']['output'];
  internal: Scalars['Boolean']['output'];
  ipam?: Maybe<Scalars['JSON']['output']>;
  labels?: Maybe<Scalars['JSON']['output']>;
  name?: Maybe<Scalars['String']['output']>;
  options?: Maybe<Scalars['JSON']['output']>;
  scope?: Maybe<Scalars['String']['output']>;
};

export type DynamicRemoteAccessStatus = {
  __typename?: 'DynamicRemoteAccessStatus';
  enabledType: DynamicRemoteAccessType;
  error?: Maybe<Scalars['String']['output']>;
  runningType: DynamicRemoteAccessType;
};

export enum DynamicRemoteAccessType {
  DISABLED = 'DISABLED',
  STATIC = 'STATIC',
  UPNP = 'UPNP'
}

export type EnableDynamicRemoteAccessInput = {
  enabled: Scalars['Boolean']['input'];
  url: AccessUrlInput;
};

export type Flash = {
  __typename?: 'Flash';
  guid?: Maybe<Scalars['String']['output']>;
  product?: Maybe<Scalars['String']['output']>;
  vendor?: Maybe<Scalars['String']['output']>;
};

export type Gpu = {
  __typename?: 'Gpu';
  blacklisted: Scalars['Boolean']['output'];
  class: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  productid: Scalars['String']['output'];
  type: Scalars['String']['output'];
  typeid: Scalars['String']['output'];
  vendorname: Scalars['String']['output'];
};

export enum Importance {
  ALERT = 'ALERT',
  INFO = 'INFO',
  WARNING = 'WARNING'
}

export type Info = Node & {
  __typename?: 'Info';
  /** Count of docker containers */
  apps?: Maybe<InfoApps>;
  baseboard?: Maybe<Baseboard>;
  cpu?: Maybe<InfoCpu>;
  devices?: Maybe<Devices>;
  display?: Maybe<Display>;
  id: Scalars['ID']['output'];
  /** Machine ID */
  machineId?: Maybe<Scalars['ID']['output']>;
  memory?: Maybe<InfoMemory>;
  os?: Maybe<Os>;
  system?: Maybe<System>;
  time: Scalars['DateTime']['output'];
  versions?: Maybe<Versions>;
};

export type InfoApps = {
  __typename?: 'InfoApps';
  /** How many docker containers are installed */
  installed?: Maybe<Scalars['Int']['output']>;
  /** How many docker containers are running */
  started?: Maybe<Scalars['Int']['output']>;
};

export type InfoCpu = {
  __typename?: 'InfoCpu';
  brand: Scalars['String']['output'];
  cache: Scalars['JSON']['output'];
  cores: Scalars['Int']['output'];
  family: Scalars['String']['output'];
  flags?: Maybe<Array<Scalars['String']['output']>>;
  manufacturer: Scalars['String']['output'];
  model: Scalars['String']['output'];
  processors: Scalars['Long']['output'];
  revision: Scalars['String']['output'];
  socket: Scalars['String']['output'];
  speed: Scalars['Float']['output'];
  speedmax: Scalars['Float']['output'];
  speedmin: Scalars['Float']['output'];
  stepping: Scalars['Int']['output'];
  threads: Scalars['Int']['output'];
  vendor: Scalars['String']['output'];
  voltage?: Maybe<Scalars['String']['output']>;
};

export type InfoMemory = {
  __typename?: 'InfoMemory';
  active: Scalars['Long']['output'];
  available: Scalars['Long']['output'];
  buffcache: Scalars['Long']['output'];
  free: Scalars['Long']['output'];
  layout?: Maybe<Array<MemoryLayout>>;
  max: Scalars['Long']['output'];
  swapfree: Scalars['Long']['output'];
  swaptotal: Scalars['Long']['output'];
  swapused: Scalars['Long']['output'];
  total: Scalars['Long']['output'];
  used: Scalars['Long']['output'];
};

export type KeyFile = {
  __typename?: 'KeyFile';
  contents?: Maybe<Scalars['String']['output']>;
  location?: Maybe<Scalars['String']['output']>;
};

/** The current user */
export type Me = UserAccount & {
  __typename?: 'Me';
  description: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
  permissions?: Maybe<Array<Permission>>;
  roles: Array<Role>;
};

export enum MemoryFormFactor {
  DIMM = 'DIMM'
}

export type MemoryLayout = {
  __typename?: 'MemoryLayout';
  bank?: Maybe<Scalars['String']['output']>;
  clockSpeed?: Maybe<Scalars['Long']['output']>;
  formFactor?: Maybe<MemoryFormFactor>;
  manufacturer?: Maybe<Scalars['String']['output']>;
  partNum?: Maybe<Scalars['String']['output']>;
  serialNum?: Maybe<Scalars['String']['output']>;
  size: Scalars['Long']['output'];
  type?: Maybe<MemoryType>;
  voltageConfigured?: Maybe<Scalars['Long']['output']>;
  voltageMax?: Maybe<Scalars['Long']['output']>;
  voltageMin?: Maybe<Scalars['Long']['output']>;
};

export enum MemoryType {
  DDR2 = 'DDR2',
  DDR3 = 'DDR3',
  DDR4 = 'DDR4'
}

export enum MinigraphStatus {
  CONNECTED = 'CONNECTED',
  CONNECTING = 'CONNECTING',
  ERROR_RETRYING = 'ERROR_RETRYING',
  PING_FAILURE = 'PING_FAILURE',
  PRE_INIT = 'PRE_INIT'
}

export type MinigraphqlResponse = {
  __typename?: 'MinigraphqlResponse';
  error?: Maybe<Scalars['String']['output']>;
  status: MinigraphStatus;
  timeout?: Maybe<Scalars['Int']['output']>;
};

export type Mount = {
  __typename?: 'Mount';
  directory?: Maybe<Scalars['String']['output']>;
  name?: Maybe<Scalars['String']['output']>;
  permissions?: Maybe<Scalars['String']['output']>;
  type?: Maybe<Scalars['String']['output']>;
};

export type Mutation = {
  __typename?: 'Mutation';
  /** Add new disk to array */
  addDiskToArray?: Maybe<ArrayType>;
  addPermission: Scalars['Boolean']['output'];
  addRoleForApiKey: Scalars['Boolean']['output'];
  addRoleForUser: Scalars['Boolean']['output'];
  /** Add a new user */
  addUser?: Maybe<User>;
  archiveAll: NotificationOverview;
  /** Marks a notification as archived. */
  archiveNotification: Notification;
  archiveNotifications: NotificationOverview;
  /** Cancel parity check */
  cancelParityCheck?: Maybe<Scalars['JSON']['output']>;
  clearArrayDiskStatistics?: Maybe<Scalars['JSON']['output']>;
  connectSignIn: Scalars['Boolean']['output'];
  connectSignOut: Scalars['Boolean']['output'];
  createApiKey: ApiKeyWithSecret;
  createNotification: Notification;
  /** Deletes all archived notifications on server. */
  deleteArchivedNotifications: NotificationOverview;
  deleteNotification: NotificationOverview;
  /** Delete a user */
  deleteUser?: Maybe<User>;
  enableDynamicRemoteAccess: Scalars['Boolean']['output'];
  login?: Maybe<Scalars['String']['output']>;
  mountArrayDisk?: Maybe<Disk>;
  /** Pause parity check */
  pauseParityCheck?: Maybe<Scalars['JSON']['output']>;
  reboot?: Maybe<Scalars['String']['output']>;
  /** Reads each notification to recompute & update the overview. */
  recalculateOverview: NotificationOverview;
  /** Remove existing disk from array. NOTE: The array must be stopped before running this otherwise it'll throw an error. */
  removeDiskFromArray?: Maybe<ArrayType>;
  removeRoleFromApiKey: Scalars['Boolean']['output'];
  /** Resume parity check */
  resumeParityCheck?: Maybe<Scalars['JSON']['output']>;
  setAdditionalAllowedOrigins: Array<Scalars['String']['output']>;
  setupRemoteAccess: Scalars['Boolean']['output'];
  shutdown?: Maybe<Scalars['String']['output']>;
  /** Start array */
  startArray?: Maybe<ArrayType>;
  /** Start parity check */
  startParityCheck?: Maybe<Scalars['JSON']['output']>;
  /** Stop array */
  stopArray?: Maybe<ArrayType>;
  unarchiveAll: NotificationOverview;
  unarchiveNotifications: NotificationOverview;
  unmountArrayDisk?: Maybe<Disk>;
  /** Marks a notification as unread. */
  unreadNotification: Notification;
};


export type MutationaddDiskToArrayArgs = {
  input?: InputMaybe<arrayDiskInput>;
};


export type MutationaddPermissionArgs = {
  input: AddPermissionInput;
};


export type MutationaddRoleForApiKeyArgs = {
  input: AddRoleForApiKeyInput;
};


export type MutationaddRoleForUserArgs = {
  input: AddRoleForUserInput;
};


export type MutationaddUserArgs = {
  input: addUserInput;
};


export type MutationarchiveAllArgs = {
  importance?: InputMaybe<Importance>;
};


export type MutationarchiveNotificationArgs = {
  id: Scalars['String']['input'];
};


export type MutationarchiveNotificationsArgs = {
  ids?: InputMaybe<Array<Scalars['String']['input']>>;
};


export type MutationclearArrayDiskStatisticsArgs = {
  id: Scalars['ID']['input'];
};


export type MutationconnectSignInArgs = {
  input: ConnectSignInInput;
};


export type MutationcreateApiKeyArgs = {
  input: CreateApiKeyInput;
};


export type MutationcreateNotificationArgs = {
  input: NotificationData;
};


export type MutationdeleteNotificationArgs = {
  id: Scalars['String']['input'];
  type: NotificationType;
};


export type MutationdeleteUserArgs = {
  input: deleteUserInput;
};


export type MutationenableDynamicRemoteAccessArgs = {
  input: EnableDynamicRemoteAccessInput;
};


export type MutationloginArgs = {
  password: Scalars['String']['input'];
  username: Scalars['String']['input'];
};


export type MutationmountArrayDiskArgs = {
  id: Scalars['ID']['input'];
};


export type MutationremoveDiskFromArrayArgs = {
  input?: InputMaybe<arrayDiskInput>;
};


export type MutationremoveRoleFromApiKeyArgs = {
  input: RemoveRoleFromApiKeyInput;
};


export type MutationsetAdditionalAllowedOriginsArgs = {
  input: AllowedOriginInput;
};


export type MutationsetupRemoteAccessArgs = {
  input: SetupRemoteAccessInput;
};


export type MutationstartParityCheckArgs = {
  correct?: InputMaybe<Scalars['Boolean']['input']>;
};


export type MutationunarchiveAllArgs = {
  importance?: InputMaybe<Importance>;
};


export type MutationunarchiveNotificationsArgs = {
  ids?: InputMaybe<Array<Scalars['String']['input']>>;
};


export type MutationunmountArrayDiskArgs = {
  id: Scalars['ID']['input'];
};


export type MutationunreadNotificationArgs = {
  id: Scalars['String']['input'];
};

export type Network = Node & {
  __typename?: 'Network';
  accessUrls?: Maybe<Array<AccessUrl>>;
  carrierChanges?: Maybe<Scalars['String']['output']>;
  duplex?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  iface?: Maybe<Scalars['String']['output']>;
  ifaceName?: Maybe<Scalars['String']['output']>;
  internal?: Maybe<Scalars['String']['output']>;
  ipv4?: Maybe<Scalars['String']['output']>;
  ipv6?: Maybe<Scalars['String']['output']>;
  mac?: Maybe<Scalars['String']['output']>;
  mtu?: Maybe<Scalars['String']['output']>;
  operstate?: Maybe<Scalars['String']['output']>;
  speed?: Maybe<Scalars['String']['output']>;
  type?: Maybe<Scalars['String']['output']>;
};

export type Node = {
  id: Scalars['ID']['output'];
};

export type Notification = Node & {
  __typename?: 'Notification';
  description: Scalars['String']['output'];
  formattedTimestamp?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  importance: Importance;
  link?: Maybe<Scalars['String']['output']>;
  subject: Scalars['String']['output'];
  /** ISO Timestamp for when the notification occurred */
  timestamp?: Maybe<Scalars['String']['output']>;
  /** Also known as 'event' */
  title: Scalars['String']['output'];
  type: NotificationType;
};

export type NotificationCounts = {
  __typename?: 'NotificationCounts';
  alert: Scalars['Int']['output'];
  info: Scalars['Int']['output'];
  total: Scalars['Int']['output'];
  warning: Scalars['Int']['output'];
};

export type NotificationData = {
  description: Scalars['String']['input'];
  importance: Importance;
  link?: InputMaybe<Scalars['String']['input']>;
  subject: Scalars['String']['input'];
  title: Scalars['String']['input'];
};

export type NotificationFilter = {
  importance?: InputMaybe<Importance>;
  limit: Scalars['Int']['input'];
  offset: Scalars['Int']['input'];
  type?: InputMaybe<NotificationType>;
};

export type NotificationOverview = {
  __typename?: 'NotificationOverview';
  archive: NotificationCounts;
  unread: NotificationCounts;
};

export enum NotificationType {
  ARCHIVE = 'ARCHIVE',
  UNREAD = 'UNREAD'
}

export type Notifications = Node & {
  __typename?: 'Notifications';
  id: Scalars['ID']['output'];
  list: Array<Notification>;
  /** A cached overview of the notifications in the system & their severity. */
  overview: NotificationOverview;
};


export type NotificationslistArgs = {
  filter: NotificationFilter;
};

export type Os = {
  __typename?: 'Os';
  arch?: Maybe<Scalars['String']['output']>;
  build?: Maybe<Scalars['String']['output']>;
  codename?: Maybe<Scalars['String']['output']>;
  codepage?: Maybe<Scalars['String']['output']>;
  distro?: Maybe<Scalars['String']['output']>;
  hostname?: Maybe<Scalars['String']['output']>;
  kernel?: Maybe<Scalars['String']['output']>;
  logofile?: Maybe<Scalars['String']['output']>;
  platform?: Maybe<Scalars['String']['output']>;
  release?: Maybe<Scalars['String']['output']>;
  serial?: Maybe<Scalars['String']['output']>;
  uptime?: Maybe<Scalars['DateTime']['output']>;
};

export type Owner = {
  __typename?: 'Owner';
  avatar?: Maybe<Scalars['String']['output']>;
  url?: Maybe<Scalars['String']['output']>;
  username?: Maybe<Scalars['String']['output']>;
};

export type ParityCheck = {
  __typename?: 'ParityCheck';
  date: Scalars['String']['output'];
  duration: Scalars['Int']['output'];
  errors: Scalars['String']['output'];
  speed: Scalars['String']['output'];
  status: Scalars['String']['output'];
};

export type Partition = {
  __typename?: 'Partition';
  devlinks?: Maybe<Scalars['String']['output']>;
  devname?: Maybe<Scalars['String']['output']>;
  devpath?: Maybe<Scalars['String']['output']>;
  devtype?: Maybe<Scalars['String']['output']>;
  idAta?: Maybe<Scalars['String']['output']>;
  idAtaDownloadMicrocode?: Maybe<Scalars['String']['output']>;
  idAtaFeatureSetAam?: Maybe<Scalars['String']['output']>;
  idAtaFeatureSetAamCurrentValue?: Maybe<Scalars['String']['output']>;
  idAtaFeatureSetAamEnabled?: Maybe<Scalars['String']['output']>;
  idAtaFeatureSetAamVendorRecommendedValue?: Maybe<Scalars['String']['output']>;
  idAtaFeatureSetApm?: Maybe<Scalars['String']['output']>;
  idAtaFeatureSetApmCurrentValue?: Maybe<Scalars['String']['output']>;
  idAtaFeatureSetApmEnabled?: Maybe<Scalars['String']['output']>;
  idAtaFeatureSetHpa?: Maybe<Scalars['String']['output']>;
  idAtaFeatureSetHpaEnabled?: Maybe<Scalars['String']['output']>;
  idAtaFeatureSetPm?: Maybe<Scalars['String']['output']>;
  idAtaFeatureSetPmEnabled?: Maybe<Scalars['String']['output']>;
  idAtaFeatureSetPuis?: Maybe<Scalars['String']['output']>;
  idAtaFeatureSetPuisEnabled?: Maybe<Scalars['String']['output']>;
  idAtaFeatureSetSecurity?: Maybe<Scalars['String']['output']>;
  idAtaFeatureSetSecurityEnabled?: Maybe<Scalars['String']['output']>;
  idAtaFeatureSetSecurityEnhancedEraseUnitMin?: Maybe<Scalars['String']['output']>;
  idAtaFeatureSetSecurityEraseUnitMin?: Maybe<Scalars['String']['output']>;
  idAtaFeatureSetSmart?: Maybe<Scalars['String']['output']>;
  idAtaFeatureSetSmartEnabled?: Maybe<Scalars['String']['output']>;
  idAtaRotationRateRpm?: Maybe<Scalars['String']['output']>;
  idAtaSata?: Maybe<Scalars['String']['output']>;
  idAtaSataSignalRateGen1?: Maybe<Scalars['String']['output']>;
  idAtaSataSignalRateGen2?: Maybe<Scalars['String']['output']>;
  idAtaWriteCache?: Maybe<Scalars['String']['output']>;
  idAtaWriteCacheEnabled?: Maybe<Scalars['String']['output']>;
  idBus?: Maybe<Scalars['String']['output']>;
  idFsType?: Maybe<Scalars['String']['output']>;
  idFsUsage?: Maybe<Scalars['String']['output']>;
  idFsUuid?: Maybe<Scalars['String']['output']>;
  idFsUuidEnc?: Maybe<Scalars['String']['output']>;
  idModel?: Maybe<Scalars['String']['output']>;
  idModelEnc?: Maybe<Scalars['String']['output']>;
  idPartEntryDisk?: Maybe<Scalars['String']['output']>;
  idPartEntryNumber?: Maybe<Scalars['String']['output']>;
  idPartEntryOffset?: Maybe<Scalars['String']['output']>;
  idPartEntryScheme?: Maybe<Scalars['String']['output']>;
  idPartEntrySize?: Maybe<Scalars['String']['output']>;
  idPartEntryType?: Maybe<Scalars['String']['output']>;
  idPartTableType?: Maybe<Scalars['String']['output']>;
  idPath?: Maybe<Scalars['String']['output']>;
  idPathTag?: Maybe<Scalars['String']['output']>;
  idRevision?: Maybe<Scalars['String']['output']>;
  idSerial?: Maybe<Scalars['String']['output']>;
  idSerialShort?: Maybe<Scalars['String']['output']>;
  idType?: Maybe<Scalars['String']['output']>;
  idWwn?: Maybe<Scalars['String']['output']>;
  idWwnWithExtension?: Maybe<Scalars['String']['output']>;
  major?: Maybe<Scalars['String']['output']>;
  minor?: Maybe<Scalars['String']['output']>;
  partn?: Maybe<Scalars['String']['output']>;
  subsystem?: Maybe<Scalars['String']['output']>;
  usecInitialized?: Maybe<Scalars['String']['output']>;
};

export type Pci = {
  __typename?: 'Pci';
  blacklisted?: Maybe<Scalars['String']['output']>;
  class?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  productid?: Maybe<Scalars['String']['output']>;
  productname?: Maybe<Scalars['String']['output']>;
  type?: Maybe<Scalars['String']['output']>;
  typeid?: Maybe<Scalars['String']['output']>;
  vendorid?: Maybe<Scalars['String']['output']>;
  vendorname?: Maybe<Scalars['String']['output']>;
};

export type Permission = {
  __typename?: 'Permission';
  actions: Array<Scalars['String']['output']>;
  resource: Resource;
};

export type ProfileModel = {
  __typename?: 'ProfileModel';
  avatar?: Maybe<Scalars['String']['output']>;
  url?: Maybe<Scalars['String']['output']>;
  userId?: Maybe<Scalars['ID']['output']>;
  username?: Maybe<Scalars['String']['output']>;
};

export type Query = {
  __typename?: 'Query';
  apiKey?: Maybe<ApiKey>;
  apiKeys: Array<ApiKey>;
  /** An Unraid array consisting of 1 or 2 Parity disks and a number of Data disks. */
  array: ArrayType;
  cloud?: Maybe<Cloud>;
  config: Config;
  connect: Connect;
  connectSettingsForm: ConnectSettings;
  /** Single disk */
  disk?: Maybe<Disk>;
  /** Mulitiple disks */
  disks: Array<Maybe<Disk>>;
  display?: Maybe<Display>;
  docker: Docker;
  /** All Docker containers */
  dockerContainers: Array<DockerContainer>;
  /** Docker network */
  dockerNetwork: DockerNetwork;
  /** All Docker networks */
  dockerNetworks: Array<Maybe<DockerNetwork>>;
  extraAllowedOrigins: Array<Scalars['String']['output']>;
  flash?: Maybe<Flash>;
  info?: Maybe<Info>;
  /** Current user account */
  me?: Maybe<Me>;
  network?: Maybe<Network>;
  notifications: Notifications;
  online?: Maybe<Scalars['Boolean']['output']>;
  owner?: Maybe<Owner>;
  parityHistory?: Maybe<Array<Maybe<ParityCheck>>>;
  registration?: Maybe<Registration>;
  remoteAccess: RemoteAccess;
  server?: Maybe<Server>;
  servers: Array<Server>;
  services: Array<Service>;
  /** Network Shares */
  shares?: Maybe<Array<Maybe<Share>>>;
  unassignedDevices?: Maybe<Array<Maybe<UnassignedDevice>>>;
  /** User account */
  user?: Maybe<User>;
  /** User accounts */
  users: Array<User>;
  vars?: Maybe<Vars>;
  /** Virtual machines */
  vms?: Maybe<Vms>;
};


export type QueryapiKeyArgs = {
  id: Scalars['ID']['input'];
};


export type QuerydiskArgs = {
  id: Scalars['ID']['input'];
};


export type QuerydockerContainersArgs = {
  all?: InputMaybe<Scalars['Boolean']['input']>;
};


export type QuerydockerNetworkArgs = {
  id: Scalars['ID']['input'];
};


export type QuerydockerNetworksArgs = {
  all?: InputMaybe<Scalars['Boolean']['input']>;
};


export type QueryuserArgs = {
  id: Scalars['ID']['input'];
};


export type QueryusersArgs = {
  input?: InputMaybe<usersInput>;
};

export type Registration = {
  __typename?: 'Registration';
  expiration?: Maybe<Scalars['String']['output']>;
  guid?: Maybe<Scalars['String']['output']>;
  keyFile?: Maybe<KeyFile>;
  state?: Maybe<RegistrationState>;
  type?: Maybe<registrationType>;
  updateExpiration?: Maybe<Scalars['String']['output']>;
};

export enum RegistrationState {
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
  LIFETIME = 'LIFETIME',
  PLUS = 'PLUS',
  PRO = 'PRO',
  STARTER = 'STARTER',
  TRIAL = 'TRIAL',
  UNLEASHED = 'UNLEASHED'
}

export type RelayResponse = {
  __typename?: 'RelayResponse';
  error?: Maybe<Scalars['String']['output']>;
  status: Scalars['String']['output'];
  timeout?: Maybe<Scalars['String']['output']>;
};

export type RemoteAccess = {
  __typename?: 'RemoteAccess';
  accessType: WAN_ACCESS_TYPE;
  forwardType?: Maybe<WAN_FORWARD_TYPE>;
  port?: Maybe<Scalars['Port']['output']>;
};

export type RemoveRoleFromApiKeyInput = {
  apiKeyId: Scalars['ID']['input'];
  role: Role;
};

/** Available resources for permissions */
export enum Resource {
  API_KEY = 'api_key',
  ARRAY = 'array',
  CLOUD = 'cloud',
  CONFIG = 'config',
  CONNECT = 'connect',
  CONNECT__REMOTE_ACCESS = 'connect__remote_access',
  CUSTOMIZATIONS = 'customizations',
  DASHBOARD = 'dashboard',
  DISK = 'disk',
  DISPLAY = 'display',
  DOCKER = 'docker',
  FLASH = 'flash',
  INFO = 'info',
  LOGS = 'logs',
  ME = 'me',
  NETWORK = 'network',
  NOTIFICATIONS = 'notifications',
  ONLINE = 'online',
  OS = 'os',
  OWNER = 'owner',
  PERMISSION = 'permission',
  REGISTRATION = 'registration',
  SERVERS = 'servers',
  SERVICES = 'services',
  SHARE = 'share',
  VARS = 'vars',
  VMS = 'vms',
  WELCOME = 'welcome'
}

/** Available roles for API keys and users */
export enum Role {
  ADMIN = 'admin',
  CONNECT = 'connect',
  GUEST = 'guest'
}

export type Server = {
  __typename?: 'Server';
  apikey: Scalars['String']['output'];
  guid: Scalars['String']['output'];
  lanip: Scalars['String']['output'];
  localurl: Scalars['String']['output'];
  name: Scalars['String']['output'];
  owner: ProfileModel;
  remoteurl: Scalars['String']['output'];
  status: ServerStatus;
  wanip: Scalars['String']['output'];
};

export enum ServerStatus {
  NEVER_CONNECTED = 'never_connected',
  OFFLINE = 'offline',
  ONLINE = 'online'
}

export type Service = Node & {
  __typename?: 'Service';
  id: Scalars['ID']['output'];
  name?: Maybe<Scalars['String']['output']>;
  online?: Maybe<Scalars['Boolean']['output']>;
  uptime?: Maybe<Uptime>;
  version?: Maybe<Scalars['String']['output']>;
};

export type SetupRemoteAccessInput = {
  accessType: WAN_ACCESS_TYPE;
  forwardType?: InputMaybe<WAN_FORWARD_TYPE>;
  port?: InputMaybe<Scalars['Port']['input']>;
};

/** Network Share */
export type Share = {
  __typename?: 'Share';
  allocator?: Maybe<Scalars['String']['output']>;
  cache?: Maybe<Scalars['Boolean']['output']>;
  color?: Maybe<Scalars['String']['output']>;
  /** User comment */
  comment?: Maybe<Scalars['String']['output']>;
  cow?: Maybe<Scalars['String']['output']>;
  /** Disks that're excluded from this share */
  exclude?: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  floor?: Maybe<Scalars['String']['output']>;
  /** (KB) Free space */
  free?: Maybe<Scalars['Long']['output']>;
  /** Disks that're included in this share */
  include?: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  luksStatus?: Maybe<Scalars['String']['output']>;
  /** Display name */
  name?: Maybe<Scalars['String']['output']>;
  nameOrig?: Maybe<Scalars['String']['output']>;
  /** (KB) Total size */
  size?: Maybe<Scalars['Long']['output']>;
  splitLevel?: Maybe<Scalars['String']['output']>;
  /** (KB) Used Size */
  used?: Maybe<Scalars['Long']['output']>;
};

export type Subscription = {
  __typename?: 'Subscription';
  array: ArrayType;
  config: Config;
  display?: Maybe<Display>;
  dockerContainer: DockerContainer;
  dockerContainers?: Maybe<Array<Maybe<DockerContainer>>>;
  dockerNetwork: DockerNetwork;
  dockerNetworks: Array<Maybe<DockerNetwork>>;
  flash: Flash;
  info: Info;
  me?: Maybe<Me>;
  notificationAdded: Notification;
  notificationsOverview: NotificationOverview;
  online: Scalars['Boolean']['output'];
  owner: Owner;
  parityHistory: ParityCheck;
  ping: Scalars['String']['output'];
  registration: Registration;
  server?: Maybe<Server>;
  service?: Maybe<Array<Service>>;
  share: Share;
  shares?: Maybe<Array<Share>>;
  unassignedDevices?: Maybe<Array<UnassignedDevice>>;
  user: User;
  users: Array<Maybe<User>>;
  vars: Vars;
  vms?: Maybe<Vms>;
};


export type SubscriptiondockerContainerArgs = {
  id: Scalars['ID']['input'];
};


export type SubscriptiondockerNetworkArgs = {
  id: Scalars['ID']['input'];
};


export type SubscriptionserviceArgs = {
  name: Scalars['String']['input'];
};


export type SubscriptionshareArgs = {
  id: Scalars['ID']['input'];
};


export type SubscriptionuserArgs = {
  id: Scalars['ID']['input'];
};

export type System = {
  __typename?: 'System';
  manufacturer?: Maybe<Scalars['String']['output']>;
  model?: Maybe<Scalars['String']['output']>;
  serial?: Maybe<Scalars['String']['output']>;
  sku?: Maybe<Scalars['String']['output']>;
  uuid?: Maybe<Scalars['String']['output']>;
  version?: Maybe<Scalars['String']['output']>;
};

export enum Temperature {
  C = 'C',
  F = 'F'
}

export enum Theme {
  WHITE = 'white'
}

export enum URL_TYPE {
  DEFAULT = 'DEFAULT',
  LAN = 'LAN',
  MDNS = 'MDNS',
  OTHER = 'OTHER',
  WAN = 'WAN',
  WIREGUARD = 'WIREGUARD'
}

export type UnassignedDevice = {
  __typename?: 'UnassignedDevice';
  devlinks?: Maybe<Scalars['String']['output']>;
  devname?: Maybe<Scalars['String']['output']>;
  devpath?: Maybe<Scalars['String']['output']>;
  devtype?: Maybe<Scalars['String']['output']>;
  idAta?: Maybe<Scalars['String']['output']>;
  idAtaDownloadMicrocode?: Maybe<Scalars['String']['output']>;
  idAtaFeatureSetAam?: Maybe<Scalars['String']['output']>;
  idAtaFeatureSetAamCurrentValue?: Maybe<Scalars['String']['output']>;
  idAtaFeatureSetAamEnabled?: Maybe<Scalars['String']['output']>;
  idAtaFeatureSetAamVendorRecommendedValue?: Maybe<Scalars['String']['output']>;
  idAtaFeatureSetApm?: Maybe<Scalars['String']['output']>;
  idAtaFeatureSetApmCurrentValue?: Maybe<Scalars['String']['output']>;
  idAtaFeatureSetApmEnabled?: Maybe<Scalars['String']['output']>;
  idAtaFeatureSetHpa?: Maybe<Scalars['String']['output']>;
  idAtaFeatureSetHpaEnabled?: Maybe<Scalars['String']['output']>;
  idAtaFeatureSetPm?: Maybe<Scalars['String']['output']>;
  idAtaFeatureSetPmEnabled?: Maybe<Scalars['String']['output']>;
  idAtaFeatureSetPuis?: Maybe<Scalars['String']['output']>;
  idAtaFeatureSetPuisEnabled?: Maybe<Scalars['String']['output']>;
  idAtaFeatureSetSecurity?: Maybe<Scalars['String']['output']>;
  idAtaFeatureSetSecurityEnabled?: Maybe<Scalars['String']['output']>;
  idAtaFeatureSetSecurityEnhancedEraseUnitMin?: Maybe<Scalars['String']['output']>;
  idAtaFeatureSetSecurityEraseUnitMin?: Maybe<Scalars['String']['output']>;
  idAtaFeatureSetSmart?: Maybe<Scalars['String']['output']>;
  idAtaFeatureSetSmartEnabled?: Maybe<Scalars['String']['output']>;
  idAtaRotationRateRpm?: Maybe<Scalars['String']['output']>;
  idAtaSata?: Maybe<Scalars['String']['output']>;
  idAtaSataSignalRateGen1?: Maybe<Scalars['String']['output']>;
  idAtaSataSignalRateGen2?: Maybe<Scalars['String']['output']>;
  idAtaWriteCache?: Maybe<Scalars['String']['output']>;
  idAtaWriteCacheEnabled?: Maybe<Scalars['String']['output']>;
  idBus?: Maybe<Scalars['String']['output']>;
  idModel?: Maybe<Scalars['String']['output']>;
  idModelEnc?: Maybe<Scalars['String']['output']>;
  idPartTableType?: Maybe<Scalars['String']['output']>;
  idPath?: Maybe<Scalars['String']['output']>;
  idPathTag?: Maybe<Scalars['String']['output']>;
  idRevision?: Maybe<Scalars['String']['output']>;
  idSerial?: Maybe<Scalars['String']['output']>;
  idSerialShort?: Maybe<Scalars['String']['output']>;
  idType?: Maybe<Scalars['String']['output']>;
  idWwn?: Maybe<Scalars['String']['output']>;
  idWwnWithExtension?: Maybe<Scalars['String']['output']>;
  major?: Maybe<Scalars['String']['output']>;
  minor?: Maybe<Scalars['String']['output']>;
  mount?: Maybe<Mount>;
  mounted?: Maybe<Scalars['Boolean']['output']>;
  name?: Maybe<Scalars['String']['output']>;
  partitions?: Maybe<Array<Maybe<Partition>>>;
  subsystem?: Maybe<Scalars['String']['output']>;
  temp?: Maybe<Scalars['Int']['output']>;
  usecInitialized?: Maybe<Scalars['String']['output']>;
};

export type Uptime = {
  __typename?: 'Uptime';
  timestamp?: Maybe<Scalars['String']['output']>;
};

export type Usb = {
  __typename?: 'Usb';
  id: Scalars['ID']['output'];
  name?: Maybe<Scalars['String']['output']>;
};

/** A local user account */
export type User = UserAccount & {
  __typename?: 'User';
  description: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  /** A unique name for the user */
  name: Scalars['String']['output'];
  /** If the account has a password set */
  password?: Maybe<Scalars['Boolean']['output']>;
  permissions?: Maybe<Array<Permission>>;
  roles: Array<Role>;
};

export type UserAccount = {
  description: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
  permissions?: Maybe<Array<Permission>>;
  roles: Array<Role>;
};

export type Vars = Node & {
  __typename?: 'Vars';
  bindMgt?: Maybe<Scalars['Boolean']['output']>;
  cacheNumDevices?: Maybe<Scalars['Int']['output']>;
  cacheSbNumDisks?: Maybe<Scalars['Int']['output']>;
  comment?: Maybe<Scalars['String']['output']>;
  configError?: Maybe<ConfigErrorState>;
  configValid?: Maybe<Scalars['Boolean']['output']>;
  csrfToken?: Maybe<Scalars['String']['output']>;
  defaultFormat?: Maybe<Scalars['String']['output']>;
  defaultFsType?: Maybe<Scalars['String']['output']>;
  deviceCount?: Maybe<Scalars['Int']['output']>;
  domain?: Maybe<Scalars['String']['output']>;
  domainLogin?: Maybe<Scalars['String']['output']>;
  domainShort?: Maybe<Scalars['String']['output']>;
  enableFruit?: Maybe<Scalars['String']['output']>;
  flashGuid?: Maybe<Scalars['String']['output']>;
  flashProduct?: Maybe<Scalars['String']['output']>;
  flashVendor?: Maybe<Scalars['String']['output']>;
  /** Percentage from 0 - 100 while upgrading a disk or swapping parity drives */
  fsCopyPrcnt?: Maybe<Scalars['Int']['output']>;
  fsNumMounted?: Maybe<Scalars['Int']['output']>;
  fsNumUnmountable?: Maybe<Scalars['Int']['output']>;
  /** Human friendly string of array events happening */
  fsProgress?: Maybe<Scalars['String']['output']>;
  fsState?: Maybe<Scalars['String']['output']>;
  fsUnmountableMask?: Maybe<Scalars['String']['output']>;
  fuseDirectio?: Maybe<Scalars['String']['output']>;
  fuseDirectioDefault?: Maybe<Scalars['String']['output']>;
  fuseDirectioStatus?: Maybe<Scalars['String']['output']>;
  fuseRemember?: Maybe<Scalars['String']['output']>;
  fuseRememberDefault?: Maybe<Scalars['String']['output']>;
  fuseRememberStatus?: Maybe<Scalars['String']['output']>;
  hideDotFiles?: Maybe<Scalars['Boolean']['output']>;
  id: Scalars['ID']['output'];
  joinStatus?: Maybe<Scalars['String']['output']>;
  localMaster?: Maybe<Scalars['Boolean']['output']>;
  localTld?: Maybe<Scalars['String']['output']>;
  luksKeyfile?: Maybe<Scalars['String']['output']>;
  maxArraysz?: Maybe<Scalars['Int']['output']>;
  maxCachesz?: Maybe<Scalars['Int']['output']>;
  mdColor?: Maybe<Scalars['String']['output']>;
  mdNumDisabled?: Maybe<Scalars['Int']['output']>;
  mdNumDisks?: Maybe<Scalars['Int']['output']>;
  mdNumErased?: Maybe<Scalars['Int']['output']>;
  mdNumInvalid?: Maybe<Scalars['Int']['output']>;
  mdNumMissing?: Maybe<Scalars['Int']['output']>;
  mdNumNew?: Maybe<Scalars['Int']['output']>;
  mdNumStripes?: Maybe<Scalars['Int']['output']>;
  mdNumStripesDefault?: Maybe<Scalars['Int']['output']>;
  mdNumStripesStatus?: Maybe<Scalars['String']['output']>;
  mdResync?: Maybe<Scalars['Int']['output']>;
  mdResyncAction?: Maybe<Scalars['String']['output']>;
  mdResyncCorr?: Maybe<Scalars['String']['output']>;
  mdResyncDb?: Maybe<Scalars['String']['output']>;
  mdResyncDt?: Maybe<Scalars['String']['output']>;
  mdResyncPos?: Maybe<Scalars['String']['output']>;
  mdResyncSize?: Maybe<Scalars['Int']['output']>;
  mdState?: Maybe<Scalars['String']['output']>;
  mdSyncThresh?: Maybe<Scalars['Int']['output']>;
  mdSyncThreshDefault?: Maybe<Scalars['Int']['output']>;
  mdSyncThreshStatus?: Maybe<Scalars['String']['output']>;
  mdSyncWindow?: Maybe<Scalars['Int']['output']>;
  mdSyncWindowDefault?: Maybe<Scalars['Int']['output']>;
  mdSyncWindowStatus?: Maybe<Scalars['String']['output']>;
  mdVersion?: Maybe<Scalars['String']['output']>;
  mdWriteMethod?: Maybe<Scalars['Int']['output']>;
  mdWriteMethodDefault?: Maybe<Scalars['String']['output']>;
  mdWriteMethodStatus?: Maybe<Scalars['String']['output']>;
  /** Machine hostname */
  name?: Maybe<Scalars['String']['output']>;
  nrRequests?: Maybe<Scalars['Int']['output']>;
  nrRequestsDefault?: Maybe<Scalars['Int']['output']>;
  nrRequestsStatus?: Maybe<Scalars['String']['output']>;
  /** NTP Server 1 */
  ntpServer1?: Maybe<Scalars['String']['output']>;
  /** NTP Server 2 */
  ntpServer2?: Maybe<Scalars['String']['output']>;
  /** NTP Server 3 */
  ntpServer3?: Maybe<Scalars['String']['output']>;
  /** NTP Server 4 */
  ntpServer4?: Maybe<Scalars['String']['output']>;
  pollAttributes?: Maybe<Scalars['String']['output']>;
  pollAttributesDefault?: Maybe<Scalars['String']['output']>;
  pollAttributesStatus?: Maybe<Scalars['String']['output']>;
  /** Port for the webui via HTTP */
  port?: Maybe<Scalars['Int']['output']>;
  portssh?: Maybe<Scalars['Int']['output']>;
  /** Port for the webui via HTTPS */
  portssl?: Maybe<Scalars['Int']['output']>;
  porttelnet?: Maybe<Scalars['Int']['output']>;
  queueDepth?: Maybe<Scalars['String']['output']>;
  regCheck?: Maybe<Scalars['String']['output']>;
  regFile?: Maybe<Scalars['String']['output']>;
  regGen?: Maybe<Scalars['String']['output']>;
  regGuid?: Maybe<Scalars['String']['output']>;
  regState?: Maybe<RegistrationState>;
  regTm?: Maybe<Scalars['String']['output']>;
  regTm2?: Maybe<Scalars['String']['output']>;
  /** Registration owner */
  regTo?: Maybe<Scalars['String']['output']>;
  regTy?: Maybe<Scalars['String']['output']>;
  safeMode?: Maybe<Scalars['Boolean']['output']>;
  sbClean?: Maybe<Scalars['Boolean']['output']>;
  sbEvents?: Maybe<Scalars['Int']['output']>;
  sbName?: Maybe<Scalars['String']['output']>;
  sbNumDisks?: Maybe<Scalars['Int']['output']>;
  sbState?: Maybe<Scalars['String']['output']>;
  sbSyncErrs?: Maybe<Scalars['Int']['output']>;
  sbSyncExit?: Maybe<Scalars['String']['output']>;
  sbSynced?: Maybe<Scalars['Int']['output']>;
  sbSynced2?: Maybe<Scalars['Int']['output']>;
  sbUpdated?: Maybe<Scalars['String']['output']>;
  sbVersion?: Maybe<Scalars['String']['output']>;
  security?: Maybe<Scalars['String']['output']>;
  /** Total amount shares with AFP enabled */
  shareAfpCount?: Maybe<Scalars['Int']['output']>;
  shareAfpEnabled?: Maybe<Scalars['Boolean']['output']>;
  shareAvahiAfpModel?: Maybe<Scalars['String']['output']>;
  shareAvahiAfpName?: Maybe<Scalars['String']['output']>;
  shareAvahiEnabled?: Maybe<Scalars['Boolean']['output']>;
  shareAvahiSmbModel?: Maybe<Scalars['String']['output']>;
  shareAvahiSmbName?: Maybe<Scalars['String']['output']>;
  shareCacheEnabled?: Maybe<Scalars['Boolean']['output']>;
  shareCacheFloor?: Maybe<Scalars['String']['output']>;
  /** Total amount of user shares */
  shareCount?: Maybe<Scalars['Int']['output']>;
  shareDisk?: Maybe<Scalars['String']['output']>;
  shareInitialGroup?: Maybe<Scalars['String']['output']>;
  shareInitialOwner?: Maybe<Scalars['String']['output']>;
  shareMoverActive?: Maybe<Scalars['Boolean']['output']>;
  shareMoverLogging?: Maybe<Scalars['Boolean']['output']>;
  shareMoverSchedule?: Maybe<Scalars['String']['output']>;
  /** Total amount shares with NFS enabled */
  shareNfsCount?: Maybe<Scalars['Int']['output']>;
  shareNfsEnabled?: Maybe<Scalars['Boolean']['output']>;
  /** Total amount shares with SMB enabled */
  shareSmbCount?: Maybe<Scalars['Int']['output']>;
  shareSmbEnabled?: Maybe<Scalars['Boolean']['output']>;
  shareUser?: Maybe<Scalars['String']['output']>;
  shareUserExclude?: Maybe<Scalars['String']['output']>;
  shareUserInclude?: Maybe<Scalars['String']['output']>;
  shutdownTimeout?: Maybe<Scalars['Int']['output']>;
  spindownDelay?: Maybe<Scalars['String']['output']>;
  spinupGroups?: Maybe<Scalars['Boolean']['output']>;
  startArray?: Maybe<Scalars['Boolean']['output']>;
  startMode?: Maybe<Scalars['String']['output']>;
  startPage?: Maybe<Scalars['String']['output']>;
  sysArraySlots?: Maybe<Scalars['Int']['output']>;
  sysCacheSlots?: Maybe<Scalars['Int']['output']>;
  sysFlashSlots?: Maybe<Scalars['Int']['output']>;
  sysModel?: Maybe<Scalars['String']['output']>;
  timeZone?: Maybe<Scalars['String']['output']>;
  /** Should a NTP server be used for time sync? */
  useNtp?: Maybe<Scalars['Boolean']['output']>;
  useSsh?: Maybe<Scalars['Boolean']['output']>;
  useSsl?: Maybe<Scalars['Boolean']['output']>;
  /** Should telnet be enabled? */
  useTelnet?: Maybe<Scalars['Boolean']['output']>;
  /** Unraid version */
  version?: Maybe<Scalars['String']['output']>;
  workgroup?: Maybe<Scalars['String']['output']>;
};

export type Versions = {
  __typename?: 'Versions';
  apache?: Maybe<Scalars['String']['output']>;
  docker?: Maybe<Scalars['String']['output']>;
  gcc?: Maybe<Scalars['String']['output']>;
  git?: Maybe<Scalars['String']['output']>;
  grunt?: Maybe<Scalars['String']['output']>;
  gulp?: Maybe<Scalars['String']['output']>;
  kernel?: Maybe<Scalars['String']['output']>;
  mongodb?: Maybe<Scalars['String']['output']>;
  mysql?: Maybe<Scalars['String']['output']>;
  nginx?: Maybe<Scalars['String']['output']>;
  node?: Maybe<Scalars['String']['output']>;
  npm?: Maybe<Scalars['String']['output']>;
  openssl?: Maybe<Scalars['String']['output']>;
  perl?: Maybe<Scalars['String']['output']>;
  php?: Maybe<Scalars['String']['output']>;
  pm2?: Maybe<Scalars['String']['output']>;
  postfix?: Maybe<Scalars['String']['output']>;
  postgresql?: Maybe<Scalars['String']['output']>;
  python?: Maybe<Scalars['String']['output']>;
  redis?: Maybe<Scalars['String']['output']>;
  systemOpenssl?: Maybe<Scalars['String']['output']>;
  systemOpensslLib?: Maybe<Scalars['String']['output']>;
  tsc?: Maybe<Scalars['String']['output']>;
  unraid?: Maybe<Scalars['String']['output']>;
  v8?: Maybe<Scalars['String']['output']>;
  yarn?: Maybe<Scalars['String']['output']>;
};

/** A virtual machine */
export type VmDomain = {
  __typename?: 'VmDomain';
  /** A friendly name for the vm */
  name?: Maybe<Scalars['String']['output']>;
  /** Current domain vm state */
  state: VmState;
  uuid: Scalars['ID']['output'];
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
  id: Scalars['ID']['output'];
};

export enum WAN_ACCESS_TYPE {
  ALWAYS = 'ALWAYS',
  DISABLED = 'DISABLED',
  DYNAMIC = 'DYNAMIC'
}

export enum WAN_FORWARD_TYPE {
  STATIC = 'STATIC',
  UPNP = 'UPNP'
}

export type Welcome = {
  __typename?: 'Welcome';
  message: Scalars['String']['output'];
};

export type addUserInput = {
  description?: InputMaybe<Scalars['String']['input']>;
  name: Scalars['String']['input'];
  password: Scalars['String']['input'];
};

export type arrayDiskInput = {
  /** Disk ID */
  id: Scalars['ID']['input'];
  /** The slot for the disk */
  slot?: InputMaybe<Scalars['Int']['input']>;
};

export type deleteUserInput = {
  name: Scalars['String']['input'];
};

export enum mdState {
  STARTED = 'STARTED',
  SWAP_DSBL = 'SWAP_DSBL'
}

export enum registrationType {
  BASIC = 'BASIC',
  INVALID = 'INVALID',
  LIFETIME = 'LIFETIME',
  PLUS = 'PLUS',
  PRO = 'PRO',
  STARTER = 'STARTER',
  TRIAL = 'TRIAL',
  UNLEASHED = 'UNLEASHED'
}

export type usersInput = {
  slim?: InputMaybe<Scalars['Boolean']['input']>;
};

export type WithIndex<TObject> = TObject & Record<string, any>;
export type ResolversObject<TObject> = WithIndex<TObject>;

export type ResolverTypeWrapper<T> = Promise<T> | T;


export type ResolverWithResolve<TResult, TParent, TContext, TArgs> = {
  resolve: ResolverFn<TResult, TParent, TContext, TArgs>;
};
export type Resolver<TResult, TParent = {}, TContext = {}, TArgs = {}> = ResolverFn<TResult, TParent, TContext, TArgs> | ResolverWithResolve<TResult, TParent, TContext, TArgs>;

export type ResolverFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => Promise<TResult> | TResult;

export type SubscriptionSubscribeFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => AsyncIterable<TResult> | Promise<AsyncIterable<TResult>>;

export type SubscriptionResolveFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => TResult | Promise<TResult>;

export interface SubscriptionSubscriberObject<TResult, TKey extends string, TParent, TContext, TArgs> {
  subscribe: SubscriptionSubscribeFn<{ [key in TKey]: TResult }, TParent, TContext, TArgs>;
  resolve?: SubscriptionResolveFn<TResult, { [key in TKey]: TResult }, TContext, TArgs>;
}

export interface SubscriptionResolverObject<TResult, TParent, TContext, TArgs> {
  subscribe: SubscriptionSubscribeFn<any, TParent, TContext, TArgs>;
  resolve: SubscriptionResolveFn<TResult, any, TContext, TArgs>;
}

export type SubscriptionObject<TResult, TKey extends string, TParent, TContext, TArgs> =
  | SubscriptionSubscriberObject<TResult, TKey, TParent, TContext, TArgs>
  | SubscriptionResolverObject<TResult, TParent, TContext, TArgs>;

export type SubscriptionResolver<TResult, TKey extends string, TParent = {}, TContext = {}, TArgs = {}> =
  | ((...args: any[]) => SubscriptionObject<TResult, TKey, TParent, TContext, TArgs>)
  | SubscriptionObject<TResult, TKey, TParent, TContext, TArgs>;

export type TypeResolveFn<TTypes, TParent = {}, TContext = {}> = (
  parent: TParent,
  context: TContext,
  info: GraphQLResolveInfo
) => Maybe<TTypes> | Promise<Maybe<TTypes>>;

export type IsTypeOfResolverFn<T = {}, TContext = {}> = (obj: T, context: TContext, info: GraphQLResolveInfo) => boolean | Promise<boolean>;

export type NextResolverFn<T> = () => Promise<T>;

export type DirectiveResolverFn<TResult = {}, TParent = {}, TContext = {}, TArgs = {}> = (
  next: NextResolverFn<TResult>,
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => TResult | Promise<TResult>;


/** Mapping of interface types */
export type ResolversInterfaceTypes<_RefType extends Record<string, unknown>> = ResolversObject<{
  Node: ( ArrayType ) | ( Config ) | ( Connect ) | ( ConnectSettings ) | ( Docker ) | ( Info ) | ( Network ) | ( Notification ) | ( Notifications ) | ( Service ) | ( Vars );
  UserAccount: ( Me ) | ( User );
}>;

/** Mapping between all available schema types and the resolvers types */
export type ResolversTypes = ResolversObject<{
  AccessUrl: ResolverTypeWrapper<AccessUrl>;
  AccessUrlInput: AccessUrlInput;
  AddPermissionInput: AddPermissionInput;
  AddRoleForApiKeyInput: AddRoleForApiKeyInput;
  AddRoleForUserInput: AddRoleForUserInput;
  AllowedOriginInput: AllowedOriginInput;
  ApiKey: ResolverTypeWrapper<ApiKey>;
  ApiKeyResponse: ResolverTypeWrapper<ApiKeyResponse>;
  ApiKeyWithSecret: ResolverTypeWrapper<ApiKeyWithSecret>;
  Array: ResolverTypeWrapper<ArrayType>;
  ArrayCapacity: ResolverTypeWrapper<ArrayCapacity>;
  ArrayDisk: ResolverTypeWrapper<ArrayDisk>;
  ArrayDiskFsColor: ArrayDiskFsColor;
  ArrayDiskStatus: ArrayDiskStatus;
  ArrayDiskType: ArrayDiskType;
  ArrayPendingState: ArrayPendingState;
  ArrayState: ArrayState;
  Baseboard: ResolverTypeWrapper<Baseboard>;
  Boolean: ResolverTypeWrapper<Scalars['Boolean']['output']>;
  Capacity: ResolverTypeWrapper<Capacity>;
  Case: ResolverTypeWrapper<Case>;
  Cloud: ResolverTypeWrapper<Cloud>;
  CloudResponse: ResolverTypeWrapper<CloudResponse>;
  Config: ResolverTypeWrapper<Config>;
  ConfigErrorState: ConfigErrorState;
  Connect: ResolverTypeWrapper<Connect>;
  ConnectSettings: ResolverTypeWrapper<ConnectSettings>;
  ConnectSettingsValues: ResolverTypeWrapper<ConnectSettingsValues>;
  ConnectSignInInput: ConnectSignInInput;
  ConnectUserInfoInput: ConnectUserInfoInput;
  ContainerHostConfig: ResolverTypeWrapper<ContainerHostConfig>;
  ContainerMount: ResolverTypeWrapper<ContainerMount>;
  ContainerPort: ResolverTypeWrapper<ContainerPort>;
  ContainerPortType: ContainerPortType;
  ContainerState: ContainerState;
  CreateApiKeyInput: CreateApiKeyInput;
  DateTime: ResolverTypeWrapper<Scalars['DateTime']['output']>;
  Devices: ResolverTypeWrapper<Devices>;
  Disk: ResolverTypeWrapper<Disk>;
  DiskFsType: DiskFsType;
  DiskInterfaceType: DiskInterfaceType;
  DiskPartition: ResolverTypeWrapper<DiskPartition>;
  DiskSmartStatus: DiskSmartStatus;
  Display: ResolverTypeWrapper<Display>;
  Docker: ResolverTypeWrapper<Docker>;
  DockerContainer: ResolverTypeWrapper<DockerContainer>;
  DockerNetwork: ResolverTypeWrapper<DockerNetwork>;
  DynamicRemoteAccessStatus: ResolverTypeWrapper<DynamicRemoteAccessStatus>;
  DynamicRemoteAccessType: DynamicRemoteAccessType;
  EnableDynamicRemoteAccessInput: EnableDynamicRemoteAccessInput;
  Flash: ResolverTypeWrapper<Flash>;
  Float: ResolverTypeWrapper<Scalars['Float']['output']>;
  Gpu: ResolverTypeWrapper<Gpu>;
  ID: ResolverTypeWrapper<Scalars['ID']['output']>;
  Importance: Importance;
  Info: ResolverTypeWrapper<Info>;
  InfoApps: ResolverTypeWrapper<InfoApps>;
  InfoCpu: ResolverTypeWrapper<InfoCpu>;
  InfoMemory: ResolverTypeWrapper<InfoMemory>;
  Int: ResolverTypeWrapper<Scalars['Int']['output']>;
  JSON: ResolverTypeWrapper<Scalars['JSON']['output']>;
  KeyFile: ResolverTypeWrapper<KeyFile>;
  Long: ResolverTypeWrapper<Scalars['Long']['output']>;
  Me: ResolverTypeWrapper<Me>;
  MemoryFormFactor: MemoryFormFactor;
  MemoryLayout: ResolverTypeWrapper<MemoryLayout>;
  MemoryType: MemoryType;
  MinigraphStatus: MinigraphStatus;
  MinigraphqlResponse: ResolverTypeWrapper<MinigraphqlResponse>;
  Mount: ResolverTypeWrapper<Mount>;
  Mutation: ResolverTypeWrapper<{}>;
  Network: ResolverTypeWrapper<Network>;
  Node: ResolverTypeWrapper<ResolversInterfaceTypes<ResolversTypes>['Node']>;
  Notification: ResolverTypeWrapper<Notification>;
  NotificationCounts: ResolverTypeWrapper<NotificationCounts>;
  NotificationData: NotificationData;
  NotificationFilter: NotificationFilter;
  NotificationOverview: ResolverTypeWrapper<NotificationOverview>;
  NotificationType: NotificationType;
  Notifications: ResolverTypeWrapper<Notifications>;
  Os: ResolverTypeWrapper<Os>;
  Owner: ResolverTypeWrapper<Owner>;
  ParityCheck: ResolverTypeWrapper<ParityCheck>;
  Partition: ResolverTypeWrapper<Partition>;
  Pci: ResolverTypeWrapper<Pci>;
  Permission: ResolverTypeWrapper<Permission>;
  Port: ResolverTypeWrapper<Scalars['Port']['output']>;
  ProfileModel: ResolverTypeWrapper<ProfileModel>;
  Query: ResolverTypeWrapper<{}>;
  Registration: ResolverTypeWrapper<Registration>;
  RegistrationState: RegistrationState;
  RelayResponse: ResolverTypeWrapper<RelayResponse>;
  RemoteAccess: ResolverTypeWrapper<RemoteAccess>;
  RemoveRoleFromApiKeyInput: RemoveRoleFromApiKeyInput;
  Resource: Resource;
  Role: Role;
  Server: ResolverTypeWrapper<Server>;
  ServerStatus: ServerStatus;
  Service: ResolverTypeWrapper<Service>;
  SetupRemoteAccessInput: SetupRemoteAccessInput;
  Share: ResolverTypeWrapper<Share>;
  String: ResolverTypeWrapper<Scalars['String']['output']>;
  Subscription: ResolverTypeWrapper<{}>;
  System: ResolverTypeWrapper<System>;
  Temperature: Temperature;
  Theme: Theme;
  URL: ResolverTypeWrapper<Scalars['URL']['output']>;
  URL_TYPE: URL_TYPE;
  UUID: ResolverTypeWrapper<Scalars['UUID']['output']>;
  UnassignedDevice: ResolverTypeWrapper<UnassignedDevice>;
  Uptime: ResolverTypeWrapper<Uptime>;
  Usb: ResolverTypeWrapper<Usb>;
  User: ResolverTypeWrapper<User>;
  UserAccount: ResolverTypeWrapper<ResolversInterfaceTypes<ResolversTypes>['UserAccount']>;
  Vars: ResolverTypeWrapper<Vars>;
  Versions: ResolverTypeWrapper<Versions>;
  VmDomain: ResolverTypeWrapper<VmDomain>;
  VmState: VmState;
  Vms: ResolverTypeWrapper<Vms>;
  WAN_ACCESS_TYPE: WAN_ACCESS_TYPE;
  WAN_FORWARD_TYPE: WAN_FORWARD_TYPE;
  Welcome: ResolverTypeWrapper<Welcome>;
  addUserInput: addUserInput;
  arrayDiskInput: arrayDiskInput;
  deleteUserInput: deleteUserInput;
  mdState: mdState;
  registrationType: registrationType;
  usersInput: usersInput;
}>;

/** Mapping between all available schema types and the resolvers parents */
export type ResolversParentTypes = ResolversObject<{
  AccessUrl: AccessUrl;
  AccessUrlInput: AccessUrlInput;
  AddPermissionInput: AddPermissionInput;
  AddRoleForApiKeyInput: AddRoleForApiKeyInput;
  AddRoleForUserInput: AddRoleForUserInput;
  AllowedOriginInput: AllowedOriginInput;
  ApiKey: ApiKey;
  ApiKeyResponse: ApiKeyResponse;
  ApiKeyWithSecret: ApiKeyWithSecret;
  Array: ArrayType;
  ArrayCapacity: ArrayCapacity;
  ArrayDisk: ArrayDisk;
  Baseboard: Baseboard;
  Boolean: Scalars['Boolean']['output'];
  Capacity: Capacity;
  Case: Case;
  Cloud: Cloud;
  CloudResponse: CloudResponse;
  Config: Config;
  Connect: Connect;
  ConnectSettings: ConnectSettings;
  ConnectSettingsValues: ConnectSettingsValues;
  ConnectSignInInput: ConnectSignInInput;
  ConnectUserInfoInput: ConnectUserInfoInput;
  ContainerHostConfig: ContainerHostConfig;
  ContainerMount: ContainerMount;
  ContainerPort: ContainerPort;
  CreateApiKeyInput: CreateApiKeyInput;
  DateTime: Scalars['DateTime']['output'];
  Devices: Devices;
  Disk: Disk;
  DiskPartition: DiskPartition;
  Display: Display;
  Docker: Docker;
  DockerContainer: DockerContainer;
  DockerNetwork: DockerNetwork;
  DynamicRemoteAccessStatus: DynamicRemoteAccessStatus;
  EnableDynamicRemoteAccessInput: EnableDynamicRemoteAccessInput;
  Flash: Flash;
  Float: Scalars['Float']['output'];
  Gpu: Gpu;
  ID: Scalars['ID']['output'];
  Info: Info;
  InfoApps: InfoApps;
  InfoCpu: InfoCpu;
  InfoMemory: InfoMemory;
  Int: Scalars['Int']['output'];
  JSON: Scalars['JSON']['output'];
  KeyFile: KeyFile;
  Long: Scalars['Long']['output'];
  Me: Me;
  MemoryLayout: MemoryLayout;
  MinigraphqlResponse: MinigraphqlResponse;
  Mount: Mount;
  Mutation: {};
  Network: Network;
  Node: ResolversInterfaceTypes<ResolversParentTypes>['Node'];
  Notification: Notification;
  NotificationCounts: NotificationCounts;
  NotificationData: NotificationData;
  NotificationFilter: NotificationFilter;
  NotificationOverview: NotificationOverview;
  Notifications: Notifications;
  Os: Os;
  Owner: Owner;
  ParityCheck: ParityCheck;
  Partition: Partition;
  Pci: Pci;
  Permission: Permission;
  Port: Scalars['Port']['output'];
  ProfileModel: ProfileModel;
  Query: {};
  Registration: Registration;
  RelayResponse: RelayResponse;
  RemoteAccess: RemoteAccess;
  RemoveRoleFromApiKeyInput: RemoveRoleFromApiKeyInput;
  Server: Server;
  Service: Service;
  SetupRemoteAccessInput: SetupRemoteAccessInput;
  Share: Share;
  String: Scalars['String']['output'];
  Subscription: {};
  System: System;
  URL: Scalars['URL']['output'];
  UUID: Scalars['UUID']['output'];
  UnassignedDevice: UnassignedDevice;
  Uptime: Uptime;
  Usb: Usb;
  User: User;
  UserAccount: ResolversInterfaceTypes<ResolversParentTypes>['UserAccount'];
  Vars: Vars;
  Versions: Versions;
  VmDomain: VmDomain;
  Vms: Vms;
  Welcome: Welcome;
  addUserInput: addUserInput;
  arrayDiskInput: arrayDiskInput;
  deleteUserInput: deleteUserInput;
  usersInput: usersInput;
}>;

export type AccessUrlResolvers<ContextType = Context, ParentType extends ResolversParentTypes['AccessUrl'] = ResolversParentTypes['AccessUrl']> = ResolversObject<{
  ipv4?: Resolver<Maybe<ResolversTypes['URL']>, ParentType, ContextType>;
  ipv6?: Resolver<Maybe<ResolversTypes['URL']>, ParentType, ContextType>;
  name?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  type?: Resolver<ResolversTypes['URL_TYPE'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type ApiKeyResolvers<ContextType = Context, ParentType extends ResolversParentTypes['ApiKey'] = ResolversParentTypes['ApiKey']> = ResolversObject<{
  createdAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  description?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  permissions?: Resolver<Array<ResolversTypes['Permission']>, ParentType, ContextType>;
  roles?: Resolver<Array<ResolversTypes['Role']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type ApiKeyResponseResolvers<ContextType = Context, ParentType extends ResolversParentTypes['ApiKeyResponse'] = ResolversParentTypes['ApiKeyResponse']> = ResolversObject<{
  error?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  valid?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type ApiKeyWithSecretResolvers<ContextType = Context, ParentType extends ResolversParentTypes['ApiKeyWithSecret'] = ResolversParentTypes['ApiKeyWithSecret']> = ResolversObject<{
  createdAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  description?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  key?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  permissions?: Resolver<Array<ResolversTypes['Permission']>, ParentType, ContextType>;
  roles?: Resolver<Array<ResolversTypes['Role']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type ArrayResolvers<ContextType = Context, ParentType extends ResolversParentTypes['Array'] = ResolversParentTypes['Array']> = ResolversObject<{
  boot?: Resolver<Maybe<ResolversTypes['ArrayDisk']>, ParentType, ContextType>;
  caches?: Resolver<Array<ResolversTypes['ArrayDisk']>, ParentType, ContextType>;
  capacity?: Resolver<ResolversTypes['ArrayCapacity'], ParentType, ContextType>;
  disks?: Resolver<Array<ResolversTypes['ArrayDisk']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  parities?: Resolver<Array<ResolversTypes['ArrayDisk']>, ParentType, ContextType>;
  pendingState?: Resolver<Maybe<ResolversTypes['ArrayPendingState']>, ParentType, ContextType>;
  previousState?: Resolver<Maybe<ResolversTypes['ArrayState']>, ParentType, ContextType>;
  state?: Resolver<ResolversTypes['ArrayState'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type ArrayCapacityResolvers<ContextType = Context, ParentType extends ResolversParentTypes['ArrayCapacity'] = ResolversParentTypes['ArrayCapacity']> = ResolversObject<{
  disks?: Resolver<ResolversTypes['Capacity'], ParentType, ContextType>;
  kilobytes?: Resolver<ResolversTypes['Capacity'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type ArrayDiskResolvers<ContextType = Context, ParentType extends ResolversParentTypes['ArrayDisk'] = ResolversParentTypes['ArrayDisk']> = ResolversObject<{
  comment?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  critical?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  device?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  exportable?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  format?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  fsFree?: Resolver<Maybe<ResolversTypes['Long']>, ParentType, ContextType>;
  fsSize?: Resolver<Maybe<ResolversTypes['Long']>, ParentType, ContextType>;
  fsType?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  fsUsed?: Resolver<Maybe<ResolversTypes['Long']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  idx?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  name?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  numErrors?: Resolver<ResolversTypes['Long'], ParentType, ContextType>;
  numReads?: Resolver<ResolversTypes['Long'], ParentType, ContextType>;
  numWrites?: Resolver<ResolversTypes['Long'], ParentType, ContextType>;
  rotational?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  size?: Resolver<ResolversTypes['Long'], ParentType, ContextType>;
  status?: Resolver<Maybe<ResolversTypes['ArrayDiskStatus']>, ParentType, ContextType>;
  temp?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  transport?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  type?: Resolver<ResolversTypes['ArrayDiskType'], ParentType, ContextType>;
  warning?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type BaseboardResolvers<ContextType = Context, ParentType extends ResolversParentTypes['Baseboard'] = ResolversParentTypes['Baseboard']> = ResolversObject<{
  assetTag?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  manufacturer?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  model?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  serial?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  version?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type CapacityResolvers<ContextType = Context, ParentType extends ResolversParentTypes['Capacity'] = ResolversParentTypes['Capacity']> = ResolversObject<{
  free?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  total?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  used?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type CaseResolvers<ContextType = Context, ParentType extends ResolversParentTypes['Case'] = ResolversParentTypes['Case']> = ResolversObject<{
  base64?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  error?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  icon?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  url?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type CloudResolvers<ContextType = Context, ParentType extends ResolversParentTypes['Cloud'] = ResolversParentTypes['Cloud']> = ResolversObject<{
  allowedOrigins?: Resolver<Array<ResolversTypes['String']>, ParentType, ContextType>;
  apiKey?: Resolver<ResolversTypes['ApiKeyResponse'], ParentType, ContextType>;
  cloud?: Resolver<ResolversTypes['CloudResponse'], ParentType, ContextType>;
  error?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  minigraphql?: Resolver<ResolversTypes['MinigraphqlResponse'], ParentType, ContextType>;
  relay?: Resolver<Maybe<ResolversTypes['RelayResponse']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type CloudResponseResolvers<ContextType = Context, ParentType extends ResolversParentTypes['CloudResponse'] = ResolversParentTypes['CloudResponse']> = ResolversObject<{
  error?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  ip?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  status?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type ConfigResolvers<ContextType = Context, ParentType extends ResolversParentTypes['Config'] = ResolversParentTypes['Config']> = ResolversObject<{
  error?: Resolver<Maybe<ResolversTypes['ConfigErrorState']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  valid?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type ConnectResolvers<ContextType = Context, ParentType extends ResolversParentTypes['Connect'] = ResolversParentTypes['Connect']> = ResolversObject<{
  dynamicRemoteAccess?: Resolver<ResolversTypes['DynamicRemoteAccessStatus'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  settings?: Resolver<ResolversTypes['ConnectSettings'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type ConnectSettingsResolvers<ContextType = Context, ParentType extends ResolversParentTypes['ConnectSettings'] = ResolversParentTypes['ConnectSettings']> = ResolversObject<{
  dataSchema?: Resolver<ResolversTypes['JSON'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  uiSchema?: Resolver<ResolversTypes['JSON'], ParentType, ContextType>;
  values?: Resolver<ResolversTypes['ConnectSettingsValues'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type ConnectSettingsValuesResolvers<ContextType = Context, ParentType extends ResolversParentTypes['ConnectSettingsValues'] = ResolversParentTypes['ConnectSettingsValues']> = ResolversObject<{
  accessType?: Resolver<ResolversTypes['WAN_ACCESS_TYPE'], ParentType, ContextType>;
  extraOrigins?: Resolver<Array<ResolversTypes['String']>, ParentType, ContextType>;
  forwardType?: Resolver<Maybe<ResolversTypes['WAN_FORWARD_TYPE']>, ParentType, ContextType>;
  port?: Resolver<Maybe<ResolversTypes['Port']>, ParentType, ContextType>;
  sandbox?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type ContainerHostConfigResolvers<ContextType = Context, ParentType extends ResolversParentTypes['ContainerHostConfig'] = ResolversParentTypes['ContainerHostConfig']> = ResolversObject<{
  networkMode?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type ContainerMountResolvers<ContextType = Context, ParentType extends ResolversParentTypes['ContainerMount'] = ResolversParentTypes['ContainerMount']> = ResolversObject<{
  destination?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  driver?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  mode?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  propagation?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  rw?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  source?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  type?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type ContainerPortResolvers<ContextType = Context, ParentType extends ResolversParentTypes['ContainerPort'] = ResolversParentTypes['ContainerPort']> = ResolversObject<{
  ip?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  privatePort?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  publicPort?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  type?: Resolver<Maybe<ResolversTypes['ContainerPortType']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export interface DateTimeScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['DateTime'], any> {
  name: 'DateTime';
}

export type DevicesResolvers<ContextType = Context, ParentType extends ResolversParentTypes['Devices'] = ResolversParentTypes['Devices']> = ResolversObject<{
  gpu?: Resolver<Maybe<Array<Maybe<ResolversTypes['Gpu']>>>, ParentType, ContextType>;
  network?: Resolver<Maybe<Array<Maybe<ResolversTypes['Network']>>>, ParentType, ContextType>;
  pci?: Resolver<Maybe<Array<Maybe<ResolversTypes['Pci']>>>, ParentType, ContextType>;
  usb?: Resolver<Maybe<Array<Maybe<ResolversTypes['Usb']>>>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type DiskResolvers<ContextType = Context, ParentType extends ResolversParentTypes['Disk'] = ResolversParentTypes['Disk']> = ResolversObject<{
  bytesPerSector?: Resolver<ResolversTypes['Long'], ParentType, ContextType>;
  device?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  firmwareRevision?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  interfaceType?: Resolver<ResolversTypes['DiskInterfaceType'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  partitions?: Resolver<Maybe<Array<ResolversTypes['DiskPartition']>>, ParentType, ContextType>;
  sectorsPerTrack?: Resolver<ResolversTypes['Long'], ParentType, ContextType>;
  serialNum?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  size?: Resolver<ResolversTypes['Long'], ParentType, ContextType>;
  smartStatus?: Resolver<ResolversTypes['DiskSmartStatus'], ParentType, ContextType>;
  temperature?: Resolver<ResolversTypes['Long'], ParentType, ContextType>;
  totalCylinders?: Resolver<ResolversTypes['Long'], ParentType, ContextType>;
  totalHeads?: Resolver<ResolversTypes['Long'], ParentType, ContextType>;
  totalSectors?: Resolver<ResolversTypes['Long'], ParentType, ContextType>;
  totalTracks?: Resolver<ResolversTypes['Long'], ParentType, ContextType>;
  tracksPerCylinder?: Resolver<ResolversTypes['Long'], ParentType, ContextType>;
  type?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  vendor?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type DiskPartitionResolvers<ContextType = Context, ParentType extends ResolversParentTypes['DiskPartition'] = ResolversParentTypes['DiskPartition']> = ResolversObject<{
  fsType?: Resolver<ResolversTypes['DiskFsType'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  size?: Resolver<ResolversTypes['Long'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type DisplayResolvers<ContextType = Context, ParentType extends ResolversParentTypes['Display'] = ResolversParentTypes['Display']> = ResolversObject<{
  banner?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  case?: Resolver<Maybe<ResolversTypes['Case']>, ParentType, ContextType>;
  critical?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  dashapps?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  date?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  hot?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  locale?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  max?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  number?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  resize?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  scale?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  tabs?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  text?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  theme?: Resolver<Maybe<ResolversTypes['Theme']>, ParentType, ContextType>;
  total?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  unit?: Resolver<Maybe<ResolversTypes['Temperature']>, ParentType, ContextType>;
  usage?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  users?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  warning?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  wwn?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type DockerResolvers<ContextType = Context, ParentType extends ResolversParentTypes['Docker'] = ResolversParentTypes['Docker']> = ResolversObject<{
  containers?: Resolver<Maybe<Array<ResolversTypes['DockerContainer']>>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  networks?: Resolver<Maybe<Array<ResolversTypes['DockerNetwork']>>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type DockerContainerResolvers<ContextType = Context, ParentType extends ResolversParentTypes['DockerContainer'] = ResolversParentTypes['DockerContainer']> = ResolversObject<{
  autoStart?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  command?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  created?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  hostConfig?: Resolver<Maybe<ResolversTypes['ContainerHostConfig']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  image?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  imageId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  labels?: Resolver<Maybe<ResolversTypes['JSON']>, ParentType, ContextType>;
  mounts?: Resolver<Maybe<Array<Maybe<ResolversTypes['JSON']>>>, ParentType, ContextType>;
  names?: Resolver<Maybe<Array<ResolversTypes['String']>>, ParentType, ContextType>;
  networkSettings?: Resolver<Maybe<ResolversTypes['JSON']>, ParentType, ContextType>;
  ports?: Resolver<Array<ResolversTypes['ContainerPort']>, ParentType, ContextType>;
  sizeRootFs?: Resolver<Maybe<ResolversTypes['Long']>, ParentType, ContextType>;
  state?: Resolver<ResolversTypes['ContainerState'], ParentType, ContextType>;
  status?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type DockerNetworkResolvers<ContextType = Context, ParentType extends ResolversParentTypes['DockerNetwork'] = ResolversParentTypes['DockerNetwork']> = ResolversObject<{
  attachable?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  configFrom?: Resolver<Maybe<ResolversTypes['JSON']>, ParentType, ContextType>;
  configOnly?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  containers?: Resolver<Maybe<ResolversTypes['JSON']>, ParentType, ContextType>;
  created?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  driver?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  enableIPv6?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  id?: Resolver<Maybe<ResolversTypes['ID']>, ParentType, ContextType>;
  ingress?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  internal?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  ipam?: Resolver<Maybe<ResolversTypes['JSON']>, ParentType, ContextType>;
  labels?: Resolver<Maybe<ResolversTypes['JSON']>, ParentType, ContextType>;
  name?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  options?: Resolver<Maybe<ResolversTypes['JSON']>, ParentType, ContextType>;
  scope?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type DynamicRemoteAccessStatusResolvers<ContextType = Context, ParentType extends ResolversParentTypes['DynamicRemoteAccessStatus'] = ResolversParentTypes['DynamicRemoteAccessStatus']> = ResolversObject<{
  enabledType?: Resolver<ResolversTypes['DynamicRemoteAccessType'], ParentType, ContextType>;
  error?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  runningType?: Resolver<ResolversTypes['DynamicRemoteAccessType'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type FlashResolvers<ContextType = Context, ParentType extends ResolversParentTypes['Flash'] = ResolversParentTypes['Flash']> = ResolversObject<{
  guid?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  product?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  vendor?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type GpuResolvers<ContextType = Context, ParentType extends ResolversParentTypes['Gpu'] = ResolversParentTypes['Gpu']> = ResolversObject<{
  blacklisted?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  class?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  productid?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  type?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  typeid?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  vendorname?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type InfoResolvers<ContextType = Context, ParentType extends ResolversParentTypes['Info'] = ResolversParentTypes['Info']> = ResolversObject<{
  apps?: Resolver<Maybe<ResolversTypes['InfoApps']>, ParentType, ContextType>;
  baseboard?: Resolver<Maybe<ResolversTypes['Baseboard']>, ParentType, ContextType>;
  cpu?: Resolver<Maybe<ResolversTypes['InfoCpu']>, ParentType, ContextType>;
  devices?: Resolver<Maybe<ResolversTypes['Devices']>, ParentType, ContextType>;
  display?: Resolver<Maybe<ResolversTypes['Display']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  machineId?: Resolver<Maybe<ResolversTypes['ID']>, ParentType, ContextType>;
  memory?: Resolver<Maybe<ResolversTypes['InfoMemory']>, ParentType, ContextType>;
  os?: Resolver<Maybe<ResolversTypes['Os']>, ParentType, ContextType>;
  system?: Resolver<Maybe<ResolversTypes['System']>, ParentType, ContextType>;
  time?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  versions?: Resolver<Maybe<ResolversTypes['Versions']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type InfoAppsResolvers<ContextType = Context, ParentType extends ResolversParentTypes['InfoApps'] = ResolversParentTypes['InfoApps']> = ResolversObject<{
  installed?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  started?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type InfoCpuResolvers<ContextType = Context, ParentType extends ResolversParentTypes['InfoCpu'] = ResolversParentTypes['InfoCpu']> = ResolversObject<{
  brand?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  cache?: Resolver<ResolversTypes['JSON'], ParentType, ContextType>;
  cores?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  family?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  flags?: Resolver<Maybe<Array<ResolversTypes['String']>>, ParentType, ContextType>;
  manufacturer?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  model?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  processors?: Resolver<ResolversTypes['Long'], ParentType, ContextType>;
  revision?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  socket?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  speed?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  speedmax?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  speedmin?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  stepping?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  threads?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  vendor?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  voltage?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type InfoMemoryResolvers<ContextType = Context, ParentType extends ResolversParentTypes['InfoMemory'] = ResolversParentTypes['InfoMemory']> = ResolversObject<{
  active?: Resolver<ResolversTypes['Long'], ParentType, ContextType>;
  available?: Resolver<ResolversTypes['Long'], ParentType, ContextType>;
  buffcache?: Resolver<ResolversTypes['Long'], ParentType, ContextType>;
  free?: Resolver<ResolversTypes['Long'], ParentType, ContextType>;
  layout?: Resolver<Maybe<Array<ResolversTypes['MemoryLayout']>>, ParentType, ContextType>;
  max?: Resolver<ResolversTypes['Long'], ParentType, ContextType>;
  swapfree?: Resolver<ResolversTypes['Long'], ParentType, ContextType>;
  swaptotal?: Resolver<ResolversTypes['Long'], ParentType, ContextType>;
  swapused?: Resolver<ResolversTypes['Long'], ParentType, ContextType>;
  total?: Resolver<ResolversTypes['Long'], ParentType, ContextType>;
  used?: Resolver<ResolversTypes['Long'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export interface JSONScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['JSON'], any> {
  name: 'JSON';
}

export type KeyFileResolvers<ContextType = Context, ParentType extends ResolversParentTypes['KeyFile'] = ResolversParentTypes['KeyFile']> = ResolversObject<{
  contents?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  location?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export interface LongScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['Long'], any> {
  name: 'Long';
}

export type MeResolvers<ContextType = Context, ParentType extends ResolversParentTypes['Me'] = ResolversParentTypes['Me']> = ResolversObject<{
  description?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  permissions?: Resolver<Maybe<Array<ResolversTypes['Permission']>>, ParentType, ContextType>;
  roles?: Resolver<Array<ResolversTypes['Role']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type MemoryLayoutResolvers<ContextType = Context, ParentType extends ResolversParentTypes['MemoryLayout'] = ResolversParentTypes['MemoryLayout']> = ResolversObject<{
  bank?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  clockSpeed?: Resolver<Maybe<ResolversTypes['Long']>, ParentType, ContextType>;
  formFactor?: Resolver<Maybe<ResolversTypes['MemoryFormFactor']>, ParentType, ContextType>;
  manufacturer?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  partNum?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  serialNum?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  size?: Resolver<ResolversTypes['Long'], ParentType, ContextType>;
  type?: Resolver<Maybe<ResolversTypes['MemoryType']>, ParentType, ContextType>;
  voltageConfigured?: Resolver<Maybe<ResolversTypes['Long']>, ParentType, ContextType>;
  voltageMax?: Resolver<Maybe<ResolversTypes['Long']>, ParentType, ContextType>;
  voltageMin?: Resolver<Maybe<ResolversTypes['Long']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type MinigraphqlResponseResolvers<ContextType = Context, ParentType extends ResolversParentTypes['MinigraphqlResponse'] = ResolversParentTypes['MinigraphqlResponse']> = ResolversObject<{
  error?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  status?: Resolver<ResolversTypes['MinigraphStatus'], ParentType, ContextType>;
  timeout?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type MountResolvers<ContextType = Context, ParentType extends ResolversParentTypes['Mount'] = ResolversParentTypes['Mount']> = ResolversObject<{
  directory?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  name?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  permissions?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  type?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type MutationResolvers<ContextType = Context, ParentType extends ResolversParentTypes['Mutation'] = ResolversParentTypes['Mutation']> = ResolversObject<{
  addDiskToArray?: Resolver<Maybe<ResolversTypes['Array']>, ParentType, ContextType, Partial<MutationaddDiskToArrayArgs>>;
  addPermission?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationaddPermissionArgs, 'input'>>;
  addRoleForApiKey?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationaddRoleForApiKeyArgs, 'input'>>;
  addRoleForUser?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationaddRoleForUserArgs, 'input'>>;
  addUser?: Resolver<Maybe<ResolversTypes['User']>, ParentType, ContextType, RequireFields<MutationaddUserArgs, 'input'>>;
  archiveAll?: Resolver<ResolversTypes['NotificationOverview'], ParentType, ContextType, Partial<MutationarchiveAllArgs>>;
  archiveNotification?: Resolver<ResolversTypes['Notification'], ParentType, ContextType, RequireFields<MutationarchiveNotificationArgs, 'id'>>;
  archiveNotifications?: Resolver<ResolversTypes['NotificationOverview'], ParentType, ContextType, Partial<MutationarchiveNotificationsArgs>>;
  cancelParityCheck?: Resolver<Maybe<ResolversTypes['JSON']>, ParentType, ContextType>;
  clearArrayDiskStatistics?: Resolver<Maybe<ResolversTypes['JSON']>, ParentType, ContextType, RequireFields<MutationclearArrayDiskStatisticsArgs, 'id'>>;
  connectSignIn?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationconnectSignInArgs, 'input'>>;
  connectSignOut?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  createApiKey?: Resolver<ResolversTypes['ApiKeyWithSecret'], ParentType, ContextType, RequireFields<MutationcreateApiKeyArgs, 'input'>>;
  createNotification?: Resolver<ResolversTypes['Notification'], ParentType, ContextType, RequireFields<MutationcreateNotificationArgs, 'input'>>;
  deleteArchivedNotifications?: Resolver<ResolversTypes['NotificationOverview'], ParentType, ContextType>;
  deleteNotification?: Resolver<ResolversTypes['NotificationOverview'], ParentType, ContextType, RequireFields<MutationdeleteNotificationArgs, 'id' | 'type'>>;
  deleteUser?: Resolver<Maybe<ResolversTypes['User']>, ParentType, ContextType, RequireFields<MutationdeleteUserArgs, 'input'>>;
  enableDynamicRemoteAccess?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationenableDynamicRemoteAccessArgs, 'input'>>;
  login?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType, RequireFields<MutationloginArgs, 'password' | 'username'>>;
  mountArrayDisk?: Resolver<Maybe<ResolversTypes['Disk']>, ParentType, ContextType, RequireFields<MutationmountArrayDiskArgs, 'id'>>;
  pauseParityCheck?: Resolver<Maybe<ResolversTypes['JSON']>, ParentType, ContextType>;
  reboot?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  recalculateOverview?: Resolver<ResolversTypes['NotificationOverview'], ParentType, ContextType>;
  removeDiskFromArray?: Resolver<Maybe<ResolversTypes['Array']>, ParentType, ContextType, Partial<MutationremoveDiskFromArrayArgs>>;
  removeRoleFromApiKey?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationremoveRoleFromApiKeyArgs, 'input'>>;
  resumeParityCheck?: Resolver<Maybe<ResolversTypes['JSON']>, ParentType, ContextType>;
  setAdditionalAllowedOrigins?: Resolver<Array<ResolversTypes['String']>, ParentType, ContextType, RequireFields<MutationsetAdditionalAllowedOriginsArgs, 'input'>>;
  setupRemoteAccess?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationsetupRemoteAccessArgs, 'input'>>;
  shutdown?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  startArray?: Resolver<Maybe<ResolversTypes['Array']>, ParentType, ContextType>;
  startParityCheck?: Resolver<Maybe<ResolversTypes['JSON']>, ParentType, ContextType, Partial<MutationstartParityCheckArgs>>;
  stopArray?: Resolver<Maybe<ResolversTypes['Array']>, ParentType, ContextType>;
  unarchiveAll?: Resolver<ResolversTypes['NotificationOverview'], ParentType, ContextType, Partial<MutationunarchiveAllArgs>>;
  unarchiveNotifications?: Resolver<ResolversTypes['NotificationOverview'], ParentType, ContextType, Partial<MutationunarchiveNotificationsArgs>>;
  unmountArrayDisk?: Resolver<Maybe<ResolversTypes['Disk']>, ParentType, ContextType, RequireFields<MutationunmountArrayDiskArgs, 'id'>>;
  unreadNotification?: Resolver<ResolversTypes['Notification'], ParentType, ContextType, RequireFields<MutationunreadNotificationArgs, 'id'>>;
}>;

export type NetworkResolvers<ContextType = Context, ParentType extends ResolversParentTypes['Network'] = ResolversParentTypes['Network']> = ResolversObject<{
  accessUrls?: Resolver<Maybe<Array<ResolversTypes['AccessUrl']>>, ParentType, ContextType>;
  carrierChanges?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  duplex?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  iface?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  ifaceName?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  internal?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  ipv4?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  ipv6?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  mac?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  mtu?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  operstate?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  speed?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  type?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type NodeResolvers<ContextType = Context, ParentType extends ResolversParentTypes['Node'] = ResolversParentTypes['Node']> = ResolversObject<{
  __resolveType: TypeResolveFn<'Array' | 'Config' | 'Connect' | 'ConnectSettings' | 'Docker' | 'Info' | 'Network' | 'Notification' | 'Notifications' | 'Service' | 'Vars', ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
}>;

export type NotificationResolvers<ContextType = Context, ParentType extends ResolversParentTypes['Notification'] = ResolversParentTypes['Notification']> = ResolversObject<{
  description?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  formattedTimestamp?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  importance?: Resolver<ResolversTypes['Importance'], ParentType, ContextType>;
  link?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  subject?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  timestamp?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  title?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  type?: Resolver<ResolversTypes['NotificationType'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type NotificationCountsResolvers<ContextType = Context, ParentType extends ResolversParentTypes['NotificationCounts'] = ResolversParentTypes['NotificationCounts']> = ResolversObject<{
  alert?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  info?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  total?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  warning?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type NotificationOverviewResolvers<ContextType = Context, ParentType extends ResolversParentTypes['NotificationOverview'] = ResolversParentTypes['NotificationOverview']> = ResolversObject<{
  archive?: Resolver<ResolversTypes['NotificationCounts'], ParentType, ContextType>;
  unread?: Resolver<ResolversTypes['NotificationCounts'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type NotificationsResolvers<ContextType = Context, ParentType extends ResolversParentTypes['Notifications'] = ResolversParentTypes['Notifications']> = ResolversObject<{
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  list?: Resolver<Array<ResolversTypes['Notification']>, ParentType, ContextType, RequireFields<NotificationslistArgs, 'filter'>>;
  overview?: Resolver<ResolversTypes['NotificationOverview'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type OsResolvers<ContextType = Context, ParentType extends ResolversParentTypes['Os'] = ResolversParentTypes['Os']> = ResolversObject<{
  arch?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  build?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  codename?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  codepage?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  distro?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  hostname?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  kernel?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  logofile?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  platform?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  release?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  serial?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  uptime?: Resolver<Maybe<ResolversTypes['DateTime']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type OwnerResolvers<ContextType = Context, ParentType extends ResolversParentTypes['Owner'] = ResolversParentTypes['Owner']> = ResolversObject<{
  avatar?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  url?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  username?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type ParityCheckResolvers<ContextType = Context, ParentType extends ResolversParentTypes['ParityCheck'] = ResolversParentTypes['ParityCheck']> = ResolversObject<{
  date?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  duration?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  errors?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  speed?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  status?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type PartitionResolvers<ContextType = Context, ParentType extends ResolversParentTypes['Partition'] = ResolversParentTypes['Partition']> = ResolversObject<{
  devlinks?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  devname?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  devpath?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  devtype?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  idAta?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  idAtaDownloadMicrocode?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  idAtaFeatureSetAam?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  idAtaFeatureSetAamCurrentValue?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  idAtaFeatureSetAamEnabled?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  idAtaFeatureSetAamVendorRecommendedValue?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  idAtaFeatureSetApm?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  idAtaFeatureSetApmCurrentValue?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  idAtaFeatureSetApmEnabled?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  idAtaFeatureSetHpa?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  idAtaFeatureSetHpaEnabled?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  idAtaFeatureSetPm?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  idAtaFeatureSetPmEnabled?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  idAtaFeatureSetPuis?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  idAtaFeatureSetPuisEnabled?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  idAtaFeatureSetSecurity?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  idAtaFeatureSetSecurityEnabled?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  idAtaFeatureSetSecurityEnhancedEraseUnitMin?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  idAtaFeatureSetSecurityEraseUnitMin?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  idAtaFeatureSetSmart?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  idAtaFeatureSetSmartEnabled?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  idAtaRotationRateRpm?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  idAtaSata?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  idAtaSataSignalRateGen1?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  idAtaSataSignalRateGen2?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  idAtaWriteCache?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  idAtaWriteCacheEnabled?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  idBus?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  idFsType?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  idFsUsage?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  idFsUuid?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  idFsUuidEnc?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  idModel?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  idModelEnc?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  idPartEntryDisk?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  idPartEntryNumber?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  idPartEntryOffset?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  idPartEntryScheme?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  idPartEntrySize?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  idPartEntryType?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  idPartTableType?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  idPath?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  idPathTag?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  idRevision?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  idSerial?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  idSerialShort?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  idType?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  idWwn?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  idWwnWithExtension?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  major?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  minor?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  partn?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  subsystem?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  usecInitialized?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type PciResolvers<ContextType = Context, ParentType extends ResolversParentTypes['Pci'] = ResolversParentTypes['Pci']> = ResolversObject<{
  blacklisted?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  class?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  productid?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  productname?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  type?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  typeid?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  vendorid?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  vendorname?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type PermissionResolvers<ContextType = Context, ParentType extends ResolversParentTypes['Permission'] = ResolversParentTypes['Permission']> = ResolversObject<{
  actions?: Resolver<Array<ResolversTypes['String']>, ParentType, ContextType>;
  resource?: Resolver<ResolversTypes['Resource'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export interface PortScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['Port'], any> {
  name: 'Port';
}

export type ProfileModelResolvers<ContextType = Context, ParentType extends ResolversParentTypes['ProfileModel'] = ResolversParentTypes['ProfileModel']> = ResolversObject<{
  avatar?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  url?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  userId?: Resolver<Maybe<ResolversTypes['ID']>, ParentType, ContextType>;
  username?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type QueryResolvers<ContextType = Context, ParentType extends ResolversParentTypes['Query'] = ResolversParentTypes['Query']> = ResolversObject<{
  apiKey?: Resolver<Maybe<ResolversTypes['ApiKey']>, ParentType, ContextType, RequireFields<QueryapiKeyArgs, 'id'>>;
  apiKeys?: Resolver<Array<ResolversTypes['ApiKey']>, ParentType, ContextType>;
  array?: Resolver<ResolversTypes['Array'], ParentType, ContextType>;
  cloud?: Resolver<Maybe<ResolversTypes['Cloud']>, ParentType, ContextType>;
  config?: Resolver<ResolversTypes['Config'], ParentType, ContextType>;
  connect?: Resolver<ResolversTypes['Connect'], ParentType, ContextType>;
  connectSettingsForm?: Resolver<ResolversTypes['ConnectSettings'], ParentType, ContextType>;
  disk?: Resolver<Maybe<ResolversTypes['Disk']>, ParentType, ContextType, RequireFields<QuerydiskArgs, 'id'>>;
  disks?: Resolver<Array<Maybe<ResolversTypes['Disk']>>, ParentType, ContextType>;
  display?: Resolver<Maybe<ResolversTypes['Display']>, ParentType, ContextType>;
  docker?: Resolver<ResolversTypes['Docker'], ParentType, ContextType>;
  dockerContainers?: Resolver<Array<ResolversTypes['DockerContainer']>, ParentType, ContextType, Partial<QuerydockerContainersArgs>>;
  dockerNetwork?: Resolver<ResolversTypes['DockerNetwork'], ParentType, ContextType, RequireFields<QuerydockerNetworkArgs, 'id'>>;
  dockerNetworks?: Resolver<Array<Maybe<ResolversTypes['DockerNetwork']>>, ParentType, ContextType, Partial<QuerydockerNetworksArgs>>;
  extraAllowedOrigins?: Resolver<Array<ResolversTypes['String']>, ParentType, ContextType>;
  flash?: Resolver<Maybe<ResolversTypes['Flash']>, ParentType, ContextType>;
  info?: Resolver<Maybe<ResolversTypes['Info']>, ParentType, ContextType>;
  me?: Resolver<Maybe<ResolversTypes['Me']>, ParentType, ContextType>;
  network?: Resolver<Maybe<ResolversTypes['Network']>, ParentType, ContextType>;
  notifications?: Resolver<ResolversTypes['Notifications'], ParentType, ContextType>;
  online?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  owner?: Resolver<Maybe<ResolversTypes['Owner']>, ParentType, ContextType>;
  parityHistory?: Resolver<Maybe<Array<Maybe<ResolversTypes['ParityCheck']>>>, ParentType, ContextType>;
  registration?: Resolver<Maybe<ResolversTypes['Registration']>, ParentType, ContextType>;
  remoteAccess?: Resolver<ResolversTypes['RemoteAccess'], ParentType, ContextType>;
  server?: Resolver<Maybe<ResolversTypes['Server']>, ParentType, ContextType>;
  servers?: Resolver<Array<ResolversTypes['Server']>, ParentType, ContextType>;
  services?: Resolver<Array<ResolversTypes['Service']>, ParentType, ContextType>;
  shares?: Resolver<Maybe<Array<Maybe<ResolversTypes['Share']>>>, ParentType, ContextType>;
  unassignedDevices?: Resolver<Maybe<Array<Maybe<ResolversTypes['UnassignedDevice']>>>, ParentType, ContextType>;
  user?: Resolver<Maybe<ResolversTypes['User']>, ParentType, ContextType, RequireFields<QueryuserArgs, 'id'>>;
  users?: Resolver<Array<ResolversTypes['User']>, ParentType, ContextType, Partial<QueryusersArgs>>;
  vars?: Resolver<Maybe<ResolversTypes['Vars']>, ParentType, ContextType>;
  vms?: Resolver<Maybe<ResolversTypes['Vms']>, ParentType, ContextType>;
}>;

export type RegistrationResolvers<ContextType = Context, ParentType extends ResolversParentTypes['Registration'] = ResolversParentTypes['Registration']> = ResolversObject<{
  expiration?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  guid?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  keyFile?: Resolver<Maybe<ResolversTypes['KeyFile']>, ParentType, ContextType>;
  state?: Resolver<Maybe<ResolversTypes['RegistrationState']>, ParentType, ContextType>;
  type?: Resolver<Maybe<ResolversTypes['registrationType']>, ParentType, ContextType>;
  updateExpiration?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type RelayResponseResolvers<ContextType = Context, ParentType extends ResolversParentTypes['RelayResponse'] = ResolversParentTypes['RelayResponse']> = ResolversObject<{
  error?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  status?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  timeout?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type RemoteAccessResolvers<ContextType = Context, ParentType extends ResolversParentTypes['RemoteAccess'] = ResolversParentTypes['RemoteAccess']> = ResolversObject<{
  accessType?: Resolver<ResolversTypes['WAN_ACCESS_TYPE'], ParentType, ContextType>;
  forwardType?: Resolver<Maybe<ResolversTypes['WAN_FORWARD_TYPE']>, ParentType, ContextType>;
  port?: Resolver<Maybe<ResolversTypes['Port']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type ServerResolvers<ContextType = Context, ParentType extends ResolversParentTypes['Server'] = ResolversParentTypes['Server']> = ResolversObject<{
  apikey?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  guid?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  lanip?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  localurl?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  owner?: Resolver<ResolversTypes['ProfileModel'], ParentType, ContextType>;
  remoteurl?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  status?: Resolver<ResolversTypes['ServerStatus'], ParentType, ContextType>;
  wanip?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type ServiceResolvers<ContextType = Context, ParentType extends ResolversParentTypes['Service'] = ResolversParentTypes['Service']> = ResolversObject<{
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  name?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  online?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  uptime?: Resolver<Maybe<ResolversTypes['Uptime']>, ParentType, ContextType>;
  version?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type ShareResolvers<ContextType = Context, ParentType extends ResolversParentTypes['Share'] = ResolversParentTypes['Share']> = ResolversObject<{
  allocator?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  cache?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  color?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  comment?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  cow?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  exclude?: Resolver<Maybe<Array<Maybe<ResolversTypes['String']>>>, ParentType, ContextType>;
  floor?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  free?: Resolver<Maybe<ResolversTypes['Long']>, ParentType, ContextType>;
  include?: Resolver<Maybe<Array<Maybe<ResolversTypes['String']>>>, ParentType, ContextType>;
  luksStatus?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  name?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  nameOrig?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  size?: Resolver<Maybe<ResolversTypes['Long']>, ParentType, ContextType>;
  splitLevel?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  used?: Resolver<Maybe<ResolversTypes['Long']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type SubscriptionResolvers<ContextType = Context, ParentType extends ResolversParentTypes['Subscription'] = ResolversParentTypes['Subscription']> = ResolversObject<{
  array?: SubscriptionResolver<ResolversTypes['Array'], "array", ParentType, ContextType>;
  config?: SubscriptionResolver<ResolversTypes['Config'], "config", ParentType, ContextType>;
  display?: SubscriptionResolver<Maybe<ResolversTypes['Display']>, "display", ParentType, ContextType>;
  dockerContainer?: SubscriptionResolver<ResolversTypes['DockerContainer'], "dockerContainer", ParentType, ContextType, RequireFields<SubscriptiondockerContainerArgs, 'id'>>;
  dockerContainers?: SubscriptionResolver<Maybe<Array<Maybe<ResolversTypes['DockerContainer']>>>, "dockerContainers", ParentType, ContextType>;
  dockerNetwork?: SubscriptionResolver<ResolversTypes['DockerNetwork'], "dockerNetwork", ParentType, ContextType, RequireFields<SubscriptiondockerNetworkArgs, 'id'>>;
  dockerNetworks?: SubscriptionResolver<Array<Maybe<ResolversTypes['DockerNetwork']>>, "dockerNetworks", ParentType, ContextType>;
  flash?: SubscriptionResolver<ResolversTypes['Flash'], "flash", ParentType, ContextType>;
  info?: SubscriptionResolver<ResolversTypes['Info'], "info", ParentType, ContextType>;
  me?: SubscriptionResolver<Maybe<ResolversTypes['Me']>, "me", ParentType, ContextType>;
  notificationAdded?: SubscriptionResolver<ResolversTypes['Notification'], "notificationAdded", ParentType, ContextType>;
  notificationsOverview?: SubscriptionResolver<ResolversTypes['NotificationOverview'], "notificationsOverview", ParentType, ContextType>;
  online?: SubscriptionResolver<ResolversTypes['Boolean'], "online", ParentType, ContextType>;
  owner?: SubscriptionResolver<ResolversTypes['Owner'], "owner", ParentType, ContextType>;
  parityHistory?: SubscriptionResolver<ResolversTypes['ParityCheck'], "parityHistory", ParentType, ContextType>;
  ping?: SubscriptionResolver<ResolversTypes['String'], "ping", ParentType, ContextType>;
  registration?: SubscriptionResolver<ResolversTypes['Registration'], "registration", ParentType, ContextType>;
  server?: SubscriptionResolver<Maybe<ResolversTypes['Server']>, "server", ParentType, ContextType>;
  service?: SubscriptionResolver<Maybe<Array<ResolversTypes['Service']>>, "service", ParentType, ContextType, RequireFields<SubscriptionserviceArgs, 'name'>>;
  share?: SubscriptionResolver<ResolversTypes['Share'], "share", ParentType, ContextType, RequireFields<SubscriptionshareArgs, 'id'>>;
  shares?: SubscriptionResolver<Maybe<Array<ResolversTypes['Share']>>, "shares", ParentType, ContextType>;
  unassignedDevices?: SubscriptionResolver<Maybe<Array<ResolversTypes['UnassignedDevice']>>, "unassignedDevices", ParentType, ContextType>;
  user?: SubscriptionResolver<ResolversTypes['User'], "user", ParentType, ContextType, RequireFields<SubscriptionuserArgs, 'id'>>;
  users?: SubscriptionResolver<Array<Maybe<ResolversTypes['User']>>, "users", ParentType, ContextType>;
  vars?: SubscriptionResolver<ResolversTypes['Vars'], "vars", ParentType, ContextType>;
  vms?: SubscriptionResolver<Maybe<ResolversTypes['Vms']>, "vms", ParentType, ContextType>;
}>;

export type SystemResolvers<ContextType = Context, ParentType extends ResolversParentTypes['System'] = ResolversParentTypes['System']> = ResolversObject<{
  manufacturer?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  model?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  serial?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  sku?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  uuid?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  version?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export interface URLScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['URL'], any> {
  name: 'URL';
}

export interface UUIDScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['UUID'], any> {
  name: 'UUID';
}

export type UnassignedDeviceResolvers<ContextType = Context, ParentType extends ResolversParentTypes['UnassignedDevice'] = ResolversParentTypes['UnassignedDevice']> = ResolversObject<{
  devlinks?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  devname?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  devpath?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  devtype?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  idAta?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  idAtaDownloadMicrocode?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  idAtaFeatureSetAam?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  idAtaFeatureSetAamCurrentValue?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  idAtaFeatureSetAamEnabled?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  idAtaFeatureSetAamVendorRecommendedValue?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  idAtaFeatureSetApm?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  idAtaFeatureSetApmCurrentValue?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  idAtaFeatureSetApmEnabled?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  idAtaFeatureSetHpa?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  idAtaFeatureSetHpaEnabled?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  idAtaFeatureSetPm?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  idAtaFeatureSetPmEnabled?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  idAtaFeatureSetPuis?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  idAtaFeatureSetPuisEnabled?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  idAtaFeatureSetSecurity?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  idAtaFeatureSetSecurityEnabled?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  idAtaFeatureSetSecurityEnhancedEraseUnitMin?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  idAtaFeatureSetSecurityEraseUnitMin?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  idAtaFeatureSetSmart?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  idAtaFeatureSetSmartEnabled?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  idAtaRotationRateRpm?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  idAtaSata?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  idAtaSataSignalRateGen1?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  idAtaSataSignalRateGen2?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  idAtaWriteCache?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  idAtaWriteCacheEnabled?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  idBus?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  idModel?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  idModelEnc?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  idPartTableType?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  idPath?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  idPathTag?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  idRevision?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  idSerial?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  idSerialShort?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  idType?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  idWwn?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  idWwnWithExtension?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  major?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  minor?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  mount?: Resolver<Maybe<ResolversTypes['Mount']>, ParentType, ContextType>;
  mounted?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  name?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  partitions?: Resolver<Maybe<Array<Maybe<ResolversTypes['Partition']>>>, ParentType, ContextType>;
  subsystem?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  temp?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  usecInitialized?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type UptimeResolvers<ContextType = Context, ParentType extends ResolversParentTypes['Uptime'] = ResolversParentTypes['Uptime']> = ResolversObject<{
  timestamp?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type UsbResolvers<ContextType = Context, ParentType extends ResolversParentTypes['Usb'] = ResolversParentTypes['Usb']> = ResolversObject<{
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  name?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type UserResolvers<ContextType = Context, ParentType extends ResolversParentTypes['User'] = ResolversParentTypes['User']> = ResolversObject<{
  description?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  password?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  permissions?: Resolver<Maybe<Array<ResolversTypes['Permission']>>, ParentType, ContextType>;
  roles?: Resolver<Array<ResolversTypes['Role']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type UserAccountResolvers<ContextType = Context, ParentType extends ResolversParentTypes['UserAccount'] = ResolversParentTypes['UserAccount']> = ResolversObject<{
  __resolveType: TypeResolveFn<'Me' | 'User', ParentType, ContextType>;
  description?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  permissions?: Resolver<Maybe<Array<ResolversTypes['Permission']>>, ParentType, ContextType>;
  roles?: Resolver<Array<ResolversTypes['Role']>, ParentType, ContextType>;
}>;

export type VarsResolvers<ContextType = Context, ParentType extends ResolversParentTypes['Vars'] = ResolversParentTypes['Vars']> = ResolversObject<{
  bindMgt?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  cacheNumDevices?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  cacheSbNumDisks?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  comment?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  configError?: Resolver<Maybe<ResolversTypes['ConfigErrorState']>, ParentType, ContextType>;
  configValid?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  csrfToken?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  defaultFormat?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  defaultFsType?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  deviceCount?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  domain?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  domainLogin?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  domainShort?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  enableFruit?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  flashGuid?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  flashProduct?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  flashVendor?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  fsCopyPrcnt?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  fsNumMounted?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  fsNumUnmountable?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  fsProgress?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  fsState?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  fsUnmountableMask?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  fuseDirectio?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  fuseDirectioDefault?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  fuseDirectioStatus?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  fuseRemember?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  fuseRememberDefault?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  fuseRememberStatus?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  hideDotFiles?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  joinStatus?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  localMaster?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  localTld?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  luksKeyfile?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  maxArraysz?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  maxCachesz?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  mdColor?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  mdNumDisabled?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  mdNumDisks?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  mdNumErased?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  mdNumInvalid?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  mdNumMissing?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  mdNumNew?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  mdNumStripes?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  mdNumStripesDefault?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  mdNumStripesStatus?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  mdResync?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  mdResyncAction?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  mdResyncCorr?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  mdResyncDb?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  mdResyncDt?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  mdResyncPos?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  mdResyncSize?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  mdState?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  mdSyncThresh?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  mdSyncThreshDefault?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  mdSyncThreshStatus?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  mdSyncWindow?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  mdSyncWindowDefault?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  mdSyncWindowStatus?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  mdVersion?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  mdWriteMethod?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  mdWriteMethodDefault?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  mdWriteMethodStatus?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  name?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  nrRequests?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  nrRequestsDefault?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  nrRequestsStatus?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  ntpServer1?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  ntpServer2?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  ntpServer3?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  ntpServer4?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  pollAttributes?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  pollAttributesDefault?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  pollAttributesStatus?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  port?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  portssh?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  portssl?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  porttelnet?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  queueDepth?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  regCheck?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  regFile?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  regGen?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  regGuid?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  regState?: Resolver<Maybe<ResolversTypes['RegistrationState']>, ParentType, ContextType>;
  regTm?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  regTm2?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  regTo?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  regTy?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  safeMode?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  sbClean?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  sbEvents?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  sbName?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  sbNumDisks?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  sbState?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  sbSyncErrs?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  sbSyncExit?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  sbSynced?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  sbSynced2?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  sbUpdated?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  sbVersion?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  security?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  shareAfpCount?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  shareAfpEnabled?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  shareAvahiAfpModel?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  shareAvahiAfpName?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  shareAvahiEnabled?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  shareAvahiSmbModel?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  shareAvahiSmbName?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  shareCacheEnabled?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  shareCacheFloor?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  shareCount?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  shareDisk?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  shareInitialGroup?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  shareInitialOwner?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  shareMoverActive?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  shareMoverLogging?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  shareMoverSchedule?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  shareNfsCount?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  shareNfsEnabled?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  shareSmbCount?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  shareSmbEnabled?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  shareUser?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  shareUserExclude?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  shareUserInclude?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  shutdownTimeout?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  spindownDelay?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  spinupGroups?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  startArray?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  startMode?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  startPage?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  sysArraySlots?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  sysCacheSlots?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  sysFlashSlots?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  sysModel?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  timeZone?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  useNtp?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  useSsh?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  useSsl?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  useTelnet?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  version?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  workgroup?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type VersionsResolvers<ContextType = Context, ParentType extends ResolversParentTypes['Versions'] = ResolversParentTypes['Versions']> = ResolversObject<{
  apache?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  docker?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  gcc?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  git?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  grunt?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  gulp?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  kernel?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  mongodb?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  mysql?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  nginx?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  node?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  npm?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  openssl?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  perl?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  php?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  pm2?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  postfix?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  postgresql?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  python?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  redis?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  systemOpenssl?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  systemOpensslLib?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  tsc?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  unraid?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  v8?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  yarn?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type VmDomainResolvers<ContextType = Context, ParentType extends ResolversParentTypes['VmDomain'] = ResolversParentTypes['VmDomain']> = ResolversObject<{
  name?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  state?: Resolver<ResolversTypes['VmState'], ParentType, ContextType>;
  uuid?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type VmsResolvers<ContextType = Context, ParentType extends ResolversParentTypes['Vms'] = ResolversParentTypes['Vms']> = ResolversObject<{
  domain?: Resolver<Maybe<Array<ResolversTypes['VmDomain']>>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type WelcomeResolvers<ContextType = Context, ParentType extends ResolversParentTypes['Welcome'] = ResolversParentTypes['Welcome']> = ResolversObject<{
  message?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type Resolvers<ContextType = Context> = ResolversObject<{
  AccessUrl?: AccessUrlResolvers<ContextType>;
  ApiKey?: ApiKeyResolvers<ContextType>;
  ApiKeyResponse?: ApiKeyResponseResolvers<ContextType>;
  ApiKeyWithSecret?: ApiKeyWithSecretResolvers<ContextType>;
  Array?: ArrayResolvers<ContextType>;
  ArrayCapacity?: ArrayCapacityResolvers<ContextType>;
  ArrayDisk?: ArrayDiskResolvers<ContextType>;
  Baseboard?: BaseboardResolvers<ContextType>;
  Capacity?: CapacityResolvers<ContextType>;
  Case?: CaseResolvers<ContextType>;
  Cloud?: CloudResolvers<ContextType>;
  CloudResponse?: CloudResponseResolvers<ContextType>;
  Config?: ConfigResolvers<ContextType>;
  Connect?: ConnectResolvers<ContextType>;
  ConnectSettings?: ConnectSettingsResolvers<ContextType>;
  ConnectSettingsValues?: ConnectSettingsValuesResolvers<ContextType>;
  ContainerHostConfig?: ContainerHostConfigResolvers<ContextType>;
  ContainerMount?: ContainerMountResolvers<ContextType>;
  ContainerPort?: ContainerPortResolvers<ContextType>;
  DateTime?: GraphQLScalarType;
  Devices?: DevicesResolvers<ContextType>;
  Disk?: DiskResolvers<ContextType>;
  DiskPartition?: DiskPartitionResolvers<ContextType>;
  Display?: DisplayResolvers<ContextType>;
  Docker?: DockerResolvers<ContextType>;
  DockerContainer?: DockerContainerResolvers<ContextType>;
  DockerNetwork?: DockerNetworkResolvers<ContextType>;
  DynamicRemoteAccessStatus?: DynamicRemoteAccessStatusResolvers<ContextType>;
  Flash?: FlashResolvers<ContextType>;
  Gpu?: GpuResolvers<ContextType>;
  Info?: InfoResolvers<ContextType>;
  InfoApps?: InfoAppsResolvers<ContextType>;
  InfoCpu?: InfoCpuResolvers<ContextType>;
  InfoMemory?: InfoMemoryResolvers<ContextType>;
  JSON?: GraphQLScalarType;
  KeyFile?: KeyFileResolvers<ContextType>;
  Long?: GraphQLScalarType;
  Me?: MeResolvers<ContextType>;
  MemoryLayout?: MemoryLayoutResolvers<ContextType>;
  MinigraphqlResponse?: MinigraphqlResponseResolvers<ContextType>;
  Mount?: MountResolvers<ContextType>;
  Mutation?: MutationResolvers<ContextType>;
  Network?: NetworkResolvers<ContextType>;
  Node?: NodeResolvers<ContextType>;
  Notification?: NotificationResolvers<ContextType>;
  NotificationCounts?: NotificationCountsResolvers<ContextType>;
  NotificationOverview?: NotificationOverviewResolvers<ContextType>;
  Notifications?: NotificationsResolvers<ContextType>;
  Os?: OsResolvers<ContextType>;
  Owner?: OwnerResolvers<ContextType>;
  ParityCheck?: ParityCheckResolvers<ContextType>;
  Partition?: PartitionResolvers<ContextType>;
  Pci?: PciResolvers<ContextType>;
  Permission?: PermissionResolvers<ContextType>;
  Port?: GraphQLScalarType;
  ProfileModel?: ProfileModelResolvers<ContextType>;
  Query?: QueryResolvers<ContextType>;
  Registration?: RegistrationResolvers<ContextType>;
  RelayResponse?: RelayResponseResolvers<ContextType>;
  RemoteAccess?: RemoteAccessResolvers<ContextType>;
  Server?: ServerResolvers<ContextType>;
  Service?: ServiceResolvers<ContextType>;
  Share?: ShareResolvers<ContextType>;
  Subscription?: SubscriptionResolvers<ContextType>;
  System?: SystemResolvers<ContextType>;
  URL?: GraphQLScalarType;
  UUID?: GraphQLScalarType;
  UnassignedDevice?: UnassignedDeviceResolvers<ContextType>;
  Uptime?: UptimeResolvers<ContextType>;
  Usb?: UsbResolvers<ContextType>;
  User?: UserResolvers<ContextType>;
  UserAccount?: UserAccountResolvers<ContextType>;
  Vars?: VarsResolvers<ContextType>;
  Versions?: VersionsResolvers<ContextType>;
  VmDomain?: VmDomainResolvers<ContextType>;
  Vms?: VmsResolvers<ContextType>;
  Welcome?: WelcomeResolvers<ContextType>;
}>;

