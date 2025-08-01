/* eslint-disable */
import type { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
  /** The `BigInt` scalar type represents non-fractional signed whole numeric values. */
  BigInt: { input: any; output: any; }
  /** A date-time string at UTC, such as 2019-12-03T09:54:33Z, compliant with the date-time format. */
  DateTime: { input: string; output: string; }
  /** The `JSON` scalar type represents JSON values as specified by [ECMA-404](http://www.ecma-international.org/publications/files/ECMA-ST/ECMA-404.pdf). */
  JSON: { input: Record<string, any>; output: Record<string, any>; }
  /** A field whose value is a valid TCP port within the range of 0 to 65535: https://en.wikipedia.org/wiki/Transmission_Control_Protocol#TCP_ports */
  Port: { input: number; output: number; }
  /**
   *
   * ### Description:
   *
   * ID scalar type that prefixes the underlying ID with the server identifier on output and strips it on input.
   *
   * We use this scalar type to ensure that the ID is unique across all servers, allowing the same underlying resource ID to be used across different server instances.
   *
   * #### Input Behavior:
   *
   * When providing an ID as input (e.g., in arguments or input objects), the server identifier prefix ('<serverId>:') is optional.
   *
   * - If the prefix is present (e.g., '123:456'), it will be automatically stripped, and only the underlying ID ('456') will be used internally.
   * - If the prefix is absent (e.g., '456'), the ID will be used as-is.
   *
   * This makes it flexible for clients, as they don't strictly need to know or provide the server ID.
   *
   * #### Output Behavior:
   *
   * When an ID is returned in the response (output), it will *always* be prefixed with the current server's unique identifier (e.g., '123:456').
   *
   * #### Example:
   *
   * Note: The server identifier is '123' in this example.
   *
   * ##### Input (Prefix Optional):
   * ```graphql
   * # Both of these are valid inputs resolving to internal ID '456'
   * {
   *   someQuery(id: "123:456") { ... }
   *   anotherQuery(id: "456") { ... }
   * }
   * ```
   *
   * ##### Output (Prefix Always Added):
   * ```graphql
   * # Assuming internal ID is '456'
   * {
   *   "data": {
   *     "someResource": {
   *       "id": "123:456"
   *     }
   *   }
   * }
   * ```
   *
   */
  PrefixedID: { input: any; output: any; }
  /** A field whose value conforms to the standard URL format as specified in RFC3986: https://www.ietf.org/rfc/rfc3986.txt. */
  URL: { input: URL; output: URL; }
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

export type AccessUrlObject = {
  __typename?: 'AccessUrlObject';
  ipv4?: Maybe<Scalars['String']['output']>;
  ipv6?: Maybe<Scalars['String']['output']>;
  name?: Maybe<Scalars['String']['output']>;
  type: UrlType;
};

export type AccessUrlObjectInput = {
  ipv4?: InputMaybe<Scalars['String']['input']>;
  ipv6?: InputMaybe<Scalars['String']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  type: UrlType;
};

export type ActivationCode = {
  __typename?: 'ActivationCode';
  background?: Maybe<Scalars['String']['output']>;
  code?: Maybe<Scalars['String']['output']>;
  comment?: Maybe<Scalars['String']['output']>;
  header?: Maybe<Scalars['String']['output']>;
  headermetacolor?: Maybe<Scalars['String']['output']>;
  partnerName?: Maybe<Scalars['String']['output']>;
  partnerUrl?: Maybe<Scalars['String']['output']>;
  serverName?: Maybe<Scalars['String']['output']>;
  showBannerGradient?: Maybe<Scalars['Boolean']['output']>;
  sysModel?: Maybe<Scalars['String']['output']>;
  theme?: Maybe<Scalars['String']['output']>;
};

export type AddPermissionInput = {
  actions: Array<Scalars['String']['input']>;
  resource: Resource;
};

export type AddRoleForApiKeyInput = {
  apiKeyId: Scalars['PrefixedID']['input'];
  role: Role;
};

export type ApiConfig = {
  __typename?: 'ApiConfig';
  extraOrigins: Array<Scalars['String']['output']>;
  plugins: Array<Scalars['String']['output']>;
  sandbox?: Maybe<Scalars['Boolean']['output']>;
  ssoSubIds: Array<Scalars['String']['output']>;
  version: Scalars['String']['output'];
};

export type ApiKey = Node & {
  __typename?: 'ApiKey';
  createdAt: Scalars['String']['output'];
  description?: Maybe<Scalars['String']['output']>;
  id: Scalars['PrefixedID']['output'];
  name: Scalars['String']['output'];
  permissions: Array<Permission>;
  roles: Array<Role>;
};

/** API Key related mutations */
export type ApiKeyMutations = {
  __typename?: 'ApiKeyMutations';
  /** Add a role to an API key */
  addRole: Scalars['Boolean']['output'];
  /** Create an API key */
  create: ApiKeyWithSecret;
  /** Delete one or more API keys */
  delete: Scalars['Boolean']['output'];
  /** Remove a role from an API key */
  removeRole: Scalars['Boolean']['output'];
  /** Update an API key */
  update: ApiKeyWithSecret;
};


/** API Key related mutations */
export type ApiKeyMutationsAddRoleArgs = {
  input: AddRoleForApiKeyInput;
};


/** API Key related mutations */
export type ApiKeyMutationsCreateArgs = {
  input: CreateApiKeyInput;
};


/** API Key related mutations */
export type ApiKeyMutationsDeleteArgs = {
  input: DeleteApiKeyInput;
};


/** API Key related mutations */
export type ApiKeyMutationsRemoveRoleArgs = {
  input: RemoveRoleFromApiKeyInput;
};


/** API Key related mutations */
export type ApiKeyMutationsUpdateArgs = {
  input: UpdateApiKeyInput;
};

export type ApiKeyResponse = {
  __typename?: 'ApiKeyResponse';
  error?: Maybe<Scalars['String']['output']>;
  valid: Scalars['Boolean']['output'];
};

export type ApiKeyWithSecret = Node & {
  __typename?: 'ApiKeyWithSecret';
  createdAt: Scalars['String']['output'];
  description?: Maybe<Scalars['String']['output']>;
  id: Scalars['PrefixedID']['output'];
  key: Scalars['String']['output'];
  name: Scalars['String']['output'];
  permissions: Array<Permission>;
  roles: Array<Role>;
};

export type ArrayCapacity = {
  __typename?: 'ArrayCapacity';
  /** Capacity in number of disks */
  disks: Capacity;
  /** Capacity in kilobytes */
  kilobytes: Capacity;
};

export type ArrayDisk = Node & {
  __typename?: 'ArrayDisk';
  color?: Maybe<ArrayDiskFsColor>;
  /** User comment on disk */
  comment?: Maybe<Scalars['String']['output']>;
  /** (%) Disk space left for critical */
  critical?: Maybe<Scalars['Int']['output']>;
  device?: Maybe<Scalars['String']['output']>;
  exportable?: Maybe<Scalars['Boolean']['output']>;
  /** File format (ex MBR: 4KiB-aligned) */
  format?: Maybe<Scalars['String']['output']>;
  /** (KB) Free Size on the FS (Not present on Parity type drive) */
  fsFree?: Maybe<Scalars['BigInt']['output']>;
  /** (KB) Total Size of the FS (Not present on Parity type drive) */
  fsSize?: Maybe<Scalars['BigInt']['output']>;
  /** File system type for the disk */
  fsType?: Maybe<Scalars['String']['output']>;
  /** (KB) Used Size on the FS (Not present on Parity type drive) */
  fsUsed?: Maybe<Scalars['BigInt']['output']>;
  id: Scalars['PrefixedID']['output'];
  /** Array slot number. Parity1 is always 0 and Parity2 is always 29. Array slots will be 1 - 28. Cache slots are 30 - 53. Flash is 54. */
  idx: Scalars['Int']['output'];
  name?: Maybe<Scalars['String']['output']>;
  /** Number of unrecoverable errors reported by the device I/O drivers. Missing data due to unrecoverable array read errors is filled in on-the-fly using parity reconstruct (and we attempt to write this data back to the sector(s) which failed). Any unrecoverable write error results in disabling the disk. */
  numErrors?: Maybe<Scalars['BigInt']['output']>;
  /** Count of I/O read requests sent to the device I/O drivers. These statistics may be cleared at any time. */
  numReads?: Maybe<Scalars['BigInt']['output']>;
  /** Count of I/O writes requests sent to the device I/O drivers. These statistics may be cleared at any time. */
  numWrites?: Maybe<Scalars['BigInt']['output']>;
  /** Is the disk a HDD or SSD. */
  rotational?: Maybe<Scalars['Boolean']['output']>;
  /** (KB) Disk Size total */
  size?: Maybe<Scalars['BigInt']['output']>;
  status?: Maybe<ArrayDiskStatus>;
  /** Disk temp - will be NaN if array is not started or DISK_NP */
  temp?: Maybe<Scalars['Int']['output']>;
  /** ata | nvme | usb | (others) */
  transport?: Maybe<Scalars['String']['output']>;
  /** Type of Disk - used to differentiate Cache / Flash / Array / Parity */
  type: ArrayDiskType;
  /** (%) Disk space left to warn */
  warning?: Maybe<Scalars['Int']['output']>;
};

export enum ArrayDiskFsColor {
  BLUE_BLINK = 'BLUE_BLINK',
  BLUE_ON = 'BLUE_ON',
  GREEN_BLINK = 'GREEN_BLINK',
  GREEN_ON = 'GREEN_ON',
  GREY_OFF = 'GREY_OFF',
  RED_OFF = 'RED_OFF',
  RED_ON = 'RED_ON',
  YELLOW_BLINK = 'YELLOW_BLINK',
  YELLOW_ON = 'YELLOW_ON'
}

export type ArrayDiskInput = {
  /** Disk ID */
  id: Scalars['PrefixedID']['input'];
  /** The slot for the disk */
  slot?: InputMaybe<Scalars['Int']['input']>;
};

export enum ArrayDiskStatus {
  DISK_DSBL = 'DISK_DSBL',
  DISK_DSBL_NEW = 'DISK_DSBL_NEW',
  DISK_INVALID = 'DISK_INVALID',
  DISK_NEW = 'DISK_NEW',
  DISK_NP = 'DISK_NP',
  DISK_NP_DSBL = 'DISK_NP_DSBL',
  DISK_NP_MISSING = 'DISK_NP_MISSING',
  DISK_OK = 'DISK_OK',
  DISK_WRONG = 'DISK_WRONG'
}

export enum ArrayDiskType {
  CACHE = 'CACHE',
  DATA = 'DATA',
  FLASH = 'FLASH',
  PARITY = 'PARITY'
}

export type ArrayMutations = {
  __typename?: 'ArrayMutations';
  /** Add new disk to array */
  addDiskToArray: UnraidArray;
  /** Clear statistics for a disk in the array */
  clearArrayDiskStatistics: Scalars['Boolean']['output'];
  /** Mount a disk in the array */
  mountArrayDisk: ArrayDisk;
  /** Remove existing disk from array. NOTE: The array must be stopped before running this otherwise it'll throw an error. */
  removeDiskFromArray: UnraidArray;
  /** Set array state */
  setState: UnraidArray;
  /** Unmount a disk from the array */
  unmountArrayDisk: ArrayDisk;
};


export type ArrayMutationsAddDiskToArrayArgs = {
  input: ArrayDiskInput;
};


export type ArrayMutationsClearArrayDiskStatisticsArgs = {
  id: Scalars['PrefixedID']['input'];
};


export type ArrayMutationsMountArrayDiskArgs = {
  id: Scalars['PrefixedID']['input'];
};


export type ArrayMutationsRemoveDiskFromArrayArgs = {
  input: ArrayDiskInput;
};


export type ArrayMutationsSetStateArgs = {
  input: ArrayStateInput;
};


export type ArrayMutationsUnmountArrayDiskArgs = {
  id: Scalars['PrefixedID']['input'];
};

export enum ArrayState {
  DISABLE_DISK = 'DISABLE_DISK',
  INVALID_EXPANSION = 'INVALID_EXPANSION',
  NEW_ARRAY = 'NEW_ARRAY',
  NEW_DISK_TOO_SMALL = 'NEW_DISK_TOO_SMALL',
  NO_DATA_DISKS = 'NO_DATA_DISKS',
  PARITY_NOT_BIGGEST = 'PARITY_NOT_BIGGEST',
  RECON_DISK = 'RECON_DISK',
  STARTED = 'STARTED',
  STOPPED = 'STOPPED',
  SWAP_DSBL = 'SWAP_DSBL',
  TOO_MANY_MISSING_DISKS = 'TOO_MANY_MISSING_DISKS'
}

export type ArrayStateInput = {
  /** Array state */
  desiredState: ArrayStateInputState;
};

export enum ArrayStateInputState {
  START = 'START',
  STOP = 'STOP'
}

/** Available authentication action verbs */
export enum AuthActionVerb {
  CREATE = 'CREATE',
  DELETE = 'DELETE',
  READ = 'READ',
  UPDATE = 'UPDATE'
}

/** Available authentication possession types */
export enum AuthPossession {
  ANY = 'ANY',
  OWN = 'OWN',
  OWN_ANY = 'OWN_ANY'
}

export type Baseboard = Node & {
  __typename?: 'Baseboard';
  assetTag?: Maybe<Scalars['String']['output']>;
  id: Scalars['PrefixedID']['output'];
  manufacturer: Scalars['String']['output'];
  model?: Maybe<Scalars['String']['output']>;
  serial?: Maybe<Scalars['String']['output']>;
  version?: Maybe<Scalars['String']['output']>;
};

export type Capacity = {
  __typename?: 'Capacity';
  /** Free capacity */
  free: Scalars['String']['output'];
  /** Total capacity */
  total: Scalars['String']['output'];
  /** Used capacity */
  used: Scalars['String']['output'];
};

export type Case = Node & {
  __typename?: 'Case';
  base64?: Maybe<Scalars['String']['output']>;
  error?: Maybe<Scalars['String']['output']>;
  icon?: Maybe<Scalars['String']['output']>;
  id: Scalars['PrefixedID']['output'];
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
  error?: Maybe<Scalars['String']['output']>;
  id: Scalars['PrefixedID']['output'];
  valid?: Maybe<Scalars['Boolean']['output']>;
};

/** Possible error states for configuration */
export enum ConfigErrorState {
  INELIGIBLE = 'INELIGIBLE',
  INVALID = 'INVALID',
  NO_KEY_SERVER = 'NO_KEY_SERVER',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
  WITHDRAWN = 'WITHDRAWN'
}

export type Connect = Node & {
  __typename?: 'Connect';
  /** The status of dynamic remote access */
  dynamicRemoteAccess: DynamicRemoteAccessStatus;
  id: Scalars['PrefixedID']['output'];
  /** The settings for the Connect instance */
  settings: ConnectSettings;
};

export type ConnectSettings = Node & {
  __typename?: 'ConnectSettings';
  /** The data schema for the Connect settings */
  dataSchema: Scalars['JSON']['output'];
  id: Scalars['PrefixedID']['output'];
  /** The UI schema for the Connect settings */
  uiSchema: Scalars['JSON']['output'];
  /** The values for the Connect settings */
  values: ConnectSettingsValues;
};

export type ConnectSettingsInput = {
  /** The type of WAN access to use for Remote Access */
  accessType?: InputMaybe<WanAccessType>;
  /** The type of port forwarding to use for Remote Access */
  forwardType?: InputMaybe<WanForwardType>;
  /** The port to use for Remote Access. Not required for UPNP forwardType. Required for STATIC forwardType. Ignored if accessType is DISABLED or forwardType is UPNP. */
  port?: InputMaybe<Scalars['Int']['input']>;
};

export type ConnectSettingsValues = {
  __typename?: 'ConnectSettingsValues';
  /** The type of WAN access used for Remote Access */
  accessType: WanAccessType;
  /** The type of port forwarding used for Remote Access */
  forwardType?: Maybe<WanForwardType>;
  /** The port used for Remote Access */
  port?: Maybe<Scalars['Int']['output']>;
};

export type ConnectSignInInput = {
  /** The API key for authentication */
  apiKey: Scalars['String']['input'];
  /** User information for the sign-in */
  userInfo?: InputMaybe<ConnectUserInfoInput>;
};

export type ConnectUserInfoInput = {
  /** The avatar URL of the user */
  avatar?: InputMaybe<Scalars['String']['input']>;
  /** The email address of the user */
  email: Scalars['String']['input'];
  /** The preferred username of the user */
  preferred_username: Scalars['String']['input'];
};

export type ContainerHostConfig = {
  __typename?: 'ContainerHostConfig';
  networkMode: Scalars['String']['output'];
};

export type ContainerPort = {
  __typename?: 'ContainerPort';
  ip?: Maybe<Scalars['String']['output']>;
  privatePort?: Maybe<Scalars['Port']['output']>;
  publicPort?: Maybe<Scalars['Port']['output']>;
  type: ContainerPortType;
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
  /** This will replace the existing key if one already exists with the same name, otherwise returns the existing key */
  overwrite?: InputMaybe<Scalars['Boolean']['input']>;
  permissions?: InputMaybe<Array<AddPermissionInput>>;
  roles?: InputMaybe<Array<Role>>;
};

export type CreateRCloneRemoteInput = {
  name: Scalars['String']['input'];
  parameters: Scalars['JSON']['input'];
  type: Scalars['String']['input'];
};

export type Customization = {
  __typename?: 'Customization';
  activationCode?: Maybe<ActivationCode>;
  partnerInfo?: Maybe<PublicPartnerInfo>;
  theme: Theme;
};

export type DeleteApiKeyInput = {
  ids: Array<Scalars['PrefixedID']['input']>;
};

export type DeleteRCloneRemoteInput = {
  name: Scalars['String']['input'];
};

export type Devices = Node & {
  __typename?: 'Devices';
  gpu: Array<Gpu>;
  id: Scalars['PrefixedID']['output'];
  pci: Array<Pci>;
  usb: Array<Usb>;
};

export type Disk = Node & {
  __typename?: 'Disk';
  /** The number of bytes per sector */
  bytesPerSector: Scalars['Float']['output'];
  /** The device path of the disk (e.g. /dev/sdb) */
  device: Scalars['String']['output'];
  /** The firmware revision of the disk */
  firmwareRevision: Scalars['String']['output'];
  id: Scalars['PrefixedID']['output'];
  /** The interface type of the disk */
  interfaceType: DiskInterfaceType;
  /** The model name of the disk */
  name: Scalars['String']['output'];
  /** The partitions on the disk */
  partitions: Array<DiskPartition>;
  /** The number of sectors per track */
  sectorsPerTrack: Scalars['Float']['output'];
  /** The serial number of the disk */
  serialNum: Scalars['String']['output'];
  /** The total size of the disk in bytes */
  size: Scalars['Float']['output'];
  /** The SMART status of the disk */
  smartStatus: DiskSmartStatus;
  /** The current temperature of the disk in Celsius */
  temperature?: Maybe<Scalars['Float']['output']>;
  /** The total number of cylinders on the disk */
  totalCylinders: Scalars['Float']['output'];
  /** The total number of heads on the disk */
  totalHeads: Scalars['Float']['output'];
  /** The total number of sectors on the disk */
  totalSectors: Scalars['Float']['output'];
  /** The total number of tracks on the disk */
  totalTracks: Scalars['Float']['output'];
  /** The number of tracks per cylinder */
  tracksPerCylinder: Scalars['Float']['output'];
  /** The type of disk (e.g. SSD, HDD) */
  type: Scalars['String']['output'];
  /** The manufacturer of the disk */
  vendor: Scalars['String']['output'];
};

/** The type of filesystem on the disk partition */
export enum DiskFsType {
  BTRFS = 'BTRFS',
  EXT4 = 'EXT4',
  NTFS = 'NTFS',
  VFAT = 'VFAT',
  XFS = 'XFS',
  ZFS = 'ZFS'
}

/** The type of interface the disk uses to connect to the system */
export enum DiskInterfaceType {
  PCIE = 'PCIE',
  SAS = 'SAS',
  SATA = 'SATA',
  UNKNOWN = 'UNKNOWN',
  USB = 'USB'
}

export type DiskPartition = {
  __typename?: 'DiskPartition';
  /** The filesystem type of the partition */
  fsType: DiskFsType;
  /** The name of the partition */
  name: Scalars['String']['output'];
  /** The size of the partition in bytes */
  size: Scalars['Float']['output'];
};

/** The SMART (Self-Monitoring, Analysis and Reporting Technology) status of the disk */
export enum DiskSmartStatus {
  OK = 'OK',
  UNKNOWN = 'UNKNOWN'
}

export type Display = Node & {
  __typename?: 'Display';
  banner?: Maybe<Scalars['String']['output']>;
  case?: Maybe<Case>;
  critical?: Maybe<Scalars['Int']['output']>;
  dashapps?: Maybe<Scalars['String']['output']>;
  date?: Maybe<Scalars['String']['output']>;
  hot?: Maybe<Scalars['Int']['output']>;
  id: Scalars['PrefixedID']['output'];
  locale?: Maybe<Scalars['String']['output']>;
  max?: Maybe<Scalars['Int']['output']>;
  number?: Maybe<Scalars['String']['output']>;
  resize?: Maybe<Scalars['Boolean']['output']>;
  scale?: Maybe<Scalars['Boolean']['output']>;
  tabs?: Maybe<Scalars['Boolean']['output']>;
  text?: Maybe<Scalars['Boolean']['output']>;
  theme?: Maybe<ThemeName>;
  total?: Maybe<Scalars['Boolean']['output']>;
  unit?: Maybe<Temperature>;
  usage?: Maybe<Scalars['Boolean']['output']>;
  users?: Maybe<Scalars['String']['output']>;
  warning?: Maybe<Scalars['Int']['output']>;
  wwn?: Maybe<Scalars['Boolean']['output']>;
};

export type Docker = Node & {
  __typename?: 'Docker';
  containers: Array<DockerContainer>;
  id: Scalars['PrefixedID']['output'];
  networks: Array<DockerNetwork>;
  organizer: ResolvedOrganizerV1;
};


export type DockerContainersArgs = {
  skipCache?: Scalars['Boolean']['input'];
};


export type DockerNetworksArgs = {
  skipCache?: Scalars['Boolean']['input'];
};

export type DockerContainer = Node & {
  __typename?: 'DockerContainer';
  autoStart: Scalars['Boolean']['output'];
  command: Scalars['String']['output'];
  created: Scalars['Int']['output'];
  hostConfig?: Maybe<ContainerHostConfig>;
  id: Scalars['PrefixedID']['output'];
  image: Scalars['String']['output'];
  imageId: Scalars['String']['output'];
  labels?: Maybe<Scalars['JSON']['output']>;
  mounts?: Maybe<Array<Scalars['JSON']['output']>>;
  names: Array<Scalars['String']['output']>;
  networkSettings?: Maybe<Scalars['JSON']['output']>;
  ports: Array<ContainerPort>;
  /** Total size of all the files in the container */
  sizeRootFs?: Maybe<Scalars['Int']['output']>;
  state: ContainerState;
  status: Scalars['String']['output'];
};

export type DockerMutations = {
  __typename?: 'DockerMutations';
  /** Start a container */
  start: DockerContainer;
  /** Stop a container */
  stop: DockerContainer;
};


export type DockerMutationsStartArgs = {
  id: Scalars['PrefixedID']['input'];
};


export type DockerMutationsStopArgs = {
  id: Scalars['PrefixedID']['input'];
};

export type DockerNetwork = Node & {
  __typename?: 'DockerNetwork';
  attachable: Scalars['Boolean']['output'];
  configFrom: Scalars['JSON']['output'];
  configOnly: Scalars['Boolean']['output'];
  containers: Scalars['JSON']['output'];
  created: Scalars['String']['output'];
  driver: Scalars['String']['output'];
  enableIPv6: Scalars['Boolean']['output'];
  id: Scalars['PrefixedID']['output'];
  ingress: Scalars['Boolean']['output'];
  internal: Scalars['Boolean']['output'];
  ipam: Scalars['JSON']['output'];
  labels: Scalars['JSON']['output'];
  name: Scalars['String']['output'];
  options: Scalars['JSON']['output'];
  scope: Scalars['String']['output'];
};

export type DynamicRemoteAccessStatus = {
  __typename?: 'DynamicRemoteAccessStatus';
  /** The type of dynamic remote access that is enabled */
  enabledType: DynamicRemoteAccessType;
  /** Any error message associated with the dynamic remote access */
  error?: Maybe<Scalars['String']['output']>;
  /** The type of dynamic remote access that is currently running */
  runningType: DynamicRemoteAccessType;
};

export enum DynamicRemoteAccessType {
  DISABLED = 'DISABLED',
  STATIC = 'STATIC',
  UPNP = 'UPNP'
}

export type EnableDynamicRemoteAccessInput = {
  /** Whether to enable or disable dynamic remote access */
  enabled: Scalars['Boolean']['input'];
  /** The AccessURL Input for dynamic remote access */
  url: AccessUrlInput;
};

export type Flash = Node & {
  __typename?: 'Flash';
  guid: Scalars['String']['output'];
  id: Scalars['PrefixedID']['output'];
  product: Scalars['String']['output'];
  vendor: Scalars['String']['output'];
};

export type FlashBackupStatus = {
  __typename?: 'FlashBackupStatus';
  /** Job ID if available, can be used to check job status. */
  jobId?: Maybe<Scalars['String']['output']>;
  /** Status message indicating the outcome of the backup initiation. */
  status: Scalars['String']['output'];
};

export type Gpu = Node & {
  __typename?: 'Gpu';
  blacklisted: Scalars['Boolean']['output'];
  class: Scalars['String']['output'];
  id: Scalars['PrefixedID']['output'];
  productid: Scalars['String']['output'];
  type: Scalars['String']['output'];
  typeid: Scalars['String']['output'];
  vendorname: Scalars['String']['output'];
};

export type Info = Node & {
  __typename?: 'Info';
  /** Count of docker containers */
  apps: InfoApps;
  baseboard: Baseboard;
  cpu: InfoCpu;
  devices: Devices;
  display: Display;
  id: Scalars['PrefixedID']['output'];
  /** Machine ID */
  machineId?: Maybe<Scalars['PrefixedID']['output']>;
  memory: InfoMemory;
  os: Os;
  system: System;
  time: Scalars['DateTime']['output'];
  versions: Versions;
};

export type InfoApps = Node & {
  __typename?: 'InfoApps';
  id: Scalars['PrefixedID']['output'];
  /** How many docker containers are installed */
  installed: Scalars['Int']['output'];
  /** How many docker containers are running */
  started: Scalars['Int']['output'];
};

export type InfoCpu = Node & {
  __typename?: 'InfoCpu';
  brand: Scalars['String']['output'];
  cache: Scalars['JSON']['output'];
  cores: Scalars['Int']['output'];
  family: Scalars['String']['output'];
  flags: Array<Scalars['String']['output']>;
  id: Scalars['PrefixedID']['output'];
  manufacturer: Scalars['String']['output'];
  model: Scalars['String']['output'];
  processors: Scalars['Int']['output'];
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

export type InfoMemory = Node & {
  __typename?: 'InfoMemory';
  active: Scalars['BigInt']['output'];
  available: Scalars['BigInt']['output'];
  buffcache: Scalars['BigInt']['output'];
  free: Scalars['BigInt']['output'];
  id: Scalars['PrefixedID']['output'];
  layout: Array<MemoryLayout>;
  max: Scalars['BigInt']['output'];
  swapfree: Scalars['BigInt']['output'];
  swaptotal: Scalars['BigInt']['output'];
  swapused: Scalars['BigInt']['output'];
  total: Scalars['BigInt']['output'];
  used: Scalars['BigInt']['output'];
};

export type InitiateFlashBackupInput = {
  /** Destination path on the remote. */
  destinationPath: Scalars['String']['input'];
  /** Additional options for the backup operation, such as --dry-run or --transfers. */
  options?: InputMaybe<Scalars['JSON']['input']>;
  /** The name of the remote configuration to use for the backup. */
  remoteName: Scalars['String']['input'];
  /** Source path to backup (typically the flash drive). */
  sourcePath: Scalars['String']['input'];
};

export type KeyFile = {
  __typename?: 'KeyFile';
  contents?: Maybe<Scalars['String']['output']>;
  location?: Maybe<Scalars['String']['output']>;
};

export type LogFile = {
  __typename?: 'LogFile';
  /** Last modified timestamp */
  modifiedAt: Scalars['DateTime']['output'];
  /** Name of the log file */
  name: Scalars['String']['output'];
  /** Full path to the log file */
  path: Scalars['String']['output'];
  /** Size of the log file in bytes */
  size: Scalars['Int']['output'];
};

export type LogFileContent = {
  __typename?: 'LogFileContent';
  /** Content of the log file */
  content: Scalars['String']['output'];
  /** Path to the log file */
  path: Scalars['String']['output'];
  /** Starting line number of the content (1-indexed) */
  startLine?: Maybe<Scalars['Int']['output']>;
  /** Total number of lines in the file */
  totalLines: Scalars['Int']['output'];
};

export type MemoryLayout = Node & {
  __typename?: 'MemoryLayout';
  bank?: Maybe<Scalars['String']['output']>;
  clockSpeed?: Maybe<Scalars['Int']['output']>;
  formFactor?: Maybe<Scalars['String']['output']>;
  id: Scalars['PrefixedID']['output'];
  manufacturer?: Maybe<Scalars['String']['output']>;
  partNum?: Maybe<Scalars['String']['output']>;
  serialNum?: Maybe<Scalars['String']['output']>;
  size: Scalars['BigInt']['output'];
  type?: Maybe<Scalars['String']['output']>;
  voltageConfigured?: Maybe<Scalars['Int']['output']>;
  voltageMax?: Maybe<Scalars['Int']['output']>;
  voltageMin?: Maybe<Scalars['Int']['output']>;
};

/** The status of the minigraph */
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

export type Mutation = {
  __typename?: 'Mutation';
  /** Add one or more plugins to the API. Returns false if restart was triggered automatically, true if manual restart is required. */
  addPlugin: Scalars['Boolean']['output'];
  apiKey: ApiKeyMutations;
  archiveAll: NotificationOverview;
  /** Marks a notification as archived. */
  archiveNotification: Notification;
  archiveNotifications: NotificationOverview;
  array: ArrayMutations;
  configureUps: Scalars['Boolean']['output'];
  connectSignIn: Scalars['Boolean']['output'];
  connectSignOut: Scalars['Boolean']['output'];
  /** Creates a new notification record */
  createNotification: Notification;
  /** Deletes all archived notifications on server. */
  deleteArchivedNotifications: NotificationOverview;
  deleteNotification: NotificationOverview;
  docker: DockerMutations;
  enableDynamicRemoteAccess: Scalars['Boolean']['output'];
  /** Initiates a flash drive backup using a configured remote. */
  initiateFlashBackup: FlashBackupStatus;
  parityCheck: ParityCheckMutations;
  rclone: RCloneMutations;
  /** Reads each notification to recompute & update the overview. */
  recalculateOverview: NotificationOverview;
  /** Remove one or more plugins from the API. Returns false if restart was triggered automatically, true if manual restart is required. */
  removePlugin: Scalars['Boolean']['output'];
  setupRemoteAccess: Scalars['Boolean']['output'];
  unarchiveAll: NotificationOverview;
  unarchiveNotifications: NotificationOverview;
  /** Marks a notification as unread. */
  unreadNotification: Notification;
  updateApiSettings: ConnectSettingsValues;
  updateSettings: UpdateSettingsResponse;
  vm: VmMutations;
};


export type MutationAddPluginArgs = {
  input: PluginManagementInput;
};


export type MutationArchiveAllArgs = {
  importance?: InputMaybe<NotificationImportance>;
};


export type MutationArchiveNotificationArgs = {
  id: Scalars['PrefixedID']['input'];
};


export type MutationArchiveNotificationsArgs = {
  ids: Array<Scalars['PrefixedID']['input']>;
};


export type MutationConfigureUpsArgs = {
  config: UpsConfigInput;
};


export type MutationConnectSignInArgs = {
  input: ConnectSignInInput;
};


export type MutationCreateNotificationArgs = {
  input: NotificationData;
};


export type MutationDeleteNotificationArgs = {
  id: Scalars['PrefixedID']['input'];
  type: NotificationType;
};


export type MutationEnableDynamicRemoteAccessArgs = {
  input: EnableDynamicRemoteAccessInput;
};


export type MutationInitiateFlashBackupArgs = {
  input: InitiateFlashBackupInput;
};


export type MutationRemovePluginArgs = {
  input: PluginManagementInput;
};


export type MutationSetupRemoteAccessArgs = {
  input: SetupRemoteAccessInput;
};


export type MutationUnarchiveAllArgs = {
  importance?: InputMaybe<NotificationImportance>;
};


export type MutationUnarchiveNotificationsArgs = {
  ids: Array<Scalars['PrefixedID']['input']>;
};


export type MutationUnreadNotificationArgs = {
  id: Scalars['PrefixedID']['input'];
};


export type MutationUpdateApiSettingsArgs = {
  input: ConnectSettingsInput;
};


export type MutationUpdateSettingsArgs = {
  input: Scalars['JSON']['input'];
};

export type Network = Node & {
  __typename?: 'Network';
  accessUrls?: Maybe<Array<AccessUrl>>;
  id: Scalars['PrefixedID']['output'];
};

export type Node = {
  id: Scalars['PrefixedID']['output'];
};

export type Notification = Node & {
  __typename?: 'Notification';
  description: Scalars['String']['output'];
  formattedTimestamp?: Maybe<Scalars['String']['output']>;
  id: Scalars['PrefixedID']['output'];
  importance: NotificationImportance;
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
  importance: NotificationImportance;
  link?: InputMaybe<Scalars['String']['input']>;
  subject: Scalars['String']['input'];
  title: Scalars['String']['input'];
};

export type NotificationFilter = {
  importance?: InputMaybe<NotificationImportance>;
  limit: Scalars['Int']['input'];
  offset: Scalars['Int']['input'];
  type: NotificationType;
};

export enum NotificationImportance {
  ALERT = 'ALERT',
  INFO = 'INFO',
  WARNING = 'WARNING'
}

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
  id: Scalars['PrefixedID']['output'];
  list: Array<Notification>;
  /** A cached overview of the notifications in the system & their severity. */
  overview: NotificationOverview;
};


export type NotificationsListArgs = {
  filter: NotificationFilter;
};

export type OrganizerContainerResource = {
  __typename?: 'OrganizerContainerResource';
  id: Scalars['String']['output'];
  meta?: Maybe<DockerContainer>;
  name: Scalars['String']['output'];
  type: OrganizerResourceType;
};

export type OrganizerResource = {
  __typename?: 'OrganizerResource';
  id: Scalars['String']['output'];
  meta?: Maybe<Scalars['JSON']['output']>;
  name: Scalars['String']['output'];
  type: OrganizerResourceType;
};

/** The type of organizer resource */
export enum OrganizerResourceType {
  BOOKMARK = 'BOOKMARK',
  CONTAINER = 'CONTAINER',
  FILE = 'FILE',
  VM = 'VM'
}

export type Os = Node & {
  __typename?: 'Os';
  arch?: Maybe<Scalars['String']['output']>;
  build?: Maybe<Scalars['String']['output']>;
  codename?: Maybe<Scalars['String']['output']>;
  codepage?: Maybe<Scalars['String']['output']>;
  distro?: Maybe<Scalars['String']['output']>;
  hostname?: Maybe<Scalars['String']['output']>;
  id: Scalars['PrefixedID']['output'];
  kernel?: Maybe<Scalars['String']['output']>;
  logofile?: Maybe<Scalars['String']['output']>;
  platform?: Maybe<Scalars['String']['output']>;
  release?: Maybe<Scalars['String']['output']>;
  serial?: Maybe<Scalars['String']['output']>;
  uptime?: Maybe<Scalars['String']['output']>;
};

export type Owner = {
  __typename?: 'Owner';
  avatar: Scalars['String']['output'];
  url: Scalars['String']['output'];
  username: Scalars['String']['output'];
};

export type ParityCheck = {
  __typename?: 'ParityCheck';
  /** Whether corrections are being written to parity */
  correcting?: Maybe<Scalars['Boolean']['output']>;
  /** Date of the parity check */
  date?: Maybe<Scalars['DateTime']['output']>;
  /** Duration of the parity check in seconds */
  duration?: Maybe<Scalars['Int']['output']>;
  /** Number of errors during the parity check */
  errors?: Maybe<Scalars['Int']['output']>;
  /** Whether the parity check is paused */
  paused?: Maybe<Scalars['Boolean']['output']>;
  /** Progress percentage of the parity check */
  progress?: Maybe<Scalars['Int']['output']>;
  /** Whether the parity check is running */
  running?: Maybe<Scalars['Boolean']['output']>;
  /** Speed of the parity check, in MB/s */
  speed?: Maybe<Scalars['String']['output']>;
  /** Status of the parity check */
  status?: Maybe<Scalars['String']['output']>;
};

/** Parity check related mutations, WIP, response types and functionaliy will change */
export type ParityCheckMutations = {
  __typename?: 'ParityCheckMutations';
  /** Cancel a parity check */
  cancel: Scalars['JSON']['output'];
  /** Pause a parity check */
  pause: Scalars['JSON']['output'];
  /** Resume a parity check */
  resume: Scalars['JSON']['output'];
  /** Start a parity check */
  start: Scalars['JSON']['output'];
};


/** Parity check related mutations, WIP, response types and functionaliy will change */
export type ParityCheckMutationsStartArgs = {
  correct: Scalars['Boolean']['input'];
};

export type Pci = Node & {
  __typename?: 'Pci';
  blacklisted?: Maybe<Scalars['String']['output']>;
  class?: Maybe<Scalars['String']['output']>;
  id: Scalars['PrefixedID']['output'];
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

export type Plugin = {
  __typename?: 'Plugin';
  /** Whether the plugin has an API module */
  hasApiModule?: Maybe<Scalars['Boolean']['output']>;
  /** Whether the plugin has a CLI module */
  hasCliModule?: Maybe<Scalars['Boolean']['output']>;
  /** The name of the plugin package */
  name: Scalars['String']['output'];
  /** The version of the plugin package */
  version: Scalars['String']['output'];
};

export type PluginManagementInput = {
  /** Whether to treat plugins as bundled plugins. Bundled plugins are installed to node_modules at build time and controlled via config only. */
  bundled?: Scalars['Boolean']['input'];
  /** Array of plugin package names to add or remove */
  names: Array<Scalars['String']['input']>;
  /** Whether to restart the API after the operation. When false, a restart has already been queued. */
  restart?: Scalars['Boolean']['input'];
};

export type ProfileModel = Node & {
  __typename?: 'ProfileModel';
  avatar: Scalars['String']['output'];
  id: Scalars['PrefixedID']['output'];
  url: Scalars['String']['output'];
  username: Scalars['String']['output'];
};

export type PublicPartnerInfo = {
  __typename?: 'PublicPartnerInfo';
  /** Indicates if a partner logo exists */
  hasPartnerLogo: Scalars['Boolean']['output'];
  /** The path to the partner logo image on the flash drive, relative to the activation code file */
  partnerLogoUrl?: Maybe<Scalars['String']['output']>;
  partnerName?: Maybe<Scalars['String']['output']>;
  partnerUrl?: Maybe<Scalars['String']['output']>;
};

export type Query = {
  __typename?: 'Query';
  apiKey?: Maybe<ApiKey>;
  /** All possible permissions for API keys */
  apiKeyPossiblePermissions: Array<Permission>;
  /** All possible roles for API keys */
  apiKeyPossibleRoles: Array<Role>;
  apiKeys: Array<ApiKey>;
  array: UnraidArray;
  cloud: Cloud;
  config: Config;
  connect: Connect;
  customization?: Maybe<Customization>;
  disk: Disk;
  disks: Array<Disk>;
  display: Display;
  docker: Docker;
  flash: Flash;
  info: Info;
  isInitialSetup: Scalars['Boolean']['output'];
  isSSOEnabled: Scalars['Boolean']['output'];
  logFile: LogFileContent;
  logFiles: Array<LogFile>;
  me: UserAccount;
  network: Network;
  /** Get all notifications */
  notifications: Notifications;
  online: Scalars['Boolean']['output'];
  owner: Owner;
  parityHistory: Array<ParityCheck>;
  /** List all installed plugins with their metadata */
  plugins: Array<Plugin>;
  publicPartnerInfo?: Maybe<PublicPartnerInfo>;
  publicTheme: Theme;
  rclone: RCloneBackupSettings;
  registration?: Maybe<Registration>;
  remoteAccess: RemoteAccess;
  server?: Maybe<Server>;
  servers: Array<Server>;
  services: Array<Service>;
  settings: Settings;
  shares: Array<Share>;
  upsConfiguration: UpsConfiguration;
  upsDeviceById?: Maybe<UpsDevice>;
  upsDevices: Array<UpsDevice>;
  vars: Vars;
  /** Get information about all VMs on the system */
  vms: Vms;
};


export type QueryApiKeyArgs = {
  id: Scalars['PrefixedID']['input'];
};


export type QueryDiskArgs = {
  id: Scalars['PrefixedID']['input'];
};


export type QueryLogFileArgs = {
  lines?: InputMaybe<Scalars['Int']['input']>;
  path: Scalars['String']['input'];
  startLine?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryUpsDeviceByIdArgs = {
  id: Scalars['String']['input'];
};

export type RCloneBackupConfigForm = {
  __typename?: 'RCloneBackupConfigForm';
  dataSchema: Scalars['JSON']['output'];
  id: Scalars['ID']['output'];
  uiSchema: Scalars['JSON']['output'];
};

export type RCloneBackupSettings = {
  __typename?: 'RCloneBackupSettings';
  configForm: RCloneBackupConfigForm;
  drives: Array<RCloneDrive>;
  remotes: Array<RCloneRemote>;
};


export type RCloneBackupSettingsConfigFormArgs = {
  formOptions?: InputMaybe<RCloneConfigFormInput>;
};

export type RCloneConfigFormInput = {
  parameters?: InputMaybe<Scalars['JSON']['input']>;
  providerType?: InputMaybe<Scalars['String']['input']>;
  showAdvanced?: InputMaybe<Scalars['Boolean']['input']>;
};

export type RCloneDrive = {
  __typename?: 'RCloneDrive';
  /** Provider name */
  name: Scalars['String']['output'];
  /** Provider options and configuration schema */
  options: Scalars['JSON']['output'];
};

/** RClone related mutations */
export type RCloneMutations = {
  __typename?: 'RCloneMutations';
  /** Create a new RClone remote */
  createRCloneRemote: RCloneRemote;
  /** Delete an existing RClone remote */
  deleteRCloneRemote: Scalars['Boolean']['output'];
};


/** RClone related mutations */
export type RCloneMutationsCreateRCloneRemoteArgs = {
  input: CreateRCloneRemoteInput;
};


/** RClone related mutations */
export type RCloneMutationsDeleteRCloneRemoteArgs = {
  input: DeleteRCloneRemoteInput;
};

export type RCloneRemote = {
  __typename?: 'RCloneRemote';
  /** Complete remote configuration */
  config: Scalars['JSON']['output'];
  name: Scalars['String']['output'];
  parameters: Scalars['JSON']['output'];
  type: Scalars['String']['output'];
};

export type Registration = Node & {
  __typename?: 'Registration';
  expiration?: Maybe<Scalars['String']['output']>;
  id: Scalars['PrefixedID']['output'];
  keyFile?: Maybe<KeyFile>;
  state?: Maybe<RegistrationState>;
  type?: Maybe<RegistrationType>;
  updateExpiration?: Maybe<Scalars['String']['output']>;
};

export enum RegistrationState {
  BASIC = 'BASIC',
  EBLACKLISTED = 'EBLACKLISTED',
  EBLACKLISTED1 = 'EBLACKLISTED1',
  EBLACKLISTED2 = 'EBLACKLISTED2',
  EEXPIRED = 'EEXPIRED',
  EGUID = 'EGUID',
  EGUID1 = 'EGUID1',
  ENOCONN = 'ENOCONN',
  ENOFLASH = 'ENOFLASH',
  ENOFLASH1 = 'ENOFLASH1',
  ENOFLASH2 = 'ENOFLASH2',
  ENOFLASH3 = 'ENOFLASH3',
  ENOFLASH4 = 'ENOFLASH4',
  ENOFLASH5 = 'ENOFLASH5',
  ENOFLASH6 = 'ENOFLASH6',
  ENOFLASH7 = 'ENOFLASH7',
  ENOKEYFILE = 'ENOKEYFILE',
  ENOKEYFILE1 = 'ENOKEYFILE1',
  ENOKEYFILE2 = 'ENOKEYFILE2',
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
  /** The type of WAN access used for Remote Access */
  accessType: WanAccessType;
  /** The type of port forwarding used for Remote Access */
  forwardType?: Maybe<WanForwardType>;
  /** The port used for Remote Access */
  port?: Maybe<Scalars['Int']['output']>;
};

export type RemoveRoleFromApiKeyInput = {
  apiKeyId: Scalars['PrefixedID']['input'];
  role: Role;
};

export type ResolvedOrganizerEntry = OrganizerContainerResource | OrganizerResource | ResolvedOrganizerFolder;

export type ResolvedOrganizerFolder = {
  __typename?: 'ResolvedOrganizerFolder';
  children: Array<ResolvedOrganizerEntry>;
  id: Scalars['String']['output'];
  name: Scalars['String']['output'];
  type: Scalars['String']['output'];
};

export type ResolvedOrganizerV1 = {
  __typename?: 'ResolvedOrganizerV1';
  version: Scalars['Float']['output'];
  views: Array<ResolvedOrganizerView>;
};

export type ResolvedOrganizerView = {
  __typename?: 'ResolvedOrganizerView';
  id: Scalars['String']['output'];
  name: Scalars['String']['output'];
  prefs?: Maybe<Scalars['JSON']['output']>;
  root: ResolvedOrganizerEntry;
};

/** Available resources for permissions */
export enum Resource {
  ACTIVATION_CODE = 'ACTIVATION_CODE',
  API_KEY = 'API_KEY',
  ARRAY = 'ARRAY',
  CLOUD = 'CLOUD',
  CONFIG = 'CONFIG',
  CONNECT = 'CONNECT',
  CONNECT__REMOTE_ACCESS = 'CONNECT__REMOTE_ACCESS',
  CUSTOMIZATIONS = 'CUSTOMIZATIONS',
  DASHBOARD = 'DASHBOARD',
  DISK = 'DISK',
  DISPLAY = 'DISPLAY',
  DOCKER = 'DOCKER',
  FLASH = 'FLASH',
  INFO = 'INFO',
  LOGS = 'LOGS',
  ME = 'ME',
  NETWORK = 'NETWORK',
  NOTIFICATIONS = 'NOTIFICATIONS',
  ONLINE = 'ONLINE',
  OS = 'OS',
  OWNER = 'OWNER',
  PERMISSION = 'PERMISSION',
  REGISTRATION = 'REGISTRATION',
  SERVERS = 'SERVERS',
  SERVICES = 'SERVICES',
  SHARE = 'SHARE',
  VARS = 'VARS',
  VMS = 'VMS',
  WELCOME = 'WELCOME'
}

/** Available roles for API keys and users */
export enum Role {
  ADMIN = 'ADMIN',
  CONNECT = 'CONNECT',
  GUEST = 'GUEST',
  USER = 'USER'
}

export type Server = Node & {
  __typename?: 'Server';
  apikey: Scalars['String']['output'];
  guid: Scalars['String']['output'];
  id: Scalars['PrefixedID']['output'];
  lanip: Scalars['String']['output'];
  localurl: Scalars['String']['output'];
  name: Scalars['String']['output'];
  owner: ProfileModel;
  remoteurl: Scalars['String']['output'];
  status: ServerStatus;
  wanip: Scalars['String']['output'];
};

export enum ServerStatus {
  NEVER_CONNECTED = 'NEVER_CONNECTED',
  OFFLINE = 'OFFLINE',
  ONLINE = 'ONLINE'
}

export type Service = Node & {
  __typename?: 'Service';
  id: Scalars['PrefixedID']['output'];
  name?: Maybe<Scalars['String']['output']>;
  online?: Maybe<Scalars['Boolean']['output']>;
  uptime?: Maybe<Uptime>;
  version?: Maybe<Scalars['String']['output']>;
};

export type Settings = Node & {
  __typename?: 'Settings';
  /** The API setting values */
  api: ApiConfig;
  id: Scalars['PrefixedID']['output'];
  /** A view of all settings */
  unified: UnifiedSettings;
};

export type SetupRemoteAccessInput = {
  /** The type of WAN access to use for Remote Access */
  accessType: WanAccessType;
  /** The type of port forwarding to use for Remote Access */
  forwardType?: InputMaybe<WanForwardType>;
  /** The port to use for Remote Access. Not required for UPNP forwardType. Required for STATIC forwardType. Ignored if accessType is DISABLED or forwardType is UPNP. */
  port?: InputMaybe<Scalars['Int']['input']>;
};

export type Share = Node & {
  __typename?: 'Share';
  /** Allocator */
  allocator?: Maybe<Scalars['String']['output']>;
  /** Is this share cached */
  cache?: Maybe<Scalars['Boolean']['output']>;
  /** Color */
  color?: Maybe<Scalars['String']['output']>;
  /** User comment */
  comment?: Maybe<Scalars['String']['output']>;
  /** COW */
  cow?: Maybe<Scalars['String']['output']>;
  /** Disks that are excluded from this share */
  exclude?: Maybe<Array<Scalars['String']['output']>>;
  /** Floor */
  floor?: Maybe<Scalars['String']['output']>;
  /** (KB) Free space */
  free?: Maybe<Scalars['BigInt']['output']>;
  id: Scalars['PrefixedID']['output'];
  /** Disks that are included in this share */
  include?: Maybe<Array<Scalars['String']['output']>>;
  /** LUKS status */
  luksStatus?: Maybe<Scalars['String']['output']>;
  /** Display name */
  name?: Maybe<Scalars['String']['output']>;
  /** Original name */
  nameOrig?: Maybe<Scalars['String']['output']>;
  /** (KB) Total size */
  size?: Maybe<Scalars['BigInt']['output']>;
  /** Split level */
  splitLevel?: Maybe<Scalars['String']['output']>;
  /** (KB) Used Size */
  used?: Maybe<Scalars['BigInt']['output']>;
};

export type Subscription = {
  __typename?: 'Subscription';
  arraySubscription: UnraidArray;
  displaySubscription: Display;
  infoSubscription: Info;
  logFile: LogFileContent;
  notificationAdded: Notification;
  notificationsOverview: NotificationOverview;
  ownerSubscription: Owner;
  parityHistorySubscription: ParityCheck;
  serversSubscription: Server;
  upsUpdates: UpsDevice;
};


export type SubscriptionLogFileArgs = {
  path: Scalars['String']['input'];
};

export type System = Node & {
  __typename?: 'System';
  id: Scalars['PrefixedID']['output'];
  manufacturer?: Maybe<Scalars['String']['output']>;
  model?: Maybe<Scalars['String']['output']>;
  serial?: Maybe<Scalars['String']['output']>;
  sku?: Maybe<Scalars['String']['output']>;
  uuid?: Maybe<Scalars['String']['output']>;
  version?: Maybe<Scalars['String']['output']>;
};

/** Temperature unit (Celsius or Fahrenheit) */
export enum Temperature {
  C = 'C',
  F = 'F'
}

export type Theme = {
  __typename?: 'Theme';
  /** The background color of the header */
  headerBackgroundColor?: Maybe<Scalars['String']['output']>;
  /** The text color of the header */
  headerPrimaryTextColor?: Maybe<Scalars['String']['output']>;
  /** The secondary text color of the header */
  headerSecondaryTextColor?: Maybe<Scalars['String']['output']>;
  /** The theme name */
  name: ThemeName;
  /** Whether to show the banner gradient */
  showBannerGradient: Scalars['Boolean']['output'];
  /** Whether to show the header banner image */
  showBannerImage: Scalars['Boolean']['output'];
  /** Whether to show the description in the header */
  showHeaderDescription: Scalars['Boolean']['output'];
};

/** The theme name */
export enum ThemeName {
  AZURE = 'azure',
  BLACK = 'black',
  GRAY = 'gray',
  WHITE = 'white'
}

export type UpsBattery = {
  __typename?: 'UPSBattery';
  /** Battery charge level as a percentage (0-100). Unit: percent (%). Example: 100 means battery is fully charged */
  chargeLevel: Scalars['Int']['output'];
  /** Estimated runtime remaining on battery power. Unit: seconds. Example: 3600 means 1 hour of runtime remaining */
  estimatedRuntime: Scalars['Int']['output'];
  /** Battery health status. Possible values: 'Good', 'Replace', 'Unknown'. Indicates if the battery needs replacement */
  health: Scalars['String']['output'];
};

/** UPS cable connection types */
export enum UpsCableType {
  CUSTOM = 'CUSTOM',
  ETHER = 'ETHER',
  SIMPLE = 'SIMPLE',
  SMART = 'SMART',
  USB = 'USB'
}

export type UpsConfigInput = {
  /** Battery level percentage to initiate shutdown. Unit: percent (%) - Valid range: 0-100 */
  batteryLevel?: InputMaybe<Scalars['Int']['input']>;
  /** Custom cable configuration (only used when upsCable is CUSTOM). Format depends on specific UPS model */
  customUpsCable?: InputMaybe<Scalars['String']['input']>;
  /** Device path or network address for UPS connection. Examples: '/dev/ttyUSB0' for USB, '192.168.1.100:3551' for network */
  device?: InputMaybe<Scalars['String']['input']>;
  /** Turn off UPS power after system shutdown. Useful for ensuring complete power cycle */
  killUps?: InputMaybe<UpsKillPower>;
  /** Runtime left in minutes to initiate shutdown. Unit: minutes */
  minutes?: InputMaybe<Scalars['Int']['input']>;
  /** Override UPS capacity for runtime calculations. Unit: watts (W). Leave unset to use UPS-reported capacity */
  overrideUpsCapacity?: InputMaybe<Scalars['Int']['input']>;
  /** Enable or disable the UPS monitoring service */
  service?: InputMaybe<UpsServiceState>;
  /** Time on battery before shutdown. Unit: seconds. Set to 0 to disable timeout-based shutdown */
  timeout?: InputMaybe<Scalars['Int']['input']>;
  /** Type of cable connecting the UPS to the server */
  upsCable?: InputMaybe<UpsCableType>;
  /** UPS communication protocol */
  upsType?: InputMaybe<UpsType>;
};

export type UpsConfiguration = {
  __typename?: 'UPSConfiguration';
  /** Battery level threshold for shutdown. Unit: percent (%). Example: 10 means shutdown when battery reaches 10%. System will shutdown when battery drops to this level */
  batteryLevel?: Maybe<Scalars['Int']['output']>;
  /** Custom cable configuration string. Only used when upsCable is set to 'custom'. Format depends on specific UPS model */
  customUpsCable?: Maybe<Scalars['String']['output']>;
  /** Device path or network address for UPS connection. Examples: '/dev/ttyUSB0' for USB, '192.168.1.100:3551' for network. Depends on upsType setting */
  device?: Maybe<Scalars['String']['output']>;
  /** Kill UPS power after shutdown. Values: 'yes' or 'no'. If 'yes', tells UPS to cut power after system shutdown. Useful for ensuring complete power cycle */
  killUps?: Maybe<Scalars['String']['output']>;
  /** Runtime threshold for shutdown. Unit: minutes. Example: 5 means shutdown when 5 minutes runtime remaining. System will shutdown when estimated runtime drops below this */
  minutes?: Maybe<Scalars['Int']['output']>;
  /** Override UPS model name. Used for display purposes. Leave unset to use UPS-reported model */
  modelName?: Maybe<Scalars['String']['output']>;
  /** Network server mode. Values: 'on' or 'off'. Enable to allow network clients to monitor this UPS */
  netServer?: Maybe<Scalars['String']['output']>;
  /** Network Information Server (NIS) IP address. Default: '0.0.0.0' (listen on all interfaces). IP address for apcupsd network information server */
  nisIp?: Maybe<Scalars['String']['output']>;
  /** Override UPS capacity for runtime calculations. Unit: volt-amperes (VA). Example: 1500 for a 1500VA UPS. Leave unset to use UPS-reported capacity */
  overrideUpsCapacity?: Maybe<Scalars['Int']['output']>;
  /** UPS service state. Values: 'enable' or 'disable'. Controls whether the UPS monitoring service is running */
  service?: Maybe<Scalars['String']['output']>;
  /** Timeout for UPS communications. Unit: seconds. Example: 0 means no timeout. Time to wait for UPS response before considering it offline */
  timeout?: Maybe<Scalars['Int']['output']>;
  /** Type of cable connecting the UPS to the server. Common values: 'usb', 'smart', 'ether', 'custom'. Determines communication protocol */
  upsCable?: Maybe<Scalars['String']['output']>;
  /** UPS name for network monitoring. Used to identify this UPS on the network. Example: 'SERVER_UPS' */
  upsName?: Maybe<Scalars['String']['output']>;
  /** UPS communication type. Common values: 'usb', 'net', 'snmp', 'dumb', 'pcnet', 'modbus'. Defines how the server communicates with the UPS */
  upsType?: Maybe<Scalars['String']['output']>;
};

export type UpsDevice = {
  __typename?: 'UPSDevice';
  /** Battery-related information */
  battery: UpsBattery;
  /** Unique identifier for the UPS device. Usually based on the model name or a generated ID */
  id: Scalars['ID']['output'];
  /** UPS model name/number. Example: 'APC Back-UPS Pro 1500' */
  model: Scalars['String']['output'];
  /** Display name for the UPS device. Can be customized by the user */
  name: Scalars['String']['output'];
  /** Power-related information */
  power: UpsPower;
  /** Current operational status of the UPS. Common values: 'Online', 'On Battery', 'Low Battery', 'Replace Battery', 'Overload', 'Offline'. 'Online' means running on mains power, 'On Battery' means running on battery backup */
  status: Scalars['String']['output'];
};

/** Kill UPS power after shutdown option */
export enum UpsKillPower {
  NO = 'NO',
  YES = 'YES'
}

export type UpsPower = {
  __typename?: 'UPSPower';
  /** Input voltage from the wall outlet/mains power. Unit: volts (V). Example: 120.5 for typical US household voltage */
  inputVoltage: Scalars['Float']['output'];
  /** Current load on the UPS as a percentage of its capacity. Unit: percent (%). Example: 25 means UPS is loaded at 25% of its maximum capacity */
  loadPercentage: Scalars['Int']['output'];
  /** Output voltage being delivered to connected devices. Unit: volts (V). Example: 120.5 - should match input voltage when on mains power */
  outputVoltage: Scalars['Float']['output'];
};

/** Service state for UPS daemon */
export enum UpsServiceState {
  DISABLE = 'DISABLE',
  ENABLE = 'ENABLE'
}

/** UPS communication protocols */
export enum UpsType {
  APCSMART = 'APCSMART',
  DUMB = 'DUMB',
  MODBUS = 'MODBUS',
  NET = 'NET',
  PCNET = 'PCNET',
  SNMP = 'SNMP',
  USB = 'USB'
}

export enum UrlType {
  DEFAULT = 'DEFAULT',
  LAN = 'LAN',
  MDNS = 'MDNS',
  OTHER = 'OTHER',
  WAN = 'WAN',
  WIREGUARD = 'WIREGUARD'
}

export type UnifiedSettings = Node & {
  __typename?: 'UnifiedSettings';
  /** The data schema for the settings */
  dataSchema: Scalars['JSON']['output'];
  id: Scalars['PrefixedID']['output'];
  /** The UI schema for the settings */
  uiSchema: Scalars['JSON']['output'];
  /** The current values of the settings */
  values: Scalars['JSON']['output'];
};

export type UnraidArray = Node & {
  __typename?: 'UnraidArray';
  /** Current boot disk */
  boot?: Maybe<ArrayDisk>;
  /** Caches in the current array */
  caches: Array<ArrayDisk>;
  /** Current array capacity */
  capacity: ArrayCapacity;
  /** Data disks in the current array */
  disks: Array<ArrayDisk>;
  id: Scalars['PrefixedID']['output'];
  /** Parity disks in the current array */
  parities: Array<ArrayDisk>;
  /** Current array state */
  state: ArrayState;
};

export type UpdateApiKeyInput = {
  description?: InputMaybe<Scalars['String']['input']>;
  id: Scalars['PrefixedID']['input'];
  name?: InputMaybe<Scalars['String']['input']>;
  permissions?: InputMaybe<Array<AddPermissionInput>>;
  roles?: InputMaybe<Array<Role>>;
};

export type UpdateSettingsResponse = {
  __typename?: 'UpdateSettingsResponse';
  /** Whether a restart is required for the changes to take effect */
  restartRequired: Scalars['Boolean']['output'];
  /** The updated settings values */
  values: Scalars['JSON']['output'];
};

export type Uptime = {
  __typename?: 'Uptime';
  timestamp?: Maybe<Scalars['String']['output']>;
};

export type Usb = Node & {
  __typename?: 'Usb';
  id: Scalars['PrefixedID']['output'];
  name?: Maybe<Scalars['String']['output']>;
};

export type UserAccount = Node & {
  __typename?: 'UserAccount';
  /** A description of the user */
  description: Scalars['String']['output'];
  id: Scalars['PrefixedID']['output'];
  /** The name of the user */
  name: Scalars['String']['output'];
  /** The permissions of the user */
  permissions?: Maybe<Array<Permission>>;
  /** The roles of the user */
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
  id: Scalars['PrefixedID']['output'];
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
  regTy?: Maybe<RegistrationType>;
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

export type Versions = Node & {
  __typename?: 'Versions';
  apache?: Maybe<Scalars['String']['output']>;
  docker?: Maybe<Scalars['String']['output']>;
  gcc?: Maybe<Scalars['String']['output']>;
  git?: Maybe<Scalars['String']['output']>;
  grunt?: Maybe<Scalars['String']['output']>;
  gulp?: Maybe<Scalars['String']['output']>;
  id: Scalars['PrefixedID']['output'];
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

export type VmDomain = Node & {
  __typename?: 'VmDomain';
  /** The unique identifier for the vm (uuid) */
  id: Scalars['PrefixedID']['output'];
  /** A friendly name for the vm */
  name?: Maybe<Scalars['String']['output']>;
  /** Current domain vm state */
  state: VmState;
  /**
   * The UUID of the vm
   * @deprecated Use id instead
   */
  uuid?: Maybe<Scalars['String']['output']>;
};

export type VmMutations = {
  __typename?: 'VmMutations';
  /** Force stop a virtual machine */
  forceStop: Scalars['Boolean']['output'];
  /** Pause a virtual machine */
  pause: Scalars['Boolean']['output'];
  /** Reboot a virtual machine */
  reboot: Scalars['Boolean']['output'];
  /** Reset a virtual machine */
  reset: Scalars['Boolean']['output'];
  /** Resume a virtual machine */
  resume: Scalars['Boolean']['output'];
  /** Start a virtual machine */
  start: Scalars['Boolean']['output'];
  /** Stop a virtual machine */
  stop: Scalars['Boolean']['output'];
};


export type VmMutationsForceStopArgs = {
  id: Scalars['PrefixedID']['input'];
};


export type VmMutationsPauseArgs = {
  id: Scalars['PrefixedID']['input'];
};


export type VmMutationsRebootArgs = {
  id: Scalars['PrefixedID']['input'];
};


export type VmMutationsResetArgs = {
  id: Scalars['PrefixedID']['input'];
};


export type VmMutationsResumeArgs = {
  id: Scalars['PrefixedID']['input'];
};


export type VmMutationsStartArgs = {
  id: Scalars['PrefixedID']['input'];
};


export type VmMutationsStopArgs = {
  id: Scalars['PrefixedID']['input'];
};

/** The state of a virtual machine */
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

export type Vms = Node & {
  __typename?: 'Vms';
  domain?: Maybe<Array<VmDomain>>;
  domains?: Maybe<Array<VmDomain>>;
  id: Scalars['PrefixedID']['output'];
};

export enum WanAccessType {
  ALWAYS = 'ALWAYS',
  DISABLED = 'DISABLED',
  DYNAMIC = 'DYNAMIC'
}

export enum WanForwardType {
  STATIC = 'STATIC',
  UPNP = 'UPNP'
}

export enum RegistrationType {
  BASIC = 'BASIC',
  INVALID = 'INVALID',
  LIFETIME = 'LIFETIME',
  PLUS = 'PLUS',
  PRO = 'PRO',
  STARTER = 'STARTER',
  TRIAL = 'TRIAL',
  UNLEASHED = 'UNLEASHED'
}

export type AddPluginMutationVariables = Exact<{
  input: PluginManagementInput;
}>;


export type AddPluginMutation = { __typename?: 'Mutation', addPlugin: boolean };

export type RemovePluginMutationVariables = Exact<{
  input: PluginManagementInput;
}>;


export type RemovePluginMutation = { __typename?: 'Mutation', removePlugin: boolean };

export type UpdateSsoUsersMutationVariables = Exact<{
  input: Scalars['JSON']['input'];
}>;


export type UpdateSsoUsersMutation = { __typename?: 'Mutation', updateSettings: { __typename?: 'UpdateSettingsResponse', restartRequired: boolean, values: Record<string, any> } };

export type UpdateSandboxSettingsMutationVariables = Exact<{
  input: Scalars['JSON']['input'];
}>;


export type UpdateSandboxSettingsMutation = { __typename?: 'Mutation', updateSettings: { __typename?: 'UpdateSettingsResponse', restartRequired: boolean, values: Record<string, any> } };

export type GetPluginsQueryVariables = Exact<{ [key: string]: never; }>;


export type GetPluginsQuery = { __typename?: 'Query', plugins: Array<{ __typename?: 'Plugin', name: string, version: string, hasApiModule?: boolean | null, hasCliModule?: boolean | null }> };

export type GetSsoUsersQueryVariables = Exact<{ [key: string]: never; }>;


export type GetSsoUsersQuery = { __typename?: 'Query', settings: { __typename?: 'Settings', api: { __typename?: 'ApiConfig', ssoSubIds: Array<string> } } };

export type SystemReportQueryVariables = Exact<{ [key: string]: never; }>;


export type SystemReportQuery = { __typename?: 'Query', info: { __typename?: 'Info', id: any, machineId?: any | null, system: { __typename?: 'System', manufacturer?: string | null, model?: string | null, version?: string | null, sku?: string | null, serial?: string | null, uuid?: string | null }, versions: { __typename?: 'Versions', unraid?: string | null, kernel?: string | null, openssl?: string | null } }, config: { __typename?: 'Config', id: any, valid?: boolean | null, error?: string | null }, server?: { __typename?: 'Server', id: any, name: string } | null };

export type ConnectStatusQueryVariables = Exact<{ [key: string]: never; }>;


export type ConnectStatusQuery = { __typename?: 'Query', connect: { __typename?: 'Connect', id: any, dynamicRemoteAccess: { __typename?: 'DynamicRemoteAccessStatus', enabledType: DynamicRemoteAccessType, runningType: DynamicRemoteAccessType, error?: string | null } } };

export type ServicesQueryVariables = Exact<{ [key: string]: never; }>;


export type ServicesQuery = { __typename?: 'Query', services: Array<{ __typename?: 'Service', id: any, name?: string | null, online?: boolean | null, version?: string | null, uptime?: { __typename?: 'Uptime', timestamp?: string | null } | null }> };


export const AddPluginDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"AddPlugin"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"PluginManagementInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"addPlugin"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}]}]}}]} as unknown as DocumentNode<AddPluginMutation, AddPluginMutationVariables>;
export const RemovePluginDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"RemovePlugin"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"PluginManagementInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"removePlugin"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}]}]}}]} as unknown as DocumentNode<RemovePluginMutation, RemovePluginMutationVariables>;
export const UpdateSsoUsersDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateSSOUsers"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"JSON"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateSettings"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"restartRequired"}},{"kind":"Field","name":{"kind":"Name","value":"values"}}]}}]}}]} as unknown as DocumentNode<UpdateSsoUsersMutation, UpdateSsoUsersMutationVariables>;
export const UpdateSandboxSettingsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateSandboxSettings"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"JSON"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateSettings"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"restartRequired"}},{"kind":"Field","name":{"kind":"Name","value":"values"}}]}}]}}]} as unknown as DocumentNode<UpdateSandboxSettingsMutation, UpdateSandboxSettingsMutationVariables>;
export const GetPluginsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetPlugins"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"plugins"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"version"}},{"kind":"Field","name":{"kind":"Name","value":"hasApiModule"}},{"kind":"Field","name":{"kind":"Name","value":"hasCliModule"}}]}}]}}]} as unknown as DocumentNode<GetPluginsQuery, GetPluginsQueryVariables>;
export const GetSsoUsersDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetSSOUsers"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"settings"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"api"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"ssoSubIds"}}]}}]}}]}}]} as unknown as DocumentNode<GetSsoUsersQuery, GetSsoUsersQueryVariables>;
export const SystemReportDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"SystemReport"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"info"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"machineId"}},{"kind":"Field","name":{"kind":"Name","value":"system"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"manufacturer"}},{"kind":"Field","name":{"kind":"Name","value":"model"}},{"kind":"Field","name":{"kind":"Name","value":"version"}},{"kind":"Field","name":{"kind":"Name","value":"sku"}},{"kind":"Field","name":{"kind":"Name","value":"serial"}},{"kind":"Field","name":{"kind":"Name","value":"uuid"}}]}},{"kind":"Field","name":{"kind":"Name","value":"versions"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"unraid"}},{"kind":"Field","name":{"kind":"Name","value":"kernel"}},{"kind":"Field","name":{"kind":"Name","value":"openssl"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"config"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"valid"}},{"kind":"Field","name":{"kind":"Name","value":"error"}}]}},{"kind":"Field","name":{"kind":"Name","value":"server"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]} as unknown as DocumentNode<SystemReportQuery, SystemReportQueryVariables>;
export const ConnectStatusDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ConnectStatus"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"connect"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"dynamicRemoteAccess"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"enabledType"}},{"kind":"Field","name":{"kind":"Name","value":"runningType"}},{"kind":"Field","name":{"kind":"Name","value":"error"}}]}}]}}]}}]} as unknown as DocumentNode<ConnectStatusQuery, ConnectStatusQueryVariables>;
export const ServicesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"Services"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"services"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"online"}},{"kind":"Field","name":{"kind":"Name","value":"uptime"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"timestamp"}}]}},{"kind":"Field","name":{"kind":"Name","value":"version"}}]}}]}}]} as unknown as DocumentNode<ServicesQuery, ServicesQueryVariables>;