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
  BigInt: { input: number; output: number; }
  /** A date-time string at UTC, such as 2019-12-03T09:54:33Z, compliant with the date-time format. */
  DateTime: { input: string; output: string; }
  /** The `JSON` scalar type represents JSON values as specified by [ECMA-404](http://www.ecma-international.org/publications/files/ECMA-ST/ECMA-404.pdf). */
  JSON: { input: any; output: any; }
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
  PrefixedID: { input: string; output: string; }
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
  actions: Array<AuthAction>;
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
  key: Scalars['String']['output'];
  name: Scalars['String']['output'];
  permissions: Array<Permission>;
  roles: Array<Role>;
};

export type ApiKeyFormSettings = FormSchema & Node & {
  __typename?: 'ApiKeyFormSettings';
  /** The data schema for the API key form */
  dataSchema: Scalars['JSON']['output'];
  id: Scalars['PrefixedID']['output'];
  /** The UI schema for the API key form */
  uiSchema: Scalars['JSON']['output'];
  /** The current values of the API key form */
  values: Scalars['JSON']['output'];
};

/** API Key related mutations */
export type ApiKeyMutations = {
  __typename?: 'ApiKeyMutations';
  /** Add a role to an API key */
  addRole: Scalars['Boolean']['output'];
  /** Create an API key */
  create: ApiKey;
  /** Delete one or more API keys */
  delete: Scalars['Boolean']['output'];
  /** Remove a role from an API key */
  removeRole: Scalars['Boolean']['output'];
  /** Update an API key */
  update: ApiKey;
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
  /** Whether the disk is currently spinning */
  isSpinning?: Maybe<Scalars['Boolean']['output']>;
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

/** Authentication actions with possession (e.g., create:any, read:own) */
export enum AuthAction {
  /** Create any resource */
  CREATE_ANY = 'CREATE_ANY',
  /** Create own resource */
  CREATE_OWN = 'CREATE_OWN',
  /** Delete any resource */
  DELETE_ANY = 'DELETE_ANY',
  /** Delete own resource */
  DELETE_OWN = 'DELETE_OWN',
  /** Read any resource */
  READ_ANY = 'READ_ANY',
  /** Read own resource */
  READ_OWN = 'READ_OWN',
  /** Update any resource */
  UPDATE_ANY = 'UPDATE_ANY',
  /** Update own resource */
  UPDATE_OWN = 'UPDATE_OWN'
}

/** Operators for authorization rule matching */
export enum AuthorizationOperator {
  CONTAINS = 'CONTAINS',
  ENDS_WITH = 'ENDS_WITH',
  EQUALS = 'EQUALS',
  STARTS_WITH = 'STARTS_WITH'
}

/** Mode for evaluating authorization rules - OR (any rule passes) or AND (all rules must pass) */
export enum AuthorizationRuleMode {
  AND = 'AND',
  OR = 'OR'
}

export type Capacity = {
  __typename?: 'Capacity';
  /** Free capacity */
  free: Scalars['String']['output'];
  /** Total capacity */
  total: Scalars['String']['output'];
  /** Used capacity */
  used: Scalars['String']['output'];
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
  PAUSED = 'PAUSED',
  RUNNING = 'RUNNING'
}

export type CoreVersions = {
  __typename?: 'CoreVersions';
  /** Unraid API version */
  api?: Maybe<Scalars['String']['output']>;
  /** Kernel version */
  kernel?: Maybe<Scalars['String']['output']>;
  /** Unraid version */
  unraid?: Maybe<Scalars['String']['output']>;
};

/** CPU load for a single core */
export type CpuLoad = {
  __typename?: 'CpuLoad';
  /** The percentage of time the CPU spent running virtual machines (guest). */
  percentGuest: Scalars['Float']['output'];
  /** The percentage of time the CPU was idle. */
  percentIdle: Scalars['Float']['output'];
  /** The percentage of time the CPU spent servicing hardware interrupts. */
  percentIrq: Scalars['Float']['output'];
  /** The percentage of time the CPU spent on low-priority (niced) user space processes. */
  percentNice: Scalars['Float']['output'];
  /** The percentage of CPU time stolen by the hypervisor. */
  percentSteal: Scalars['Float']['output'];
  /** The percentage of time the CPU spent in kernel space. */
  percentSystem: Scalars['Float']['output'];
  /** The total CPU load on a single core, in percent. */
  percentTotal: Scalars['Float']['output'];
  /** The percentage of time the CPU spent in user space. */
  percentUser: Scalars['Float']['output'];
};

export type CpuPackages = Node & {
  __typename?: 'CpuPackages';
  id: Scalars['PrefixedID']['output'];
  /** Power draw per package (W) */
  power: Array<Scalars['Float']['output']>;
  /** Temperature per package (°C) */
  temp: Array<Scalars['Float']['output']>;
  /** Total CPU package power draw (W) */
  totalPower: Scalars['Float']['output'];
};

export type CpuUtilization = Node & {
  __typename?: 'CpuUtilization';
  /** CPU load for each core */
  cpus: Array<CpuLoad>;
  id: Scalars['PrefixedID']['output'];
  /** Total CPU load in percent */
  percentTotal: Scalars['Float']['output'];
};

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

/** Customization related mutations */
export type CustomizationMutations = {
  __typename?: 'CustomizationMutations';
  /** Update the UI theme (writes dynamix.cfg) */
  setTheme: Theme;
};


/** Customization related mutations */
export type CustomizationMutationsSetThemeArgs = {
  theme: ThemeName;
};

export type DeleteApiKeyInput = {
  ids: Array<Scalars['PrefixedID']['input']>;
};

export type DeleteRCloneRemoteInput = {
  name: Scalars['String']['input'];
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
  /** Whether the disk is spinning or not */
  isSpinning: Scalars['Boolean']['output'];
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

export type Docker = Node & {
  __typename?: 'Docker';
  container?: Maybe<DockerContainer>;
  containerUpdateStatuses: Array<ExplicitStatusItem>;
  containers: Array<DockerContainer>;
  id: Scalars['PrefixedID']['output'];
  /** Access container logs. Requires specifying a target container id through resolver arguments. */
  logs: DockerContainerLogs;
  networks: Array<DockerNetwork>;
  organizer: ResolvedOrganizerV1;
  portConflicts: DockerPortConflicts;
};


export type DockerContainerArgs = {
  id: Scalars['PrefixedID']['input'];
};


export type DockerContainersArgs = {
  skipCache?: Scalars['Boolean']['input'];
};


export type DockerLogsArgs = {
  id: Scalars['PrefixedID']['input'];
  since?: InputMaybe<Scalars['DateTime']['input']>;
  tail?: InputMaybe<Scalars['Int']['input']>;
};


export type DockerNetworksArgs = {
  skipCache?: Scalars['Boolean']['input'];
};


export type DockerOrganizerArgs = {
  skipCache?: Scalars['Boolean']['input'];
};


export type DockerPortConflictsArgs = {
  skipCache?: Scalars['Boolean']['input'];
};

export type DockerAutostartEntryInput = {
  /** Whether the container should auto-start */
  autoStart: Scalars['Boolean']['input'];
  /** Docker container identifier */
  id: Scalars['PrefixedID']['input'];
  /** Number of seconds to wait after starting the container */
  wait?: InputMaybe<Scalars['Int']['input']>;
};

export type DockerContainer = Node & {
  __typename?: 'DockerContainer';
  autoStart: Scalars['Boolean']['output'];
  /** Zero-based order in the auto-start list */
  autoStartOrder?: Maybe<Scalars['Int']['output']>;
  /** Wait time in seconds applied after start */
  autoStartWait?: Maybe<Scalars['Int']['output']>;
  command: Scalars['String']['output'];
  created: Scalars['Int']['output'];
  hostConfig?: Maybe<ContainerHostConfig>;
  /** Icon URL */
  iconUrl?: Maybe<Scalars['String']['output']>;
  id: Scalars['PrefixedID']['output'];
  image: Scalars['String']['output'];
  imageId: Scalars['String']['output'];
  /** Whether the container is orphaned (no template found) */
  isOrphaned: Scalars['Boolean']['output'];
  isRebuildReady?: Maybe<Scalars['Boolean']['output']>;
  isUpdateAvailable?: Maybe<Scalars['Boolean']['output']>;
  labels?: Maybe<Scalars['JSON']['output']>;
  /** List of LAN-accessible host:port values */
  lanIpPorts?: Maybe<Array<Scalars['String']['output']>>;
  mounts?: Maybe<Array<Scalars['JSON']['output']>>;
  names: Array<Scalars['String']['output']>;
  networkSettings?: Maybe<Scalars['JSON']['output']>;
  ports: Array<ContainerPort>;
  /** Project/Product homepage URL */
  projectUrl?: Maybe<Scalars['String']['output']>;
  /** Registry/Docker Hub URL */
  registryUrl?: Maybe<Scalars['String']['output']>;
  /** Shell to use for console access (from template) */
  shell?: Maybe<Scalars['String']['output']>;
  /** Size of container logs (in bytes) */
  sizeLog?: Maybe<Scalars['BigInt']['output']>;
  /** Total size of all files in the container (in bytes) */
  sizeRootFs?: Maybe<Scalars['BigInt']['output']>;
  /** Size of writable layer (in bytes) */
  sizeRw?: Maybe<Scalars['BigInt']['output']>;
  state: ContainerState;
  status: Scalars['String']['output'];
  /** Support page/thread URL */
  supportUrl?: Maybe<Scalars['String']['output']>;
  /** Whether Tailscale is enabled for this container */
  tailscaleEnabled: Scalars['Boolean']['output'];
  /** Tailscale status for this container (fetched via docker exec) */
  tailscaleStatus?: Maybe<TailscaleStatus>;
  templatePath?: Maybe<Scalars['String']['output']>;
  /** Port mappings from template (used when container is not running) */
  templatePorts?: Maybe<Array<ContainerPort>>;
  /** Resolved WebUI URL from template */
  webUiUrl?: Maybe<Scalars['String']['output']>;
};


export type DockerContainerTailscaleStatusArgs = {
  forceRefresh?: InputMaybe<Scalars['Boolean']['input']>;
};

export type DockerContainerLogLine = {
  __typename?: 'DockerContainerLogLine';
  message: Scalars['String']['output'];
  timestamp: Scalars['DateTime']['output'];
};

export type DockerContainerLogs = {
  __typename?: 'DockerContainerLogs';
  containerId: Scalars['PrefixedID']['output'];
  /** Cursor that can be passed back through the since argument to continue streaming logs. */
  cursor?: Maybe<Scalars['DateTime']['output']>;
  lines: Array<DockerContainerLogLine>;
};

export type DockerContainerPortConflict = {
  __typename?: 'DockerContainerPortConflict';
  containers: Array<DockerPortConflictContainer>;
  privatePort: Scalars['Port']['output'];
  type: ContainerPortType;
};

export type DockerContainerStats = {
  __typename?: 'DockerContainerStats';
  /** Block I/O String (e.g. 100MB / 1GB) */
  blockIO: Scalars['String']['output'];
  /** CPU Usage Percentage */
  cpuPercent: Scalars['Float']['output'];
  id: Scalars['PrefixedID']['output'];
  /** Memory Usage Percentage */
  memPercent: Scalars['Float']['output'];
  /** Memory Usage String (e.g. 100MB / 1GB) */
  memUsage: Scalars['String']['output'];
  /** Network I/O String (e.g. 100MB / 1GB) */
  netIO: Scalars['String']['output'];
};

export type DockerLanPortConflict = {
  __typename?: 'DockerLanPortConflict';
  containers: Array<DockerPortConflictContainer>;
  lanIpPort: Scalars['String']['output'];
  publicPort?: Maybe<Scalars['Port']['output']>;
  type: ContainerPortType;
};

export type DockerMutations = {
  __typename?: 'DockerMutations';
  /** Pause (Suspend) a container */
  pause: DockerContainer;
  /** Remove a container */
  removeContainer: Scalars['Boolean']['output'];
  /** Start a container */
  start: DockerContainer;
  /** Stop a container */
  stop: DockerContainer;
  /** Unpause (Resume) a container */
  unpause: DockerContainer;
  /** Update all containers that have available updates */
  updateAllContainers: Array<DockerContainer>;
  /** Update auto-start configuration for Docker containers */
  updateAutostartConfiguration: Scalars['Boolean']['output'];
  /** Update a container to the latest image */
  updateContainer: DockerContainer;
  /** Update multiple containers to the latest images */
  updateContainers: Array<DockerContainer>;
};


export type DockerMutationsPauseArgs = {
  id: Scalars['PrefixedID']['input'];
};


export type DockerMutationsRemoveContainerArgs = {
  id: Scalars['PrefixedID']['input'];
  withImage?: InputMaybe<Scalars['Boolean']['input']>;
};


export type DockerMutationsStartArgs = {
  id: Scalars['PrefixedID']['input'];
};


export type DockerMutationsStopArgs = {
  id: Scalars['PrefixedID']['input'];
};


export type DockerMutationsUnpauseArgs = {
  id: Scalars['PrefixedID']['input'];
};


export type DockerMutationsUpdateAutostartConfigurationArgs = {
  entries: Array<DockerAutostartEntryInput>;
  persistUserPreferences?: InputMaybe<Scalars['Boolean']['input']>;
};


export type DockerMutationsUpdateContainerArgs = {
  id: Scalars['PrefixedID']['input'];
};


export type DockerMutationsUpdateContainersArgs = {
  ids: Array<Scalars['PrefixedID']['input']>;
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

export type DockerPortConflictContainer = {
  __typename?: 'DockerPortConflictContainer';
  id: Scalars['PrefixedID']['output'];
  name: Scalars['String']['output'];
};

export type DockerPortConflicts = {
  __typename?: 'DockerPortConflicts';
  containerPorts: Array<DockerContainerPortConflict>;
  lanPorts: Array<DockerLanPortConflict>;
};

export type DockerTemplateSyncResult = {
  __typename?: 'DockerTemplateSyncResult';
  errors: Array<Scalars['String']['output']>;
  matched: Scalars['Int']['output'];
  scanned: Scalars['Int']['output'];
  skipped: Scalars['Int']['output'];
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

export type ExplicitStatusItem = {
  __typename?: 'ExplicitStatusItem';
  name: Scalars['String']['output'];
  updateStatus: UpdateStatus;
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

export type FlatOrganizerEntry = {
  __typename?: 'FlatOrganizerEntry';
  childrenIds: Array<Scalars['String']['output']>;
  depth: Scalars['Float']['output'];
  hasChildren: Scalars['Boolean']['output'];
  id: Scalars['String']['output'];
  meta?: Maybe<DockerContainer>;
  name: Scalars['String']['output'];
  parentId?: Maybe<Scalars['String']['output']>;
  path: Array<Scalars['String']['output']>;
  position: Scalars['Float']['output'];
  type: Scalars['String']['output'];
};

export type FormSchema = {
  /** The data schema for the form */
  dataSchema: Scalars['JSON']['output'];
  /** The UI schema for the form */
  uiSchema: Scalars['JSON']['output'];
  /** The current values of the form */
  values: Scalars['JSON']['output'];
};

export type Info = Node & {
  __typename?: 'Info';
  /** Motherboard information */
  baseboard: InfoBaseboard;
  /** CPU information */
  cpu: InfoCpu;
  /** Device information */
  devices: InfoDevices;
  /** Display configuration */
  display: InfoDisplay;
  id: Scalars['PrefixedID']['output'];
  /** Machine ID */
  machineId?: Maybe<Scalars['ID']['output']>;
  /** Memory information */
  memory: InfoMemory;
  /** Operating system information */
  os: InfoOs;
  /** System information */
  system: InfoSystem;
  /** Current server time */
  time: Scalars['DateTime']['output'];
  /** Software versions */
  versions: InfoVersions;
};

export type InfoBaseboard = Node & {
  __typename?: 'InfoBaseboard';
  /** Motherboard asset tag */
  assetTag?: Maybe<Scalars['String']['output']>;
  id: Scalars['PrefixedID']['output'];
  /** Motherboard manufacturer */
  manufacturer?: Maybe<Scalars['String']['output']>;
  /** Maximum memory capacity in bytes */
  memMax?: Maybe<Scalars['Float']['output']>;
  /** Number of memory slots */
  memSlots?: Maybe<Scalars['Float']['output']>;
  /** Motherboard model */
  model?: Maybe<Scalars['String']['output']>;
  /** Motherboard serial number */
  serial?: Maybe<Scalars['String']['output']>;
  /** Motherboard version */
  version?: Maybe<Scalars['String']['output']>;
};

export type InfoCpu = Node & {
  __typename?: 'InfoCpu';
  /** CPU brand name */
  brand?: Maybe<Scalars['String']['output']>;
  /** CPU cache information */
  cache?: Maybe<Scalars['JSON']['output']>;
  /** Number of CPU cores */
  cores?: Maybe<Scalars['Int']['output']>;
  /** CPU family */
  family?: Maybe<Scalars['String']['output']>;
  /** CPU feature flags */
  flags?: Maybe<Array<Scalars['String']['output']>>;
  id: Scalars['PrefixedID']['output'];
  /** CPU manufacturer */
  manufacturer?: Maybe<Scalars['String']['output']>;
  /** CPU model */
  model?: Maybe<Scalars['String']['output']>;
  packages: CpuPackages;
  /** Number of physical processors */
  processors?: Maybe<Scalars['Int']['output']>;
  /** CPU revision */
  revision?: Maybe<Scalars['String']['output']>;
  /** CPU socket type */
  socket?: Maybe<Scalars['String']['output']>;
  /** Current CPU speed in GHz */
  speed?: Maybe<Scalars['Float']['output']>;
  /** Maximum CPU speed in GHz */
  speedmax?: Maybe<Scalars['Float']['output']>;
  /** Minimum CPU speed in GHz */
  speedmin?: Maybe<Scalars['Float']['output']>;
  /** CPU stepping */
  stepping?: Maybe<Scalars['Int']['output']>;
  /** Number of CPU threads */
  threads?: Maybe<Scalars['Int']['output']>;
  /** Per-package array of core/thread pairs, e.g. [[[0,1],[2,3]], [[4,5],[6,7]]] */
  topology: Array<Array<Array<Scalars['Int']['output']>>>;
  /** CPU vendor */
  vendor?: Maybe<Scalars['String']['output']>;
  /** CPU voltage */
  voltage?: Maybe<Scalars['String']['output']>;
};

export type InfoDevices = Node & {
  __typename?: 'InfoDevices';
  /** List of GPU devices */
  gpu?: Maybe<Array<InfoGpu>>;
  id: Scalars['PrefixedID']['output'];
  /** List of network interfaces */
  network?: Maybe<Array<InfoNetwork>>;
  /** List of PCI devices */
  pci?: Maybe<Array<InfoPci>>;
  /** List of USB devices */
  usb?: Maybe<Array<InfoUsb>>;
};

export type InfoDisplay = Node & {
  __typename?: 'InfoDisplay';
  /** Case display configuration */
  case: InfoDisplayCase;
  /** Critical temperature threshold */
  critical: Scalars['Int']['output'];
  /** Hot temperature threshold */
  hot: Scalars['Int']['output'];
  id: Scalars['PrefixedID']['output'];
  /** Locale setting */
  locale?: Maybe<Scalars['String']['output']>;
  /** Maximum temperature threshold */
  max?: Maybe<Scalars['Int']['output']>;
  /** Enable UI resize */
  resize: Scalars['Boolean']['output'];
  /** Enable UI scaling */
  scale: Scalars['Boolean']['output'];
  /** Show tabs in UI */
  tabs: Scalars['Boolean']['output'];
  /** Show text labels */
  text: Scalars['Boolean']['output'];
  /** UI theme name */
  theme: ThemeName;
  /** Show totals */
  total: Scalars['Boolean']['output'];
  /** Temperature unit (C or F) */
  unit: Temperature;
  /** Show usage statistics */
  usage: Scalars['Boolean']['output'];
  /** Warning temperature threshold */
  warning: Scalars['Int']['output'];
  /** Show WWN identifiers */
  wwn: Scalars['Boolean']['output'];
};

export type InfoDisplayCase = Node & {
  __typename?: 'InfoDisplayCase';
  /** Base64 encoded case image */
  base64: Scalars['String']['output'];
  /** Error message if any */
  error: Scalars['String']['output'];
  /** Case icon identifier */
  icon: Scalars['String']['output'];
  id: Scalars['PrefixedID']['output'];
  /** Case image URL */
  url: Scalars['String']['output'];
};

export type InfoGpu = Node & {
  __typename?: 'InfoGpu';
  /** Whether GPU is blacklisted */
  blacklisted: Scalars['Boolean']['output'];
  /** Device class */
  class: Scalars['String']['output'];
  id: Scalars['PrefixedID']['output'];
  /** Product ID */
  productid: Scalars['String']['output'];
  /** GPU type/manufacturer */
  type: Scalars['String']['output'];
  /** GPU type identifier */
  typeid: Scalars['String']['output'];
  /** Vendor name */
  vendorname?: Maybe<Scalars['String']['output']>;
};

export type InfoMemory = Node & {
  __typename?: 'InfoMemory';
  id: Scalars['PrefixedID']['output'];
  /** Physical memory layout */
  layout: Array<MemoryLayout>;
};

export type InfoNetwork = Node & {
  __typename?: 'InfoNetwork';
  /** DHCP enabled flag */
  dhcp?: Maybe<Scalars['Boolean']['output']>;
  id: Scalars['PrefixedID']['output'];
  /** Network interface name */
  iface: Scalars['String']['output'];
  /** MAC address */
  mac?: Maybe<Scalars['String']['output']>;
  /** Network interface model */
  model?: Maybe<Scalars['String']['output']>;
  /** Network speed */
  speed?: Maybe<Scalars['String']['output']>;
  /** Network vendor */
  vendor?: Maybe<Scalars['String']['output']>;
  /** Virtual interface flag */
  virtual?: Maybe<Scalars['Boolean']['output']>;
};

export type InfoOs = Node & {
  __typename?: 'InfoOs';
  /** OS architecture */
  arch?: Maybe<Scalars['String']['output']>;
  /** OS build identifier */
  build?: Maybe<Scalars['String']['output']>;
  /** OS codename */
  codename?: Maybe<Scalars['String']['output']>;
  /** Linux distribution name */
  distro?: Maybe<Scalars['String']['output']>;
  /** Fully qualified domain name */
  fqdn?: Maybe<Scalars['String']['output']>;
  /** Hostname */
  hostname?: Maybe<Scalars['String']['output']>;
  id: Scalars['PrefixedID']['output'];
  /** Kernel version */
  kernel?: Maybe<Scalars['String']['output']>;
  /** OS logo name */
  logofile?: Maybe<Scalars['String']['output']>;
  /** Operating system platform */
  platform?: Maybe<Scalars['String']['output']>;
  /** OS release version */
  release?: Maybe<Scalars['String']['output']>;
  /** OS serial number */
  serial?: Maybe<Scalars['String']['output']>;
  /** Service pack version */
  servicepack?: Maybe<Scalars['String']['output']>;
  /** OS started via UEFI */
  uefi?: Maybe<Scalars['Boolean']['output']>;
  /** Boot time ISO string */
  uptime?: Maybe<Scalars['String']['output']>;
};

export type InfoPci = Node & {
  __typename?: 'InfoPci';
  /** Blacklisted status */
  blacklisted: Scalars['String']['output'];
  /** Device class */
  class: Scalars['String']['output'];
  id: Scalars['PrefixedID']['output'];
  /** Product ID */
  productid: Scalars['String']['output'];
  /** Product name */
  productname?: Maybe<Scalars['String']['output']>;
  /** Device type/manufacturer */
  type: Scalars['String']['output'];
  /** Type identifier */
  typeid: Scalars['String']['output'];
  /** Vendor ID */
  vendorid: Scalars['String']['output'];
  /** Vendor name */
  vendorname?: Maybe<Scalars['String']['output']>;
};

export type InfoSystem = Node & {
  __typename?: 'InfoSystem';
  id: Scalars['PrefixedID']['output'];
  /** System manufacturer */
  manufacturer?: Maybe<Scalars['String']['output']>;
  /** System model */
  model?: Maybe<Scalars['String']['output']>;
  /** System serial number */
  serial?: Maybe<Scalars['String']['output']>;
  /** System SKU */
  sku?: Maybe<Scalars['String']['output']>;
  /** System UUID */
  uuid?: Maybe<Scalars['String']['output']>;
  /** System version */
  version?: Maybe<Scalars['String']['output']>;
  /** Virtual machine flag */
  virtual?: Maybe<Scalars['Boolean']['output']>;
};

export type InfoUsb = Node & {
  __typename?: 'InfoUsb';
  /** USB bus number */
  bus?: Maybe<Scalars['String']['output']>;
  /** USB device number */
  device?: Maybe<Scalars['String']['output']>;
  id: Scalars['PrefixedID']['output'];
  /** USB device name */
  name: Scalars['String']['output'];
};

export type InfoVersions = Node & {
  __typename?: 'InfoVersions';
  /** Core system versions */
  core: CoreVersions;
  id: Scalars['PrefixedID']['output'];
  /** Software package versions */
  packages?: Maybe<PackageVersions>;
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
  /** Memory bank location (e.g., BANK 0) */
  bank?: Maybe<Scalars['String']['output']>;
  /** Memory clock speed in MHz */
  clockSpeed?: Maybe<Scalars['Int']['output']>;
  /** Form factor (e.g., DIMM, SODIMM) */
  formFactor?: Maybe<Scalars['String']['output']>;
  id: Scalars['PrefixedID']['output'];
  /** Memory manufacturer */
  manufacturer?: Maybe<Scalars['String']['output']>;
  /** Part number of the memory module */
  partNum?: Maybe<Scalars['String']['output']>;
  /** Serial number of the memory module */
  serialNum?: Maybe<Scalars['String']['output']>;
  /** Memory module size in bytes */
  size: Scalars['BigInt']['output'];
  /** Memory type (e.g., DDR4, DDR5) */
  type?: Maybe<Scalars['String']['output']>;
  /** Configured voltage in millivolts */
  voltageConfigured?: Maybe<Scalars['Int']['output']>;
  /** Maximum voltage in millivolts */
  voltageMax?: Maybe<Scalars['Int']['output']>;
  /** Minimum voltage in millivolts */
  voltageMin?: Maybe<Scalars['Int']['output']>;
};

export type MemoryUtilization = Node & {
  __typename?: 'MemoryUtilization';
  /** Active memory in bytes */
  active: Scalars['BigInt']['output'];
  /** Available memory in bytes */
  available: Scalars['BigInt']['output'];
  /** Buffer/cache memory in bytes */
  buffcache: Scalars['BigInt']['output'];
  /** Free memory in bytes */
  free: Scalars['BigInt']['output'];
  id: Scalars['PrefixedID']['output'];
  /** Swap usage percentage */
  percentSwapTotal: Scalars['Float']['output'];
  /** Memory usage percentage */
  percentTotal: Scalars['Float']['output'];
  /** Free swap memory in bytes */
  swapFree: Scalars['BigInt']['output'];
  /** Total swap memory in bytes */
  swapTotal: Scalars['BigInt']['output'];
  /** Used swap memory in bytes */
  swapUsed: Scalars['BigInt']['output'];
  /** Total system memory in bytes */
  total: Scalars['BigInt']['output'];
  /** Used memory in bytes */
  used: Scalars['BigInt']['output'];
};

/** System metrics including CPU and memory utilization */
export type Metrics = Node & {
  __typename?: 'Metrics';
  /** Current CPU utilization metrics */
  cpu?: Maybe<CpuUtilization>;
  id: Scalars['PrefixedID']['output'];
  /** Current memory utilization metrics */
  memory?: Maybe<MemoryUtilization>;
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
  createDockerFolder: ResolvedOrganizerV1;
  createDockerFolderWithItems: ResolvedOrganizerV1;
  /** Creates a new notification record */
  createNotification: Notification;
  customization: CustomizationMutations;
  /** Deletes all archived notifications on server. */
  deleteArchivedNotifications: NotificationOverview;
  deleteDockerEntries: ResolvedOrganizerV1;
  deleteNotification: NotificationOverview;
  docker: DockerMutations;
  enableDynamicRemoteAccess: Scalars['Boolean']['output'];
  /** Initiates a flash drive backup using a configured remote. */
  initiateFlashBackup: FlashBackupStatus;
  moveDockerEntriesToFolder: ResolvedOrganizerV1;
  moveDockerItemsToPosition: ResolvedOrganizerV1;
  /** Creates a notification if an equivalent unread notification does not already exist. */
  notifyIfUnique?: Maybe<Notification>;
  parityCheck: ParityCheckMutations;
  rclone: RCloneMutations;
  /** Reads each notification to recompute & update the overview. */
  recalculateOverview: NotificationOverview;
  refreshDockerDigests: Scalars['Boolean']['output'];
  /** Remove one or more plugins from the API. Returns false if restart was triggered automatically, true if manual restart is required. */
  removePlugin: Scalars['Boolean']['output'];
  renameDockerFolder: ResolvedOrganizerV1;
  /** Reset Docker template mappings to defaults. Use this to recover from corrupted state. */
  resetDockerTemplateMappings: Scalars['Boolean']['output'];
  setDockerFolderChildren: ResolvedOrganizerV1;
  setupRemoteAccess: Scalars['Boolean']['output'];
  syncDockerTemplatePaths: DockerTemplateSyncResult;
  unarchiveAll: NotificationOverview;
  unarchiveNotifications: NotificationOverview;
  /** Marks a notification as unread. */
  unreadNotification: Notification;
  updateApiSettings: ConnectSettingsValues;
  updateDockerViewPreferences: ResolvedOrganizerV1;
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


export type MutationCreateDockerFolderArgs = {
  childrenIds?: InputMaybe<Array<Scalars['String']['input']>>;
  name: Scalars['String']['input'];
  parentId?: InputMaybe<Scalars['String']['input']>;
};


export type MutationCreateDockerFolderWithItemsArgs = {
  name: Scalars['String']['input'];
  parentId?: InputMaybe<Scalars['String']['input']>;
  position?: InputMaybe<Scalars['Float']['input']>;
  sourceEntryIds?: InputMaybe<Array<Scalars['String']['input']>>;
};


export type MutationCreateNotificationArgs = {
  input: NotificationData;
};


export type MutationDeleteDockerEntriesArgs = {
  entryIds: Array<Scalars['String']['input']>;
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


export type MutationMoveDockerEntriesToFolderArgs = {
  destinationFolderId: Scalars['String']['input'];
  sourceEntryIds: Array<Scalars['String']['input']>;
};


export type MutationMoveDockerItemsToPositionArgs = {
  destinationFolderId: Scalars['String']['input'];
  position: Scalars['Float']['input'];
  sourceEntryIds: Array<Scalars['String']['input']>;
};


export type MutationNotifyIfUniqueArgs = {
  input: NotificationData;
};


export type MutationRemovePluginArgs = {
  input: PluginManagementInput;
};


export type MutationRenameDockerFolderArgs = {
  folderId: Scalars['String']['input'];
  newName: Scalars['String']['input'];
};


export type MutationSetDockerFolderChildrenArgs = {
  childrenIds: Array<Scalars['String']['input']>;
  folderId?: InputMaybe<Scalars['String']['input']>;
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


export type MutationUpdateDockerViewPreferencesArgs = {
  prefs: Scalars['JSON']['input'];
  viewId?: InputMaybe<Scalars['String']['input']>;
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
  /** Deduplicated list of unread warning and alert notifications, sorted latest first. */
  warningsAndAlerts: Array<Notification>;
};


export type NotificationsListArgs = {
  filter: NotificationFilter;
};

export type OidcAuthorizationRule = {
  __typename?: 'OidcAuthorizationRule';
  /** The claim to check (e.g., email, sub, groups, hd) */
  claim: Scalars['String']['output'];
  /** The comparison operator */
  operator: AuthorizationOperator;
  /** The value(s) to match against */
  value: Array<Scalars['String']['output']>;
};

export type OidcConfiguration = {
  __typename?: 'OidcConfiguration';
  /** Default allowed redirect origins that apply to all OIDC providers (e.g., Tailscale domains) */
  defaultAllowedOrigins?: Maybe<Array<Scalars['String']['output']>>;
  /** List of configured OIDC providers */
  providers: Array<OidcProvider>;
};

export type OidcProvider = {
  __typename?: 'OidcProvider';
  /** OAuth2 authorization endpoint URL. If omitted, will be auto-discovered from issuer/.well-known/openid-configuration */
  authorizationEndpoint?: Maybe<Scalars['String']['output']>;
  /** Mode for evaluating authorization rules - OR (any rule passes) or AND (all rules must pass). Defaults to OR. */
  authorizationRuleMode?: Maybe<AuthorizationRuleMode>;
  /** Flexible authorization rules based on claims */
  authorizationRules?: Maybe<Array<OidcAuthorizationRule>>;
  /** URL or base64 encoded icon for the login button */
  buttonIcon?: Maybe<Scalars['String']['output']>;
  /** Custom CSS styles for the button (e.g., "background: linear-gradient(to right, #4f46e5, #7c3aed); border-radius: 9999px;") */
  buttonStyle?: Maybe<Scalars['String']['output']>;
  /** Custom text for the login button */
  buttonText?: Maybe<Scalars['String']['output']>;
  /** Button variant style from Reka UI. See https://reka-ui.com/docs/components/button */
  buttonVariant?: Maybe<Scalars['String']['output']>;
  /** OAuth2 client ID registered with the provider */
  clientId: Scalars['String']['output'];
  /** OAuth2 client secret (if required by provider) */
  clientSecret?: Maybe<Scalars['String']['output']>;
  /** The unique identifier for the OIDC provider */
  id: Scalars['PrefixedID']['output'];
  /** OIDC issuer URL (e.g., https://accounts.google.com). Required for auto-discovery via /.well-known/openid-configuration */
  issuer?: Maybe<Scalars['String']['output']>;
  /** JSON Web Key Set URI for token validation. If omitted, will be auto-discovered from issuer/.well-known/openid-configuration */
  jwksUri?: Maybe<Scalars['String']['output']>;
  /** Display name of the OIDC provider */
  name: Scalars['String']['output'];
  /** OAuth2 scopes to request (e.g., openid, profile, email) */
  scopes: Array<Scalars['String']['output']>;
  /** OAuth2 token endpoint URL. If omitted, will be auto-discovered from issuer/.well-known/openid-configuration */
  tokenEndpoint?: Maybe<Scalars['String']['output']>;
};

export type OidcSessionValidation = {
  __typename?: 'OidcSessionValidation';
  username?: Maybe<Scalars['String']['output']>;
  valid: Scalars['Boolean']['output'];
};

export type Owner = {
  __typename?: 'Owner';
  avatar: Scalars['String']['output'];
  url: Scalars['String']['output'];
  username: Scalars['String']['output'];
};

export type PackageVersions = {
  __typename?: 'PackageVersions';
  /** Docker version */
  docker?: Maybe<Scalars['String']['output']>;
  /** Git version */
  git?: Maybe<Scalars['String']['output']>;
  /** nginx version */
  nginx?: Maybe<Scalars['String']['output']>;
  /** Node.js version */
  node?: Maybe<Scalars['String']['output']>;
  /** npm version */
  npm?: Maybe<Scalars['String']['output']>;
  /** OpenSSL version */
  openssl?: Maybe<Scalars['String']['output']>;
  /** PHP version */
  php?: Maybe<Scalars['String']['output']>;
  /** pm2 version */
  pm2?: Maybe<Scalars['String']['output']>;
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
  status: ParityCheckStatus;
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

export enum ParityCheckStatus {
  CANCELLED = 'CANCELLED',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  NEVER_RUN = 'NEVER_RUN',
  PAUSED = 'PAUSED',
  RUNNING = 'RUNNING'
}

export type Permission = {
  __typename?: 'Permission';
  /** Actions allowed on this resource */
  actions: Array<AuthAction>;
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

export type PublicOidcProvider = {
  __typename?: 'PublicOidcProvider';
  buttonIcon?: Maybe<Scalars['String']['output']>;
  buttonStyle?: Maybe<Scalars['String']['output']>;
  buttonText?: Maybe<Scalars['String']['output']>;
  buttonVariant?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
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
  docker: Docker;
  flash: Flash;
  /** Get JSON Schema for API key creation form */
  getApiKeyCreationFormSchema: ApiKeyFormSettings;
  /** Get all available authentication actions with possession */
  getAvailableAuthActions: Array<AuthAction>;
  /** Get the actual permissions that would be granted by a set of roles */
  getPermissionsForRoles: Array<Permission>;
  info: Info;
  isInitialSetup: Scalars['Boolean']['output'];
  isSSOEnabled: Scalars['Boolean']['output'];
  logFile: LogFileContent;
  logFiles: Array<LogFile>;
  me: UserAccount;
  metrics: Metrics;
  network: Network;
  /** Get all notifications */
  notifications: Notifications;
  /** Get the full OIDC configuration (admin only) */
  oidcConfiguration: OidcConfiguration;
  /** Get a specific OIDC provider by ID */
  oidcProvider?: Maybe<OidcProvider>;
  /** Get all configured OIDC providers (admin only) */
  oidcProviders: Array<OidcProvider>;
  online: Scalars['Boolean']['output'];
  owner: Owner;
  parityHistory: Array<ParityCheck>;
  /** List all installed plugins with their metadata */
  plugins: Array<Plugin>;
  /** Preview the effective permissions for a combination of roles and explicit permissions */
  previewEffectivePermissions: Array<Permission>;
  /** Get public OIDC provider information for login buttons */
  publicOidcProviders: Array<PublicOidcProvider>;
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
  /** Validate an OIDC session token (internal use for CLI validation) */
  validateOidcSession: OidcSessionValidation;
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


export type QueryGetPermissionsForRolesArgs = {
  roles: Array<Role>;
};


export type QueryLogFileArgs = {
  lines?: InputMaybe<Scalars['Int']['input']>;
  path: Scalars['String']['input'];
  startLine?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryOidcProviderArgs = {
  id: Scalars['PrefixedID']['input'];
};


export type QueryPreviewEffectivePermissionsArgs = {
  permissions?: InputMaybe<Array<AddPermissionInput>>;
  roles?: InputMaybe<Array<Role>>;
};


export type QueryUpsDeviceByIdArgs = {
  id: Scalars['String']['input'];
};


export type QueryValidateOidcSessionArgs = {
  token: Scalars['String']['input'];
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

export type ResolvedOrganizerV1 = {
  __typename?: 'ResolvedOrganizerV1';
  version: Scalars['Float']['output'];
  views: Array<ResolvedOrganizerView>;
};

export type ResolvedOrganizerView = {
  __typename?: 'ResolvedOrganizerView';
  flatEntries: Array<FlatOrganizerEntry>;
  id: Scalars['String']['output'];
  name: Scalars['String']['output'];
  prefs?: Maybe<Scalars['JSON']['output']>;
  rootId: Scalars['String']['output'];
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
  /** Full administrative access to all resources */
  ADMIN = 'ADMIN',
  /** Internal Role for Unraid Connect */
  CONNECT = 'CONNECT',
  /** Basic read access to user profile only */
  GUEST = 'GUEST',
  /** Read-only access to all resources */
  VIEWER = 'VIEWER'
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
  /** Whether this server is online or offline */
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
  /** SSO settings */
  sso: SsoSettings;
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

export type SsoSettings = Node & {
  __typename?: 'SsoSettings';
  id: Scalars['PrefixedID']['output'];
  /** List of configured OIDC providers */
  oidcProviders: Array<OidcProvider>;
};

export type Subscription = {
  __typename?: 'Subscription';
  arraySubscription: UnraidArray;
  dockerContainerStats: DockerContainerStats;
  logFile: LogFileContent;
  notificationAdded: Notification;
  notificationsOverview: NotificationOverview;
  notificationsWarningsAndAlerts: Array<Notification>;
  ownerSubscription: Owner;
  parityHistorySubscription: ParityCheck;
  serversSubscription: Server;
  systemMetricsCpu: CpuUtilization;
  systemMetricsCpuTelemetry: CpuPackages;
  systemMetricsMemory: MemoryUtilization;
  upsUpdates: UpsDevice;
};


export type SubscriptionLogFileArgs = {
  path: Scalars['String']['input'];
};

/** Tailscale exit node connection status */
export type TailscaleExitNodeStatus = {
  __typename?: 'TailscaleExitNodeStatus';
  /** Whether the exit node is online */
  online: Scalars['Boolean']['output'];
  /** Tailscale IPs of the exit node */
  tailscaleIps?: Maybe<Array<Scalars['String']['output']>>;
};

/** Tailscale status for a Docker container */
export type TailscaleStatus = {
  __typename?: 'TailscaleStatus';
  /** Authentication URL if Tailscale needs login */
  authUrl?: Maybe<Scalars['String']['output']>;
  /** Tailscale backend state (Running, NeedsLogin, Stopped, etc.) */
  backendState?: Maybe<Scalars['String']['output']>;
  /** Actual Tailscale DNS name */
  dnsName?: Maybe<Scalars['String']['output']>;
  /** Status of the connected exit node (if using one) */
  exitNodeStatus?: Maybe<TailscaleExitNodeStatus>;
  /** Configured Tailscale hostname */
  hostname?: Maybe<Scalars['String']['output']>;
  /** Whether this container is an exit node */
  isExitNode: Scalars['Boolean']['output'];
  /** Whether the Tailscale key has expired */
  keyExpired: Scalars['Boolean']['output'];
  /** Tailscale key expiry date */
  keyExpiry?: Maybe<Scalars['DateTime']['output']>;
  /** Days until key expires */
  keyExpiryDays?: Maybe<Scalars['Int']['output']>;
  /** Latest available Tailscale version */
  latestVersion?: Maybe<Scalars['String']['output']>;
  /** Whether Tailscale is online in the container */
  online: Scalars['Boolean']['output'];
  /** Advertised subnet routes */
  primaryRoutes?: Maybe<Array<Scalars['String']['output']>>;
  /** DERP relay code */
  relay?: Maybe<Scalars['String']['output']>;
  /** DERP relay region name */
  relayName?: Maybe<Scalars['String']['output']>;
  /** Tailscale IPv4 and IPv6 addresses */
  tailscaleIps?: Maybe<Array<Scalars['String']['output']>>;
  /** Whether a Tailscale update is available */
  updateAvailable: Scalars['Boolean']['output'];
  /** Current Tailscale version */
  version?: Maybe<Scalars['String']['output']>;
  /** Tailscale Serve/Funnel WebUI URL */
  webUiUrl?: Maybe<Scalars['String']['output']>;
};

/** Temperature unit */
export enum Temperature {
  CELSIUS = 'CELSIUS',
  FAHRENHEIT = 'FAHRENHEIT'
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

export type UnifiedSettings = FormSchema & Node & {
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
  /** Current parity check status */
  parityCheckStatus: ParityCheck;
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
  /** Warning messages about configuration issues found during validation */
  warnings?: Maybe<Array<Scalars['String']['output']>>;
};

/** Update status of a container. */
export enum UpdateStatus {
  REBUILD_READY = 'REBUILD_READY',
  UNKNOWN = 'UNKNOWN',
  UPDATE_AVAILABLE = 'UPDATE_AVAILABLE',
  UP_TO_DATE = 'UP_TO_DATE'
}

export type Uptime = {
  __typename?: 'Uptime';
  timestamp?: Maybe<Scalars['String']['output']>;
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

export type PartnerInfoQueryVariables = Exact<{ [key: string]: never; }>;


export type PartnerInfoQuery = { __typename?: 'Query', publicPartnerInfo?: { __typename?: 'PublicPartnerInfo', hasPartnerLogo: boolean, partnerName?: string | null, partnerUrl?: string | null, partnerLogoUrl?: string | null } | null };

export type PublicWelcomeDataQueryVariables = Exact<{ [key: string]: never; }>;


export type PublicWelcomeDataQuery = { __typename?: 'Query', isInitialSetup: boolean, publicPartnerInfo?: { __typename?: 'PublicPartnerInfo', hasPartnerLogo: boolean, partnerName?: string | null, partnerUrl?: string | null, partnerLogoUrl?: string | null } | null };

export type ActivationCodeQueryVariables = Exact<{ [key: string]: never; }>;


export type ActivationCodeQuery = { __typename?: 'Query', vars: { __typename?: 'Vars', regState?: RegistrationState | null }, customization?: { __typename?: 'Customization', activationCode?: { __typename?: 'ActivationCode', code?: string | null, partnerName?: string | null, serverName?: string | null, sysModel?: string | null, comment?: string | null, header?: string | null, headermetacolor?: string | null, background?: string | null, showBannerGradient?: boolean | null, theme?: string | null } | null, partnerInfo?: { __typename?: 'PublicPartnerInfo', hasPartnerLogo: boolean, partnerName?: string | null, partnerUrl?: string | null, partnerLogoUrl?: string | null } | null } | null };

export type GetApiKeyCreationFormSchemaQueryVariables = Exact<{ [key: string]: never; }>;


export type GetApiKeyCreationFormSchemaQuery = { __typename?: 'Query', getApiKeyCreationFormSchema: { __typename?: 'ApiKeyFormSettings', id: string, dataSchema: any, uiSchema: any, values: any } };

export type CreateApiKeyMutationVariables = Exact<{
  input: CreateApiKeyInput;
}>;


export type CreateApiKeyMutation = { __typename?: 'Mutation', apiKey: { __typename?: 'ApiKeyMutations', create: (
      { __typename?: 'ApiKey' }
      & { ' $fragmentRefs'?: { 'ApiKeyFragment': ApiKeyFragment } }
    ) } };

export type UpdateApiKeyMutationVariables = Exact<{
  input: UpdateApiKeyInput;
}>;


export type UpdateApiKeyMutation = { __typename?: 'Mutation', apiKey: { __typename?: 'ApiKeyMutations', update: (
      { __typename?: 'ApiKey' }
      & { ' $fragmentRefs'?: { 'ApiKeyFragment': ApiKeyFragment } }
    ) } };

export type DeleteApiKeyMutationVariables = Exact<{
  input: DeleteApiKeyInput;
}>;


export type DeleteApiKeyMutation = { __typename?: 'Mutation', apiKey: { __typename?: 'ApiKeyMutations', delete: boolean } };

export type ApiKeyFragment = { __typename?: 'ApiKey', id: string, key: string, name: string, description?: string | null, createdAt: string, roles: Array<Role>, permissions: Array<{ __typename?: 'Permission', resource: Resource, actions: Array<AuthAction> }> } & { ' $fragmentName'?: 'ApiKeyFragment' };

export type ApiKeysQueryVariables = Exact<{ [key: string]: never; }>;


export type ApiKeysQuery = { __typename?: 'Query', apiKeys: Array<(
    { __typename?: 'ApiKey' }
    & { ' $fragmentRefs'?: { 'ApiKeyFragment': ApiKeyFragment } }
  )> };

export type ApiKeyMetaQueryVariables = Exact<{ [key: string]: never; }>;


export type ApiKeyMetaQuery = { __typename?: 'Query', apiKeyPossibleRoles: Array<Role>, apiKeyPossiblePermissions: Array<{ __typename?: 'Permission', resource: Resource, actions: Array<AuthAction> }> };

export type PreviewEffectivePermissionsQueryVariables = Exact<{
  roles?: InputMaybe<Array<Role> | Role>;
  permissions?: InputMaybe<Array<AddPermissionInput> | AddPermissionInput>;
}>;


export type PreviewEffectivePermissionsQuery = { __typename?: 'Query', previewEffectivePermissions: Array<{ __typename?: 'Permission', resource: Resource, actions: Array<AuthAction> }> };

export type GetPermissionsForRolesQueryVariables = Exact<{
  roles: Array<Role> | Role;
}>;


export type GetPermissionsForRolesQuery = { __typename?: 'Query', getPermissionsForRoles: Array<{ __typename?: 'Permission', resource: Resource, actions: Array<AuthAction> }> };

export type UnifiedQueryVariables = Exact<{ [key: string]: never; }>;


export type UnifiedQuery = { __typename?: 'Query', settings: { __typename?: 'Settings', unified: { __typename?: 'UnifiedSettings', id: string, dataSchema: any, uiSchema: any, values: any } } };

export type UpdateConnectSettingsMutationVariables = Exact<{
  input: Scalars['JSON']['input'];
}>;


export type UpdateConnectSettingsMutation = { __typename?: 'Mutation', updateSettings: { __typename?: 'UpdateSettingsResponse', restartRequired: boolean, values: any } };

export type SetThemeMutationVariables = Exact<{
  theme: ThemeName;
}>;


export type SetThemeMutation = { __typename?: 'Mutation', customization: { __typename?: 'CustomizationMutations', setTheme: { __typename?: 'Theme', name: ThemeName, showBannerImage: boolean, showBannerGradient: boolean, headerBackgroundColor?: string | null, showHeaderDescription: boolean, headerPrimaryTextColor?: string | null, headerSecondaryTextColor?: string | null } } };

export type GetDockerContainerSizesQueryVariables = Exact<{ [key: string]: never; }>;


export type GetDockerContainerSizesQuery = { __typename?: 'Query', docker: { __typename?: 'Docker', id: string, containers: Array<{ __typename?: 'DockerContainer', id: string, names: Array<string>, sizeRootFs?: number | null, sizeRw?: number | null, sizeLog?: number | null }> } };

export type GetDockerContainersQueryVariables = Exact<{
  skipCache?: InputMaybe<Scalars['Boolean']['input']>;
}>;


export type GetDockerContainersQuery = { __typename?: 'Query', docker: { __typename?: 'Docker', id: string, portConflicts: { __typename?: 'DockerPortConflicts', containerPorts: Array<{ __typename?: 'DockerContainerPortConflict', privatePort: number, type: ContainerPortType, containers: Array<{ __typename?: 'DockerPortConflictContainer', id: string, name: string }> }>, lanPorts: Array<{ __typename?: 'DockerLanPortConflict', lanIpPort: string, publicPort?: number | null, type: ContainerPortType, containers: Array<{ __typename?: 'DockerPortConflictContainer', id: string, name: string }> }> }, containers: Array<{ __typename?: 'DockerContainer', id: string, names: Array<string>, state: ContainerState, status: string, image: string, created: number, lanIpPorts?: Array<string> | null, autoStart: boolean, autoStartOrder?: number | null, autoStartWait?: number | null, networkSettings?: any | null, mounts?: Array<any> | null, isOrphaned: boolean, projectUrl?: string | null, registryUrl?: string | null, supportUrl?: string | null, iconUrl?: string | null, webUiUrl?: string | null, shell?: string | null, tailscaleEnabled: boolean, ports: Array<{ __typename?: 'ContainerPort', privatePort?: number | null, publicPort?: number | null, type: ContainerPortType }>, hostConfig?: { __typename?: 'ContainerHostConfig', networkMode: string } | null, templatePorts?: Array<{ __typename?: 'ContainerPort', privatePort?: number | null, publicPort?: number | null, type: ContainerPortType }> | null }>, organizer: { __typename?: 'ResolvedOrganizerV1', version: number, views: Array<{ __typename?: 'ResolvedOrganizerView', id: string, name: string, rootId: string, prefs?: any | null, flatEntries: Array<{ __typename?: 'FlatOrganizerEntry', id: string, type: string, name: string, parentId?: string | null, depth: number, position: number, path: Array<string>, hasChildren: boolean, childrenIds: Array<string>, meta?: { __typename?: 'DockerContainer', id: string, names: Array<string>, state: ContainerState, status: string, image: string, lanIpPorts?: Array<string> | null, autoStart: boolean, autoStartWait?: number | null, networkSettings?: any | null, mounts?: Array<any> | null, created: number, isUpdateAvailable?: boolean | null, isRebuildReady?: boolean | null, templatePath?: string | null, isOrphaned: boolean, projectUrl?: string | null, registryUrl?: string | null, supportUrl?: string | null, iconUrl?: string | null, webUiUrl?: string | null, shell?: string | null, tailscaleEnabled: boolean, ports: Array<{ __typename?: 'ContainerPort', privatePort?: number | null, publicPort?: number | null, type: ContainerPortType }>, hostConfig?: { __typename?: 'ContainerHostConfig', networkMode: string } | null, templatePorts?: Array<{ __typename?: 'ContainerPort', privatePort?: number | null, publicPort?: number | null, type: ContainerPortType }> | null } | null }> }> } } };

export type CreateDockerFolderWithItemsMutationVariables = Exact<{
  name: Scalars['String']['input'];
  parentId?: InputMaybe<Scalars['String']['input']>;
  sourceEntryIds?: InputMaybe<Array<Scalars['String']['input']> | Scalars['String']['input']>;
  position?: InputMaybe<Scalars['Float']['input']>;
}>;


export type CreateDockerFolderWithItemsMutation = { __typename?: 'Mutation', createDockerFolderWithItems: { __typename?: 'ResolvedOrganizerV1', version: number, views: Array<{ __typename?: 'ResolvedOrganizerView', id: string, name: string, rootId: string, flatEntries: Array<{ __typename?: 'FlatOrganizerEntry', id: string, type: string, name: string, parentId?: string | null, depth: number, position: number, path: Array<string>, hasChildren: boolean, childrenIds: Array<string>, meta?: { __typename?: 'DockerContainer', id: string, names: Array<string>, state: ContainerState, status: string, image: string, autoStart: boolean, created: number, isUpdateAvailable?: boolean | null, isRebuildReady?: boolean | null, ports: Array<{ __typename?: 'ContainerPort', privatePort?: number | null, publicPort?: number | null, type: ContainerPortType }>, hostConfig?: { __typename?: 'ContainerHostConfig', networkMode: string } | null } | null }> }> } };

export type CreateDockerFolderMutationVariables = Exact<{
  name: Scalars['String']['input'];
  parentId?: InputMaybe<Scalars['String']['input']>;
  childrenIds?: InputMaybe<Array<Scalars['String']['input']> | Scalars['String']['input']>;
}>;


export type CreateDockerFolderMutation = { __typename?: 'Mutation', createDockerFolder: { __typename?: 'ResolvedOrganizerV1', version: number, views: Array<{ __typename?: 'ResolvedOrganizerView', id: string, name: string, rootId: string, flatEntries: Array<{ __typename?: 'FlatOrganizerEntry', id: string, type: string, name: string, parentId?: string | null, depth: number, position: number, path: Array<string>, hasChildren: boolean, childrenIds: Array<string> }> }> } };

export type DeleteDockerEntriesMutationVariables = Exact<{
  entryIds: Array<Scalars['String']['input']> | Scalars['String']['input'];
}>;


export type DeleteDockerEntriesMutation = { __typename?: 'Mutation', deleteDockerEntries: { __typename?: 'ResolvedOrganizerV1', version: number, views: Array<{ __typename?: 'ResolvedOrganizerView', id: string, name: string, rootId: string, flatEntries: Array<{ __typename?: 'FlatOrganizerEntry', id: string, type: string, name: string, parentId?: string | null, depth: number, position: number, path: Array<string>, hasChildren: boolean, childrenIds: Array<string> }> }> } };

export type GetDockerContainerLogsQueryVariables = Exact<{
  id: Scalars['PrefixedID']['input'];
  since?: InputMaybe<Scalars['DateTime']['input']>;
  tail?: InputMaybe<Scalars['Int']['input']>;
}>;


export type GetDockerContainerLogsQuery = { __typename?: 'Query', docker: { __typename?: 'Docker', logs: { __typename?: 'DockerContainerLogs', containerId: string, cursor?: string | null, lines: Array<{ __typename?: 'DockerContainerLogLine', timestamp: string, message: string }> } } };

export type MoveDockerEntriesToFolderMutationVariables = Exact<{
  destinationFolderId: Scalars['String']['input'];
  sourceEntryIds: Array<Scalars['String']['input']> | Scalars['String']['input'];
}>;


export type MoveDockerEntriesToFolderMutation = { __typename?: 'Mutation', moveDockerEntriesToFolder: { __typename?: 'ResolvedOrganizerV1', version: number, views: Array<{ __typename?: 'ResolvedOrganizerView', id: string, name: string, rootId: string, flatEntries: Array<{ __typename?: 'FlatOrganizerEntry', id: string, type: string, name: string, parentId?: string | null, depth: number, position: number, path: Array<string>, hasChildren: boolean, childrenIds: Array<string> }> }> } };

export type MoveDockerItemsToPositionMutationVariables = Exact<{
  sourceEntryIds: Array<Scalars['String']['input']> | Scalars['String']['input'];
  destinationFolderId: Scalars['String']['input'];
  position: Scalars['Float']['input'];
}>;


export type MoveDockerItemsToPositionMutation = { __typename?: 'Mutation', moveDockerItemsToPosition: { __typename?: 'ResolvedOrganizerV1', version: number, views: Array<{ __typename?: 'ResolvedOrganizerView', id: string, name: string, rootId: string, flatEntries: Array<{ __typename?: 'FlatOrganizerEntry', id: string, type: string, name: string, parentId?: string | null, depth: number, position: number, path: Array<string>, hasChildren: boolean, childrenIds: Array<string>, meta?: { __typename?: 'DockerContainer', id: string, names: Array<string>, state: ContainerState, status: string, image: string, autoStart: boolean, created: number, isUpdateAvailable?: boolean | null, isRebuildReady?: boolean | null, ports: Array<{ __typename?: 'ContainerPort', privatePort?: number | null, publicPort?: number | null, type: ContainerPortType }>, hostConfig?: { __typename?: 'ContainerHostConfig', networkMode: string } | null } | null }> }> } };

export type PauseDockerContainerMutationVariables = Exact<{
  id: Scalars['PrefixedID']['input'];
}>;


export type PauseDockerContainerMutation = { __typename?: 'Mutation', docker: { __typename?: 'DockerMutations', pause: { __typename?: 'DockerContainer', id: string, names: Array<string>, state: ContainerState } } };

export type RefreshDockerDigestsMutationVariables = Exact<{ [key: string]: never; }>;


export type RefreshDockerDigestsMutation = { __typename?: 'Mutation', refreshDockerDigests: boolean };

export type RemoveDockerContainerMutationVariables = Exact<{
  id: Scalars['PrefixedID']['input'];
  withImage?: InputMaybe<Scalars['Boolean']['input']>;
}>;


export type RemoveDockerContainerMutation = { __typename?: 'Mutation', docker: { __typename?: 'DockerMutations', removeContainer: boolean } };

export type ResetDockerTemplateMappingsMutationVariables = Exact<{ [key: string]: never; }>;


export type ResetDockerTemplateMappingsMutation = { __typename?: 'Mutation', resetDockerTemplateMappings: boolean };

export type SetDockerFolderChildrenMutationVariables = Exact<{
  folderId?: InputMaybe<Scalars['String']['input']>;
  childrenIds: Array<Scalars['String']['input']> | Scalars['String']['input'];
}>;


export type SetDockerFolderChildrenMutation = { __typename?: 'Mutation', setDockerFolderChildren: { __typename?: 'ResolvedOrganizerV1', version: number, views: Array<{ __typename?: 'ResolvedOrganizerView', id: string, name: string, rootId: string, flatEntries: Array<{ __typename?: 'FlatOrganizerEntry', id: string, type: string, name: string, parentId?: string | null, depth: number, position: number, path: Array<string>, hasChildren: boolean, childrenIds: Array<string> }> }> } };

export type StartDockerContainerMutationVariables = Exact<{
  id: Scalars['PrefixedID']['input'];
}>;


export type StartDockerContainerMutation = { __typename?: 'Mutation', docker: { __typename?: 'DockerMutations', start: { __typename?: 'DockerContainer', id: string, names: Array<string>, state: ContainerState } } };

export type DockerContainerStatsSubscriptionVariables = Exact<{ [key: string]: never; }>;


export type DockerContainerStatsSubscription = { __typename?: 'Subscription', dockerContainerStats: { __typename?: 'DockerContainerStats', id: string, cpuPercent: number, memUsage: string, memPercent: number, netIO: string, blockIO: string } };

export type StopDockerContainerMutationVariables = Exact<{
  id: Scalars['PrefixedID']['input'];
}>;


export type StopDockerContainerMutation = { __typename?: 'Mutation', docker: { __typename?: 'DockerMutations', stop: { __typename?: 'DockerContainer', id: string, names: Array<string>, state: ContainerState } } };

export type GetContainerTailscaleStatusQueryVariables = Exact<{
  id: Scalars['PrefixedID']['input'];
}>;


export type GetContainerTailscaleStatusQuery = { __typename?: 'Query', docker: { __typename?: 'Docker', container?: { __typename?: 'DockerContainer', id: string, tailscaleStatus?: { __typename?: 'TailscaleStatus', online: boolean, version?: string | null, latestVersion?: string | null, updateAvailable: boolean, hostname?: string | null, dnsName?: string | null, relay?: string | null, relayName?: string | null, tailscaleIps?: Array<string> | null, primaryRoutes?: Array<string> | null, isExitNode: boolean, webUiUrl?: string | null, keyExpiry?: string | null, keyExpiryDays?: number | null, keyExpired: boolean, backendState?: string | null, authUrl?: string | null, exitNodeStatus?: { __typename?: 'TailscaleExitNodeStatus', online: boolean, tailscaleIps?: Array<string> | null } | null } | null } | null } };

export type UnpauseDockerContainerMutationVariables = Exact<{
  id: Scalars['PrefixedID']['input'];
}>;


export type UnpauseDockerContainerMutation = { __typename?: 'Mutation', docker: { __typename?: 'DockerMutations', unpause: { __typename?: 'DockerContainer', id: string, names: Array<string>, state: ContainerState } } };

export type UpdateAllDockerContainersMutationVariables = Exact<{ [key: string]: never; }>;


export type UpdateAllDockerContainersMutation = { __typename?: 'Mutation', docker: { __typename?: 'DockerMutations', updateAllContainers: Array<{ __typename?: 'DockerContainer', id: string, names: Array<string>, state: ContainerState, isUpdateAvailable?: boolean | null, isRebuildReady?: boolean | null }> } };

export type UpdateDockerAutostartConfigurationMutationVariables = Exact<{
  entries: Array<DockerAutostartEntryInput> | DockerAutostartEntryInput;
  persistUserPreferences?: InputMaybe<Scalars['Boolean']['input']>;
}>;


export type UpdateDockerAutostartConfigurationMutation = { __typename?: 'Mutation', docker: { __typename?: 'DockerMutations', updateAutostartConfiguration: boolean } };

export type UpdateDockerContainersMutationVariables = Exact<{
  ids: Array<Scalars['PrefixedID']['input']> | Scalars['PrefixedID']['input'];
}>;


export type UpdateDockerContainersMutation = { __typename?: 'Mutation', docker: { __typename?: 'DockerMutations', updateContainers: Array<{ __typename?: 'DockerContainer', id: string, names: Array<string>, state: ContainerState, isUpdateAvailable?: boolean | null, isRebuildReady?: boolean | null }> } };

export type UpdateDockerViewPreferencesMutationVariables = Exact<{
  viewId?: InputMaybe<Scalars['String']['input']>;
  prefs: Scalars['JSON']['input'];
}>;


export type UpdateDockerViewPreferencesMutation = { __typename?: 'Mutation', updateDockerViewPreferences: { __typename?: 'ResolvedOrganizerV1', version: number, views: Array<{ __typename?: 'ResolvedOrganizerView', id: string, name: string, rootId: string, prefs?: any | null, flatEntries: Array<{ __typename?: 'FlatOrganizerEntry', id: string, type: string, name: string, parentId?: string | null, depth: number, position: number, path: Array<string>, hasChildren: boolean, childrenIds: Array<string>, meta?: { __typename?: 'DockerContainer', id: string, names: Array<string>, state: ContainerState, status: string, image: string, autoStart: boolean, created: number, isUpdateAvailable?: boolean | null, isRebuildReady?: boolean | null, ports: Array<{ __typename?: 'ContainerPort', privatePort?: number | null, publicPort?: number | null, type: ContainerPortType }>, hostConfig?: { __typename?: 'ContainerHostConfig', networkMode: string } | null } | null }> }> } };

export type LogFilesQueryVariables = Exact<{ [key: string]: never; }>;


export type LogFilesQuery = { __typename?: 'Query', logFiles: Array<{ __typename?: 'LogFile', name: string, path: string, size: number, modifiedAt: string }> };

export type LogFileContentQueryVariables = Exact<{
  path: Scalars['String']['input'];
  lines?: InputMaybe<Scalars['Int']['input']>;
  startLine?: InputMaybe<Scalars['Int']['input']>;
}>;


export type LogFileContentQuery = { __typename?: 'Query', logFile: { __typename?: 'LogFileContent', path: string, content: string, totalLines: number, startLine?: number | null } };

export type LogFileSubscriptionSubscriptionVariables = Exact<{
  path: Scalars['String']['input'];
}>;


export type LogFileSubscriptionSubscription = { __typename?: 'Subscription', logFile: { __typename?: 'LogFileContent', path: string, content: string, totalLines: number } };

export type NotificationFragmentFragment = { __typename?: 'Notification', id: string, title: string, subject: string, description: string, importance: NotificationImportance, link?: string | null, type: NotificationType, timestamp?: string | null, formattedTimestamp?: string | null } & { ' $fragmentName'?: 'NotificationFragmentFragment' };

export type NotificationCountFragmentFragment = { __typename?: 'NotificationCounts', total: number, info: number, warning: number, alert: number } & { ' $fragmentName'?: 'NotificationCountFragmentFragment' };

export type NotificationsQueryVariables = Exact<{
  filter: NotificationFilter;
}>;


export type NotificationsQuery = { __typename?: 'Query', notifications: { __typename?: 'Notifications', id: string, list: Array<(
      { __typename?: 'Notification' }
      & { ' $fragmentRefs'?: { 'NotificationFragmentFragment': NotificationFragmentFragment } }
    )> } };

export type WarningAndAlertNotificationsQueryVariables = Exact<{ [key: string]: never; }>;


export type WarningAndAlertNotificationsQuery = { __typename?: 'Query', notifications: { __typename?: 'Notifications', id: string, warningsAndAlerts: Array<(
      { __typename?: 'Notification' }
      & { ' $fragmentRefs'?: { 'NotificationFragmentFragment': NotificationFragmentFragment } }
    )> } };

export type ArchiveNotificationMutationVariables = Exact<{
  id: Scalars['PrefixedID']['input'];
}>;


export type ArchiveNotificationMutation = { __typename?: 'Mutation', archiveNotification: (
    { __typename?: 'Notification' }
    & { ' $fragmentRefs'?: { 'NotificationFragmentFragment': NotificationFragmentFragment } }
  ) };

export type ArchiveAllNotificationsMutationVariables = Exact<{ [key: string]: never; }>;


export type ArchiveAllNotificationsMutation = { __typename?: 'Mutation', archiveAll: { __typename?: 'NotificationOverview', unread: { __typename?: 'NotificationCounts', total: number }, archive: { __typename?: 'NotificationCounts', info: number, warning: number, alert: number, total: number } } };

export type DeleteNotificationMutationVariables = Exact<{
  id: Scalars['PrefixedID']['input'];
  type: NotificationType;
}>;


export type DeleteNotificationMutation = { __typename?: 'Mutation', deleteNotification: { __typename?: 'NotificationOverview', archive: { __typename?: 'NotificationCounts', total: number } } };

export type DeleteAllNotificationsMutationVariables = Exact<{ [key: string]: never; }>;


export type DeleteAllNotificationsMutation = { __typename?: 'Mutation', deleteArchivedNotifications: { __typename?: 'NotificationOverview', archive: { __typename?: 'NotificationCounts', total: number }, unread: { __typename?: 'NotificationCounts', total: number } } };

export type OverviewQueryVariables = Exact<{ [key: string]: never; }>;


export type OverviewQuery = { __typename?: 'Query', notifications: { __typename?: 'Notifications', id: string, overview: { __typename?: 'NotificationOverview', unread: { __typename?: 'NotificationCounts', info: number, warning: number, alert: number, total: number }, archive: { __typename?: 'NotificationCounts', total: number } } } };

export type RecomputeOverviewMutationVariables = Exact<{ [key: string]: never; }>;


export type RecomputeOverviewMutation = { __typename?: 'Mutation', recalculateOverview: { __typename?: 'NotificationOverview', archive: (
      { __typename?: 'NotificationCounts' }
      & { ' $fragmentRefs'?: { 'NotificationCountFragmentFragment': NotificationCountFragmentFragment } }
    ), unread: (
      { __typename?: 'NotificationCounts' }
      & { ' $fragmentRefs'?: { 'NotificationCountFragmentFragment': NotificationCountFragmentFragment } }
    ) } };

export type NotifyIfUniqueMutationVariables = Exact<{
  input: NotificationData;
}>;


export type NotifyIfUniqueMutation = { __typename?: 'Mutation', notifyIfUnique?: (
    { __typename?: 'Notification' }
    & { ' $fragmentRefs'?: { 'NotificationFragmentFragment': NotificationFragmentFragment } }
  ) | null };

export type NotificationAddedSubSubscriptionVariables = Exact<{ [key: string]: never; }>;


export type NotificationAddedSubSubscription = { __typename?: 'Subscription', notificationAdded: (
    { __typename?: 'Notification' }
    & { ' $fragmentRefs'?: { 'NotificationFragmentFragment': NotificationFragmentFragment } }
  ) };

export type NotificationOverviewSubSubscriptionVariables = Exact<{ [key: string]: never; }>;


export type NotificationOverviewSubSubscription = { __typename?: 'Subscription', notificationsOverview: { __typename?: 'NotificationOverview', archive: (
      { __typename?: 'NotificationCounts' }
      & { ' $fragmentRefs'?: { 'NotificationCountFragmentFragment': NotificationCountFragmentFragment } }
    ), unread: (
      { __typename?: 'NotificationCounts' }
      & { ' $fragmentRefs'?: { 'NotificationCountFragmentFragment': NotificationCountFragmentFragment } }
    ) } };

export type NotificationsWarningsAndAlertsSubSubscriptionVariables = Exact<{ [key: string]: never; }>;


export type NotificationsWarningsAndAlertsSubSubscription = { __typename?: 'Subscription', notificationsWarningsAndAlerts: Array<(
    { __typename?: 'Notification' }
    & { ' $fragmentRefs'?: { 'NotificationFragmentFragment': NotificationFragmentFragment } }
  )> };

export type CreateRCloneRemoteMutationVariables = Exact<{
  input: CreateRCloneRemoteInput;
}>;


export type CreateRCloneRemoteMutation = { __typename?: 'Mutation', rclone: { __typename?: 'RCloneMutations', createRCloneRemote: { __typename?: 'RCloneRemote', name: string, type: string, parameters: any } } };

export type DeleteRCloneRemoteMutationVariables = Exact<{
  input: DeleteRCloneRemoteInput;
}>;


export type DeleteRCloneRemoteMutation = { __typename?: 'Mutation', rclone: { __typename?: 'RCloneMutations', deleteRCloneRemote: boolean } };

export type GetRCloneConfigFormQueryVariables = Exact<{
  formOptions?: InputMaybe<RCloneConfigFormInput>;
}>;


export type GetRCloneConfigFormQuery = { __typename?: 'Query', rclone: { __typename?: 'RCloneBackupSettings', configForm: { __typename?: 'RCloneBackupConfigForm', id: string, dataSchema: any, uiSchema: any } } };

export type ListRCloneRemotesQueryVariables = Exact<{ [key: string]: never; }>;


export type ListRCloneRemotesQuery = { __typename?: 'Query', rclone: { __typename?: 'RCloneBackupSettings', remotes: Array<{ __typename?: 'RCloneRemote', name: string, type: string, parameters: any, config: any }> } };

export type InfoVersionsQueryVariables = Exact<{ [key: string]: never; }>;


export type InfoVersionsQuery = { __typename?: 'Query', info: { __typename?: 'Info', id: string, os: { __typename?: 'InfoOs', id: string, hostname?: string | null }, versions: { __typename?: 'InfoVersions', id: string, core: { __typename?: 'CoreVersions', unraid?: string | null, api?: string | null } } } };

export type OidcProvidersQueryVariables = Exact<{ [key: string]: never; }>;


export type OidcProvidersQuery = { __typename?: 'Query', settings: { __typename?: 'Settings', sso: { __typename?: 'SsoSettings', oidcProviders: Array<{ __typename?: 'OidcProvider', id: string, name: string, clientId: string, issuer?: string | null, authorizationEndpoint?: string | null, tokenEndpoint?: string | null, jwksUri?: string | null, scopes: Array<string>, authorizationRuleMode?: AuthorizationRuleMode | null, buttonText?: string | null, buttonIcon?: string | null, authorizationRules?: Array<{ __typename?: 'OidcAuthorizationRule', claim: string, operator: AuthorizationOperator, value: Array<string> }> | null }> } } };

export type PublicOidcProvidersQueryVariables = Exact<{ [key: string]: never; }>;


export type PublicOidcProvidersQuery = { __typename?: 'Query', publicOidcProviders: Array<{ __typename?: 'PublicOidcProvider', id: string, name: string, buttonText?: string | null, buttonIcon?: string | null, buttonVariant?: string | null, buttonStyle?: string | null }> };

export type ConnectSignInMutationVariables = Exact<{
  input: ConnectSignInInput;
}>;


export type ConnectSignInMutation = { __typename?: 'Mutation', connectSignIn: boolean };

export type SignOutMutationVariables = Exact<{ [key: string]: never; }>;


export type SignOutMutation = { __typename?: 'Mutation', connectSignOut: boolean };

export type IsSsoEnabledQueryVariables = Exact<{ [key: string]: never; }>;


export type IsSsoEnabledQuery = { __typename?: 'Query', isSSOEnabled: boolean };

export type PartialCloudFragment = { __typename?: 'Cloud', error?: string | null, apiKey: { __typename?: 'ApiKeyResponse', valid: boolean, error?: string | null }, cloud: { __typename?: 'CloudResponse', status: string, error?: string | null }, minigraphql: { __typename?: 'MinigraphqlResponse', status: MinigraphStatus, error?: string | null }, relay?: { __typename?: 'RelayResponse', status: string, error?: string | null } | null } & { ' $fragmentName'?: 'PartialCloudFragment' };

export type CloudStateQueryVariables = Exact<{ [key: string]: never; }>;


export type CloudStateQuery = { __typename?: 'Query', cloud: (
    { __typename?: 'Cloud' }
    & { ' $fragmentRefs'?: { 'PartialCloudFragment': PartialCloudFragment } }
  ) };

export type ServerStateQueryVariables = Exact<{ [key: string]: never; }>;


export type ServerStateQuery = { __typename?: 'Query', config: { __typename?: 'Config', error?: string | null, valid?: boolean | null }, info: { __typename?: 'Info', os: { __typename?: 'InfoOs', hostname?: string | null } }, owner: { __typename?: 'Owner', avatar: string, username: string }, registration?: { __typename?: 'Registration', state?: RegistrationState | null, expiration?: string | null, updateExpiration?: string | null, keyFile?: { __typename?: 'KeyFile', contents?: string | null } | null } | null, vars: { __typename?: 'Vars', regGen?: string | null, regState?: RegistrationState | null, configError?: ConfigErrorState | null, configValid?: boolean | null } };

export type GetThemeQueryVariables = Exact<{ [key: string]: never; }>;


export type GetThemeQuery = { __typename?: 'Query', publicTheme: { __typename?: 'Theme', name: ThemeName, showBannerImage: boolean, showBannerGradient: boolean, headerBackgroundColor?: string | null, showHeaderDescription: boolean, headerPrimaryTextColor?: string | null, headerSecondaryTextColor?: string | null } };

export const ApiKeyFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ApiKey"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"ApiKey"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"key"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"roles"}},{"kind":"Field","name":{"kind":"Name","value":"permissions"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"resource"}},{"kind":"Field","name":{"kind":"Name","value":"actions"}}]}}]}}]} as unknown as DocumentNode<ApiKeyFragment, unknown>;
export const NotificationFragmentFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"NotificationFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Notification"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"subject"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"importance"}},{"kind":"Field","name":{"kind":"Name","value":"link"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"timestamp"}},{"kind":"Field","name":{"kind":"Name","value":"formattedTimestamp"}}]}}]} as unknown as DocumentNode<NotificationFragmentFragment, unknown>;
export const NotificationCountFragmentFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"NotificationCountFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"NotificationCounts"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"total"}},{"kind":"Field","name":{"kind":"Name","value":"info"}},{"kind":"Field","name":{"kind":"Name","value":"warning"}},{"kind":"Field","name":{"kind":"Name","value":"alert"}}]}}]} as unknown as DocumentNode<NotificationCountFragmentFragment, unknown>;
export const PartialCloudFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"PartialCloud"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Cloud"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"error"}},{"kind":"Field","name":{"kind":"Name","value":"apiKey"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"valid"}},{"kind":"Field","name":{"kind":"Name","value":"error"}}]}},{"kind":"Field","name":{"kind":"Name","value":"cloud"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"error"}}]}},{"kind":"Field","name":{"kind":"Name","value":"minigraphql"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"error"}}]}},{"kind":"Field","name":{"kind":"Name","value":"relay"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"error"}}]}}]}}]} as unknown as DocumentNode<PartialCloudFragment, unknown>;
export const PartnerInfoDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"PartnerInfo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"publicPartnerInfo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"hasPartnerLogo"}},{"kind":"Field","name":{"kind":"Name","value":"partnerName"}},{"kind":"Field","name":{"kind":"Name","value":"partnerUrl"}},{"kind":"Field","name":{"kind":"Name","value":"partnerLogoUrl"}}]}}]}}]} as unknown as DocumentNode<PartnerInfoQuery, PartnerInfoQueryVariables>;
export const PublicWelcomeDataDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"PublicWelcomeData"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"publicPartnerInfo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"hasPartnerLogo"}},{"kind":"Field","name":{"kind":"Name","value":"partnerName"}},{"kind":"Field","name":{"kind":"Name","value":"partnerUrl"}},{"kind":"Field","name":{"kind":"Name","value":"partnerLogoUrl"}}]}},{"kind":"Field","name":{"kind":"Name","value":"isInitialSetup"}}]}}]} as unknown as DocumentNode<PublicWelcomeDataQuery, PublicWelcomeDataQueryVariables>;
export const ActivationCodeDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ActivationCode"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"vars"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"regState"}}]}},{"kind":"Field","name":{"kind":"Name","value":"customization"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"activationCode"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"code"}},{"kind":"Field","name":{"kind":"Name","value":"partnerName"}},{"kind":"Field","name":{"kind":"Name","value":"serverName"}},{"kind":"Field","name":{"kind":"Name","value":"sysModel"}},{"kind":"Field","name":{"kind":"Name","value":"comment"}},{"kind":"Field","name":{"kind":"Name","value":"header"}},{"kind":"Field","name":{"kind":"Name","value":"headermetacolor"}},{"kind":"Field","name":{"kind":"Name","value":"background"}},{"kind":"Field","name":{"kind":"Name","value":"showBannerGradient"}},{"kind":"Field","name":{"kind":"Name","value":"theme"}}]}},{"kind":"Field","name":{"kind":"Name","value":"partnerInfo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"hasPartnerLogo"}},{"kind":"Field","name":{"kind":"Name","value":"partnerName"}},{"kind":"Field","name":{"kind":"Name","value":"partnerUrl"}},{"kind":"Field","name":{"kind":"Name","value":"partnerLogoUrl"}}]}}]}}]}}]} as unknown as DocumentNode<ActivationCodeQuery, ActivationCodeQueryVariables>;
export const GetApiKeyCreationFormSchemaDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetApiKeyCreationFormSchema"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"getApiKeyCreationFormSchema"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"dataSchema"}},{"kind":"Field","name":{"kind":"Name","value":"uiSchema"}},{"kind":"Field","name":{"kind":"Name","value":"values"}}]}}]}}]} as unknown as DocumentNode<GetApiKeyCreationFormSchemaQuery, GetApiKeyCreationFormSchemaQueryVariables>;
export const CreateApiKeyDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateApiKey"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateApiKeyInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"apiKey"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"create"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ApiKey"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ApiKey"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"ApiKey"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"key"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"roles"}},{"kind":"Field","name":{"kind":"Name","value":"permissions"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"resource"}},{"kind":"Field","name":{"kind":"Name","value":"actions"}}]}}]}}]} as unknown as DocumentNode<CreateApiKeyMutation, CreateApiKeyMutationVariables>;
export const UpdateApiKeyDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateApiKey"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateApiKeyInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"apiKey"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"update"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ApiKey"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ApiKey"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"ApiKey"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"key"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"roles"}},{"kind":"Field","name":{"kind":"Name","value":"permissions"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"resource"}},{"kind":"Field","name":{"kind":"Name","value":"actions"}}]}}]}}]} as unknown as DocumentNode<UpdateApiKeyMutation, UpdateApiKeyMutationVariables>;
export const DeleteApiKeyDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteApiKey"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"DeleteApiKeyInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"apiKey"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"delete"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}]}]}}]}}]} as unknown as DocumentNode<DeleteApiKeyMutation, DeleteApiKeyMutationVariables>;
export const ApiKeysDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ApiKeys"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"apiKeys"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ApiKey"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ApiKey"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"ApiKey"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"key"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"roles"}},{"kind":"Field","name":{"kind":"Name","value":"permissions"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"resource"}},{"kind":"Field","name":{"kind":"Name","value":"actions"}}]}}]}}]} as unknown as DocumentNode<ApiKeysQuery, ApiKeysQueryVariables>;
export const ApiKeyMetaDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ApiKeyMeta"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"apiKeyPossibleRoles"}},{"kind":"Field","name":{"kind":"Name","value":"apiKeyPossiblePermissions"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"resource"}},{"kind":"Field","name":{"kind":"Name","value":"actions"}}]}}]}}]} as unknown as DocumentNode<ApiKeyMetaQuery, ApiKeyMetaQueryVariables>;
export const PreviewEffectivePermissionsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"PreviewEffectivePermissions"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"roles"}},"type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Role"}}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"permissions"}},"type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"AddPermissionInput"}}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"previewEffectivePermissions"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"roles"},"value":{"kind":"Variable","name":{"kind":"Name","value":"roles"}}},{"kind":"Argument","name":{"kind":"Name","value":"permissions"},"value":{"kind":"Variable","name":{"kind":"Name","value":"permissions"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"resource"}},{"kind":"Field","name":{"kind":"Name","value":"actions"}}]}}]}}]} as unknown as DocumentNode<PreviewEffectivePermissionsQuery, PreviewEffectivePermissionsQueryVariables>;
export const GetPermissionsForRolesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetPermissionsForRoles"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"roles"}},"type":{"kind":"NonNullType","type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Role"}}}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"getPermissionsForRoles"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"roles"},"value":{"kind":"Variable","name":{"kind":"Name","value":"roles"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"resource"}},{"kind":"Field","name":{"kind":"Name","value":"actions"}}]}}]}}]} as unknown as DocumentNode<GetPermissionsForRolesQuery, GetPermissionsForRolesQueryVariables>;
export const UnifiedDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"Unified"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"settings"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"unified"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"dataSchema"}},{"kind":"Field","name":{"kind":"Name","value":"uiSchema"}},{"kind":"Field","name":{"kind":"Name","value":"values"}}]}}]}}]}}]} as unknown as DocumentNode<UnifiedQuery, UnifiedQueryVariables>;
export const UpdateConnectSettingsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateConnectSettings"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"JSON"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateSettings"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"restartRequired"}},{"kind":"Field","name":{"kind":"Name","value":"values"}}]}}]}}]} as unknown as DocumentNode<UpdateConnectSettingsMutation, UpdateConnectSettingsMutationVariables>;
export const SetThemeDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"setTheme"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"theme"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ThemeName"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"customization"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"setTheme"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"theme"},"value":{"kind":"Variable","name":{"kind":"Name","value":"theme"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"showBannerImage"}},{"kind":"Field","name":{"kind":"Name","value":"showBannerGradient"}},{"kind":"Field","name":{"kind":"Name","value":"headerBackgroundColor"}},{"kind":"Field","name":{"kind":"Name","value":"showHeaderDescription"}},{"kind":"Field","name":{"kind":"Name","value":"headerPrimaryTextColor"}},{"kind":"Field","name":{"kind":"Name","value":"headerSecondaryTextColor"}}]}}]}}]}}]} as unknown as DocumentNode<SetThemeMutation, SetThemeMutationVariables>;
export const GetDockerContainerSizesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetDockerContainerSizes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"docker"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"containers"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"skipCache"},"value":{"kind":"BooleanValue","value":true}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"names"}},{"kind":"Field","name":{"kind":"Name","value":"sizeRootFs"}},{"kind":"Field","name":{"kind":"Name","value":"sizeRw"}},{"kind":"Field","name":{"kind":"Name","value":"sizeLog"}}]}}]}}]}}]} as unknown as DocumentNode<GetDockerContainerSizesQuery, GetDockerContainerSizesQueryVariables>;
export const GetDockerContainersDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetDockerContainers"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"skipCache"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Boolean"}},"defaultValue":{"kind":"BooleanValue","value":false}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"docker"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"portConflicts"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"skipCache"},"value":{"kind":"Variable","name":{"kind":"Name","value":"skipCache"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"containerPorts"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"privatePort"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"containers"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"lanPorts"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"lanIpPort"}},{"kind":"Field","name":{"kind":"Name","value":"publicPort"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"containers"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"containers"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"skipCache"},"value":{"kind":"Variable","name":{"kind":"Name","value":"skipCache"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"names"}},{"kind":"Field","name":{"kind":"Name","value":"state"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"image"}},{"kind":"Field","name":{"kind":"Name","value":"created"}},{"kind":"Field","name":{"kind":"Name","value":"lanIpPorts"}},{"kind":"Field","name":{"kind":"Name","value":"autoStart"}},{"kind":"Field","name":{"kind":"Name","value":"autoStartOrder"}},{"kind":"Field","name":{"kind":"Name","value":"autoStartWait"}},{"kind":"Field","name":{"kind":"Name","value":"ports"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"privatePort"}},{"kind":"Field","name":{"kind":"Name","value":"publicPort"}},{"kind":"Field","name":{"kind":"Name","value":"type"}}]}},{"kind":"Field","name":{"kind":"Name","value":"hostConfig"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"networkMode"}}]}},{"kind":"Field","name":{"kind":"Name","value":"networkSettings"}},{"kind":"Field","name":{"kind":"Name","value":"mounts"}},{"kind":"Field","name":{"kind":"Name","value":"isOrphaned"}},{"kind":"Field","name":{"kind":"Name","value":"projectUrl"}},{"kind":"Field","name":{"kind":"Name","value":"registryUrl"}},{"kind":"Field","name":{"kind":"Name","value":"supportUrl"}},{"kind":"Field","name":{"kind":"Name","value":"iconUrl"}},{"kind":"Field","name":{"kind":"Name","value":"webUiUrl"}},{"kind":"Field","name":{"kind":"Name","value":"shell"}},{"kind":"Field","name":{"kind":"Name","value":"templatePorts"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"privatePort"}},{"kind":"Field","name":{"kind":"Name","value":"publicPort"}},{"kind":"Field","name":{"kind":"Name","value":"type"}}]}},{"kind":"Field","name":{"kind":"Name","value":"tailscaleEnabled"}}]}},{"kind":"Field","name":{"kind":"Name","value":"organizer"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"skipCache"},"value":{"kind":"Variable","name":{"kind":"Name","value":"skipCache"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"version"}},{"kind":"Field","name":{"kind":"Name","value":"views"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"rootId"}},{"kind":"Field","name":{"kind":"Name","value":"prefs"}},{"kind":"Field","name":{"kind":"Name","value":"flatEntries"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"parentId"}},{"kind":"Field","name":{"kind":"Name","value":"depth"}},{"kind":"Field","name":{"kind":"Name","value":"position"}},{"kind":"Field","name":{"kind":"Name","value":"path"}},{"kind":"Field","name":{"kind":"Name","value":"hasChildren"}},{"kind":"Field","name":{"kind":"Name","value":"childrenIds"}},{"kind":"Field","name":{"kind":"Name","value":"meta"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"names"}},{"kind":"Field","name":{"kind":"Name","value":"state"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"image"}},{"kind":"Field","name":{"kind":"Name","value":"lanIpPorts"}},{"kind":"Field","name":{"kind":"Name","value":"ports"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"privatePort"}},{"kind":"Field","name":{"kind":"Name","value":"publicPort"}},{"kind":"Field","name":{"kind":"Name","value":"type"}}]}},{"kind":"Field","name":{"kind":"Name","value":"autoStart"}},{"kind":"Field","name":{"kind":"Name","value":"autoStartWait"}},{"kind":"Field","name":{"kind":"Name","value":"hostConfig"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"networkMode"}}]}},{"kind":"Field","name":{"kind":"Name","value":"networkSettings"}},{"kind":"Field","name":{"kind":"Name","value":"mounts"}},{"kind":"Field","name":{"kind":"Name","value":"created"}},{"kind":"Field","name":{"kind":"Name","value":"isUpdateAvailable"}},{"kind":"Field","name":{"kind":"Name","value":"isRebuildReady"}},{"kind":"Field","name":{"kind":"Name","value":"templatePath"}},{"kind":"Field","name":{"kind":"Name","value":"isOrphaned"}},{"kind":"Field","name":{"kind":"Name","value":"projectUrl"}},{"kind":"Field","name":{"kind":"Name","value":"registryUrl"}},{"kind":"Field","name":{"kind":"Name","value":"supportUrl"}},{"kind":"Field","name":{"kind":"Name","value":"iconUrl"}},{"kind":"Field","name":{"kind":"Name","value":"webUiUrl"}},{"kind":"Field","name":{"kind":"Name","value":"shell"}},{"kind":"Field","name":{"kind":"Name","value":"templatePorts"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"privatePort"}},{"kind":"Field","name":{"kind":"Name","value":"publicPort"}},{"kind":"Field","name":{"kind":"Name","value":"type"}}]}},{"kind":"Field","name":{"kind":"Name","value":"tailscaleEnabled"}}]}}]}}]}}]}}]}}]}}]} as unknown as DocumentNode<GetDockerContainersQuery, GetDockerContainersQueryVariables>;
export const CreateDockerFolderWithItemsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateDockerFolderWithItems"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"name"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"parentId"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"sourceEntryIds"}},"type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"position"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Float"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createDockerFolderWithItems"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"name"},"value":{"kind":"Variable","name":{"kind":"Name","value":"name"}}},{"kind":"Argument","name":{"kind":"Name","value":"parentId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"parentId"}}},{"kind":"Argument","name":{"kind":"Name","value":"sourceEntryIds"},"value":{"kind":"Variable","name":{"kind":"Name","value":"sourceEntryIds"}}},{"kind":"Argument","name":{"kind":"Name","value":"position"},"value":{"kind":"Variable","name":{"kind":"Name","value":"position"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"version"}},{"kind":"Field","name":{"kind":"Name","value":"views"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"rootId"}},{"kind":"Field","name":{"kind":"Name","value":"flatEntries"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"parentId"}},{"kind":"Field","name":{"kind":"Name","value":"depth"}},{"kind":"Field","name":{"kind":"Name","value":"position"}},{"kind":"Field","name":{"kind":"Name","value":"path"}},{"kind":"Field","name":{"kind":"Name","value":"hasChildren"}},{"kind":"Field","name":{"kind":"Name","value":"childrenIds"}},{"kind":"Field","name":{"kind":"Name","value":"meta"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"names"}},{"kind":"Field","name":{"kind":"Name","value":"state"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"image"}},{"kind":"Field","name":{"kind":"Name","value":"ports"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"privatePort"}},{"kind":"Field","name":{"kind":"Name","value":"publicPort"}},{"kind":"Field","name":{"kind":"Name","value":"type"}}]}},{"kind":"Field","name":{"kind":"Name","value":"autoStart"}},{"kind":"Field","name":{"kind":"Name","value":"hostConfig"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"networkMode"}}]}},{"kind":"Field","name":{"kind":"Name","value":"created"}},{"kind":"Field","name":{"kind":"Name","value":"isUpdateAvailable"}},{"kind":"Field","name":{"kind":"Name","value":"isRebuildReady"}}]}}]}}]}}]}}]}}]} as unknown as DocumentNode<CreateDockerFolderWithItemsMutation, CreateDockerFolderWithItemsMutationVariables>;
export const CreateDockerFolderDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateDockerFolder"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"name"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"parentId"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"childrenIds"}},"type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createDockerFolder"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"name"},"value":{"kind":"Variable","name":{"kind":"Name","value":"name"}}},{"kind":"Argument","name":{"kind":"Name","value":"parentId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"parentId"}}},{"kind":"Argument","name":{"kind":"Name","value":"childrenIds"},"value":{"kind":"Variable","name":{"kind":"Name","value":"childrenIds"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"version"}},{"kind":"Field","name":{"kind":"Name","value":"views"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"rootId"}},{"kind":"Field","name":{"kind":"Name","value":"flatEntries"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"parentId"}},{"kind":"Field","name":{"kind":"Name","value":"depth"}},{"kind":"Field","name":{"kind":"Name","value":"position"}},{"kind":"Field","name":{"kind":"Name","value":"path"}},{"kind":"Field","name":{"kind":"Name","value":"hasChildren"}},{"kind":"Field","name":{"kind":"Name","value":"childrenIds"}}]}}]}}]}}]}}]} as unknown as DocumentNode<CreateDockerFolderMutation, CreateDockerFolderMutationVariables>;
export const DeleteDockerEntriesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteDockerEntries"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"entryIds"}},"type":{"kind":"NonNullType","type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteDockerEntries"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"entryIds"},"value":{"kind":"Variable","name":{"kind":"Name","value":"entryIds"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"version"}},{"kind":"Field","name":{"kind":"Name","value":"views"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"rootId"}},{"kind":"Field","name":{"kind":"Name","value":"flatEntries"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"parentId"}},{"kind":"Field","name":{"kind":"Name","value":"depth"}},{"kind":"Field","name":{"kind":"Name","value":"position"}},{"kind":"Field","name":{"kind":"Name","value":"path"}},{"kind":"Field","name":{"kind":"Name","value":"hasChildren"}},{"kind":"Field","name":{"kind":"Name","value":"childrenIds"}}]}}]}}]}}]}}]} as unknown as DocumentNode<DeleteDockerEntriesMutation, DeleteDockerEntriesMutationVariables>;
export const GetDockerContainerLogsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetDockerContainerLogs"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"PrefixedID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"since"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"DateTime"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"tail"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"docker"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"logs"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"since"},"value":{"kind":"Variable","name":{"kind":"Name","value":"since"}}},{"kind":"Argument","name":{"kind":"Name","value":"tail"},"value":{"kind":"Variable","name":{"kind":"Name","value":"tail"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"containerId"}},{"kind":"Field","name":{"kind":"Name","value":"cursor"}},{"kind":"Field","name":{"kind":"Name","value":"lines"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"timestamp"}},{"kind":"Field","name":{"kind":"Name","value":"message"}}]}}]}}]}}]}}]} as unknown as DocumentNode<GetDockerContainerLogsQuery, GetDockerContainerLogsQueryVariables>;
export const MoveDockerEntriesToFolderDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"MoveDockerEntriesToFolder"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"destinationFolderId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"sourceEntryIds"}},"type":{"kind":"NonNullType","type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"moveDockerEntriesToFolder"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"destinationFolderId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"destinationFolderId"}}},{"kind":"Argument","name":{"kind":"Name","value":"sourceEntryIds"},"value":{"kind":"Variable","name":{"kind":"Name","value":"sourceEntryIds"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"version"}},{"kind":"Field","name":{"kind":"Name","value":"views"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"rootId"}},{"kind":"Field","name":{"kind":"Name","value":"flatEntries"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"parentId"}},{"kind":"Field","name":{"kind":"Name","value":"depth"}},{"kind":"Field","name":{"kind":"Name","value":"position"}},{"kind":"Field","name":{"kind":"Name","value":"path"}},{"kind":"Field","name":{"kind":"Name","value":"hasChildren"}},{"kind":"Field","name":{"kind":"Name","value":"childrenIds"}}]}}]}}]}}]}}]} as unknown as DocumentNode<MoveDockerEntriesToFolderMutation, MoveDockerEntriesToFolderMutationVariables>;
export const MoveDockerItemsToPositionDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"MoveDockerItemsToPosition"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"sourceEntryIds"}},"type":{"kind":"NonNullType","type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"destinationFolderId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"position"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Float"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"moveDockerItemsToPosition"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"sourceEntryIds"},"value":{"kind":"Variable","name":{"kind":"Name","value":"sourceEntryIds"}}},{"kind":"Argument","name":{"kind":"Name","value":"destinationFolderId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"destinationFolderId"}}},{"kind":"Argument","name":{"kind":"Name","value":"position"},"value":{"kind":"Variable","name":{"kind":"Name","value":"position"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"version"}},{"kind":"Field","name":{"kind":"Name","value":"views"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"rootId"}},{"kind":"Field","name":{"kind":"Name","value":"flatEntries"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"parentId"}},{"kind":"Field","name":{"kind":"Name","value":"depth"}},{"kind":"Field","name":{"kind":"Name","value":"position"}},{"kind":"Field","name":{"kind":"Name","value":"path"}},{"kind":"Field","name":{"kind":"Name","value":"hasChildren"}},{"kind":"Field","name":{"kind":"Name","value":"childrenIds"}},{"kind":"Field","name":{"kind":"Name","value":"meta"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"names"}},{"kind":"Field","name":{"kind":"Name","value":"state"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"image"}},{"kind":"Field","name":{"kind":"Name","value":"ports"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"privatePort"}},{"kind":"Field","name":{"kind":"Name","value":"publicPort"}},{"kind":"Field","name":{"kind":"Name","value":"type"}}]}},{"kind":"Field","name":{"kind":"Name","value":"autoStart"}},{"kind":"Field","name":{"kind":"Name","value":"hostConfig"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"networkMode"}}]}},{"kind":"Field","name":{"kind":"Name","value":"created"}},{"kind":"Field","name":{"kind":"Name","value":"isUpdateAvailable"}},{"kind":"Field","name":{"kind":"Name","value":"isRebuildReady"}}]}}]}}]}}]}}]}}]} as unknown as DocumentNode<MoveDockerItemsToPositionMutation, MoveDockerItemsToPositionMutationVariables>;
export const PauseDockerContainerDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"PauseDockerContainer"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"PrefixedID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"docker"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"pause"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"names"}},{"kind":"Field","name":{"kind":"Name","value":"state"}}]}}]}}]}}]} as unknown as DocumentNode<PauseDockerContainerMutation, PauseDockerContainerMutationVariables>;
export const RefreshDockerDigestsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"RefreshDockerDigests"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"refreshDockerDigests"}}]}}]} as unknown as DocumentNode<RefreshDockerDigestsMutation, RefreshDockerDigestsMutationVariables>;
export const RemoveDockerContainerDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"RemoveDockerContainer"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"PrefixedID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"withImage"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Boolean"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"docker"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"removeContainer"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"withImage"},"value":{"kind":"Variable","name":{"kind":"Name","value":"withImage"}}}]}]}}]}}]} as unknown as DocumentNode<RemoveDockerContainerMutation, RemoveDockerContainerMutationVariables>;
export const ResetDockerTemplateMappingsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ResetDockerTemplateMappings"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"resetDockerTemplateMappings"}}]}}]} as unknown as DocumentNode<ResetDockerTemplateMappingsMutation, ResetDockerTemplateMappingsMutationVariables>;
export const SetDockerFolderChildrenDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"SetDockerFolderChildren"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"folderId"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"childrenIds"}},"type":{"kind":"NonNullType","type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"setDockerFolderChildren"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"folderId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"folderId"}}},{"kind":"Argument","name":{"kind":"Name","value":"childrenIds"},"value":{"kind":"Variable","name":{"kind":"Name","value":"childrenIds"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"version"}},{"kind":"Field","name":{"kind":"Name","value":"views"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"rootId"}},{"kind":"Field","name":{"kind":"Name","value":"flatEntries"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"parentId"}},{"kind":"Field","name":{"kind":"Name","value":"depth"}},{"kind":"Field","name":{"kind":"Name","value":"position"}},{"kind":"Field","name":{"kind":"Name","value":"path"}},{"kind":"Field","name":{"kind":"Name","value":"hasChildren"}},{"kind":"Field","name":{"kind":"Name","value":"childrenIds"}}]}}]}}]}}]}}]} as unknown as DocumentNode<SetDockerFolderChildrenMutation, SetDockerFolderChildrenMutationVariables>;
export const StartDockerContainerDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"StartDockerContainer"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"PrefixedID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"docker"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"start"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"names"}},{"kind":"Field","name":{"kind":"Name","value":"state"}}]}}]}}]}}]} as unknown as DocumentNode<StartDockerContainerMutation, StartDockerContainerMutationVariables>;
export const DockerContainerStatsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"subscription","name":{"kind":"Name","value":"DockerContainerStats"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"dockerContainerStats"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"cpuPercent"}},{"kind":"Field","name":{"kind":"Name","value":"memUsage"}},{"kind":"Field","name":{"kind":"Name","value":"memPercent"}},{"kind":"Field","name":{"kind":"Name","value":"netIO"}},{"kind":"Field","name":{"kind":"Name","value":"blockIO"}}]}}]}}]} as unknown as DocumentNode<DockerContainerStatsSubscription, DockerContainerStatsSubscriptionVariables>;
export const StopDockerContainerDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"StopDockerContainer"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"PrefixedID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"docker"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"stop"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"names"}},{"kind":"Field","name":{"kind":"Name","value":"state"}}]}}]}}]}}]} as unknown as DocumentNode<StopDockerContainerMutation, StopDockerContainerMutationVariables>;
export const GetContainerTailscaleStatusDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetContainerTailscaleStatus"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"PrefixedID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"docker"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"container"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"tailscaleStatus"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"forceRefresh"},"value":{"kind":"BooleanValue","value":true}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"online"}},{"kind":"Field","name":{"kind":"Name","value":"version"}},{"kind":"Field","name":{"kind":"Name","value":"latestVersion"}},{"kind":"Field","name":{"kind":"Name","value":"updateAvailable"}},{"kind":"Field","name":{"kind":"Name","value":"hostname"}},{"kind":"Field","name":{"kind":"Name","value":"dnsName"}},{"kind":"Field","name":{"kind":"Name","value":"relay"}},{"kind":"Field","name":{"kind":"Name","value":"relayName"}},{"kind":"Field","name":{"kind":"Name","value":"tailscaleIps"}},{"kind":"Field","name":{"kind":"Name","value":"primaryRoutes"}},{"kind":"Field","name":{"kind":"Name","value":"isExitNode"}},{"kind":"Field","name":{"kind":"Name","value":"exitNodeStatus"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"online"}},{"kind":"Field","name":{"kind":"Name","value":"tailscaleIps"}}]}},{"kind":"Field","name":{"kind":"Name","value":"webUiUrl"}},{"kind":"Field","name":{"kind":"Name","value":"keyExpiry"}},{"kind":"Field","name":{"kind":"Name","value":"keyExpiryDays"}},{"kind":"Field","name":{"kind":"Name","value":"keyExpired"}},{"kind":"Field","name":{"kind":"Name","value":"backendState"}},{"kind":"Field","name":{"kind":"Name","value":"authUrl"}}]}}]}}]}}]}}]} as unknown as DocumentNode<GetContainerTailscaleStatusQuery, GetContainerTailscaleStatusQueryVariables>;
export const UnpauseDockerContainerDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UnpauseDockerContainer"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"PrefixedID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"docker"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"unpause"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"names"}},{"kind":"Field","name":{"kind":"Name","value":"state"}}]}}]}}]}}]} as unknown as DocumentNode<UnpauseDockerContainerMutation, UnpauseDockerContainerMutationVariables>;
export const UpdateAllDockerContainersDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateAllDockerContainers"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"docker"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateAllContainers"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"names"}},{"kind":"Field","name":{"kind":"Name","value":"state"}},{"kind":"Field","name":{"kind":"Name","value":"isUpdateAvailable"}},{"kind":"Field","name":{"kind":"Name","value":"isRebuildReady"}}]}}]}}]}}]} as unknown as DocumentNode<UpdateAllDockerContainersMutation, UpdateAllDockerContainersMutationVariables>;
export const UpdateDockerAutostartConfigurationDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateDockerAutostartConfiguration"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"entries"}},"type":{"kind":"NonNullType","type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"DockerAutostartEntryInput"}}}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"persistUserPreferences"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Boolean"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"docker"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateAutostartConfiguration"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"entries"},"value":{"kind":"Variable","name":{"kind":"Name","value":"entries"}}},{"kind":"Argument","name":{"kind":"Name","value":"persistUserPreferences"},"value":{"kind":"Variable","name":{"kind":"Name","value":"persistUserPreferences"}}}]}]}}]}}]} as unknown as DocumentNode<UpdateDockerAutostartConfigurationMutation, UpdateDockerAutostartConfigurationMutationVariables>;
export const UpdateDockerContainersDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateDockerContainers"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"ids"}},"type":{"kind":"NonNullType","type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"PrefixedID"}}}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"docker"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateContainers"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"ids"},"value":{"kind":"Variable","name":{"kind":"Name","value":"ids"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"names"}},{"kind":"Field","name":{"kind":"Name","value":"state"}},{"kind":"Field","name":{"kind":"Name","value":"isUpdateAvailable"}},{"kind":"Field","name":{"kind":"Name","value":"isRebuildReady"}}]}}]}}]}}]} as unknown as DocumentNode<UpdateDockerContainersMutation, UpdateDockerContainersMutationVariables>;
export const UpdateDockerViewPreferencesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateDockerViewPreferences"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"viewId"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"prefs"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"JSON"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateDockerViewPreferences"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"viewId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"viewId"}}},{"kind":"Argument","name":{"kind":"Name","value":"prefs"},"value":{"kind":"Variable","name":{"kind":"Name","value":"prefs"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"version"}},{"kind":"Field","name":{"kind":"Name","value":"views"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"rootId"}},{"kind":"Field","name":{"kind":"Name","value":"prefs"}},{"kind":"Field","name":{"kind":"Name","value":"flatEntries"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"parentId"}},{"kind":"Field","name":{"kind":"Name","value":"depth"}},{"kind":"Field","name":{"kind":"Name","value":"position"}},{"kind":"Field","name":{"kind":"Name","value":"path"}},{"kind":"Field","name":{"kind":"Name","value":"hasChildren"}},{"kind":"Field","name":{"kind":"Name","value":"childrenIds"}},{"kind":"Field","name":{"kind":"Name","value":"meta"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"names"}},{"kind":"Field","name":{"kind":"Name","value":"state"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"image"}},{"kind":"Field","name":{"kind":"Name","value":"ports"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"privatePort"}},{"kind":"Field","name":{"kind":"Name","value":"publicPort"}},{"kind":"Field","name":{"kind":"Name","value":"type"}}]}},{"kind":"Field","name":{"kind":"Name","value":"autoStart"}},{"kind":"Field","name":{"kind":"Name","value":"hostConfig"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"networkMode"}}]}},{"kind":"Field","name":{"kind":"Name","value":"created"}},{"kind":"Field","name":{"kind":"Name","value":"isUpdateAvailable"}},{"kind":"Field","name":{"kind":"Name","value":"isRebuildReady"}}]}}]}}]}}]}}]}}]} as unknown as DocumentNode<UpdateDockerViewPreferencesMutation, UpdateDockerViewPreferencesMutationVariables>;
export const LogFilesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"LogFiles"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"logFiles"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"path"}},{"kind":"Field","name":{"kind":"Name","value":"size"}},{"kind":"Field","name":{"kind":"Name","value":"modifiedAt"}}]}}]}}]} as unknown as DocumentNode<LogFilesQuery, LogFilesQueryVariables>;
export const LogFileContentDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"LogFileContent"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"path"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"lines"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"startLine"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"logFile"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"path"},"value":{"kind":"Variable","name":{"kind":"Name","value":"path"}}},{"kind":"Argument","name":{"kind":"Name","value":"lines"},"value":{"kind":"Variable","name":{"kind":"Name","value":"lines"}}},{"kind":"Argument","name":{"kind":"Name","value":"startLine"},"value":{"kind":"Variable","name":{"kind":"Name","value":"startLine"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"path"}},{"kind":"Field","name":{"kind":"Name","value":"content"}},{"kind":"Field","name":{"kind":"Name","value":"totalLines"}},{"kind":"Field","name":{"kind":"Name","value":"startLine"}}]}}]}}]} as unknown as DocumentNode<LogFileContentQuery, LogFileContentQueryVariables>;
export const LogFileSubscriptionDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"subscription","name":{"kind":"Name","value":"LogFileSubscription"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"path"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"logFile"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"path"},"value":{"kind":"Variable","name":{"kind":"Name","value":"path"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"path"}},{"kind":"Field","name":{"kind":"Name","value":"content"}},{"kind":"Field","name":{"kind":"Name","value":"totalLines"}}]}}]}}]} as unknown as DocumentNode<LogFileSubscriptionSubscription, LogFileSubscriptionSubscriptionVariables>;
export const NotificationsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"Notifications"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"filter"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"NotificationFilter"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"notifications"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"list"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"filter"},"value":{"kind":"Variable","name":{"kind":"Name","value":"filter"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"NotificationFragment"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"NotificationFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Notification"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"subject"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"importance"}},{"kind":"Field","name":{"kind":"Name","value":"link"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"timestamp"}},{"kind":"Field","name":{"kind":"Name","value":"formattedTimestamp"}}]}}]} as unknown as DocumentNode<NotificationsQuery, NotificationsQueryVariables>;
export const WarningAndAlertNotificationsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"WarningAndAlertNotifications"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"notifications"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"warningsAndAlerts"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"NotificationFragment"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"NotificationFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Notification"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"subject"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"importance"}},{"kind":"Field","name":{"kind":"Name","value":"link"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"timestamp"}},{"kind":"Field","name":{"kind":"Name","value":"formattedTimestamp"}}]}}]} as unknown as DocumentNode<WarningAndAlertNotificationsQuery, WarningAndAlertNotificationsQueryVariables>;
export const ArchiveNotificationDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ArchiveNotification"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"PrefixedID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"archiveNotification"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"NotificationFragment"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"NotificationFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Notification"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"subject"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"importance"}},{"kind":"Field","name":{"kind":"Name","value":"link"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"timestamp"}},{"kind":"Field","name":{"kind":"Name","value":"formattedTimestamp"}}]}}]} as unknown as DocumentNode<ArchiveNotificationMutation, ArchiveNotificationMutationVariables>;
export const ArchiveAllNotificationsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ArchiveAllNotifications"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"archiveAll"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"unread"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"total"}}]}},{"kind":"Field","name":{"kind":"Name","value":"archive"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"info"}},{"kind":"Field","name":{"kind":"Name","value":"warning"}},{"kind":"Field","name":{"kind":"Name","value":"alert"}},{"kind":"Field","name":{"kind":"Name","value":"total"}}]}}]}}]}}]} as unknown as DocumentNode<ArchiveAllNotificationsMutation, ArchiveAllNotificationsMutationVariables>;
export const DeleteNotificationDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteNotification"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"PrefixedID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"type"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"NotificationType"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteNotification"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"type"},"value":{"kind":"Variable","name":{"kind":"Name","value":"type"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"archive"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"total"}}]}}]}}]}}]} as unknown as DocumentNode<DeleteNotificationMutation, DeleteNotificationMutationVariables>;
export const DeleteAllNotificationsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteAllNotifications"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteArchivedNotifications"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"archive"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"total"}}]}},{"kind":"Field","name":{"kind":"Name","value":"unread"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"total"}}]}}]}}]}}]} as unknown as DocumentNode<DeleteAllNotificationsMutation, DeleteAllNotificationsMutationVariables>;
export const OverviewDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"Overview"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"notifications"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"overview"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"unread"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"info"}},{"kind":"Field","name":{"kind":"Name","value":"warning"}},{"kind":"Field","name":{"kind":"Name","value":"alert"}},{"kind":"Field","name":{"kind":"Name","value":"total"}}]}},{"kind":"Field","name":{"kind":"Name","value":"archive"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"total"}}]}}]}}]}}]}}]} as unknown as DocumentNode<OverviewQuery, OverviewQueryVariables>;
export const RecomputeOverviewDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"RecomputeOverview"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"recalculateOverview"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"archive"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"NotificationCountFragment"}}]}},{"kind":"Field","name":{"kind":"Name","value":"unread"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"NotificationCountFragment"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"NotificationCountFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"NotificationCounts"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"total"}},{"kind":"Field","name":{"kind":"Name","value":"info"}},{"kind":"Field","name":{"kind":"Name","value":"warning"}},{"kind":"Field","name":{"kind":"Name","value":"alert"}}]}}]} as unknown as DocumentNode<RecomputeOverviewMutation, RecomputeOverviewMutationVariables>;
export const NotifyIfUniqueDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"NotifyIfUnique"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"NotificationData"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"notifyIfUnique"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"NotificationFragment"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"NotificationFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Notification"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"subject"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"importance"}},{"kind":"Field","name":{"kind":"Name","value":"link"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"timestamp"}},{"kind":"Field","name":{"kind":"Name","value":"formattedTimestamp"}}]}}]} as unknown as DocumentNode<NotifyIfUniqueMutation, NotifyIfUniqueMutationVariables>;
export const NotificationAddedSubDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"subscription","name":{"kind":"Name","value":"NotificationAddedSub"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"notificationAdded"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"NotificationFragment"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"NotificationFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Notification"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"subject"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"importance"}},{"kind":"Field","name":{"kind":"Name","value":"link"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"timestamp"}},{"kind":"Field","name":{"kind":"Name","value":"formattedTimestamp"}}]}}]} as unknown as DocumentNode<NotificationAddedSubSubscription, NotificationAddedSubSubscriptionVariables>;
export const NotificationOverviewSubDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"subscription","name":{"kind":"Name","value":"NotificationOverviewSub"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"notificationsOverview"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"archive"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"NotificationCountFragment"}}]}},{"kind":"Field","name":{"kind":"Name","value":"unread"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"NotificationCountFragment"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"NotificationCountFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"NotificationCounts"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"total"}},{"kind":"Field","name":{"kind":"Name","value":"info"}},{"kind":"Field","name":{"kind":"Name","value":"warning"}},{"kind":"Field","name":{"kind":"Name","value":"alert"}}]}}]} as unknown as DocumentNode<NotificationOverviewSubSubscription, NotificationOverviewSubSubscriptionVariables>;
export const NotificationsWarningsAndAlertsSubDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"subscription","name":{"kind":"Name","value":"NotificationsWarningsAndAlertsSub"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"notificationsWarningsAndAlerts"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"NotificationFragment"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"NotificationFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Notification"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"subject"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"importance"}},{"kind":"Field","name":{"kind":"Name","value":"link"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"timestamp"}},{"kind":"Field","name":{"kind":"Name","value":"formattedTimestamp"}}]}}]} as unknown as DocumentNode<NotificationsWarningsAndAlertsSubSubscription, NotificationsWarningsAndAlertsSubSubscriptionVariables>;
export const CreateRCloneRemoteDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateRCloneRemote"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateRCloneRemoteInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"rclone"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createRCloneRemote"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"parameters"}}]}}]}}]}}]} as unknown as DocumentNode<CreateRCloneRemoteMutation, CreateRCloneRemoteMutationVariables>;
export const DeleteRCloneRemoteDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteRCloneRemote"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"DeleteRCloneRemoteInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"rclone"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteRCloneRemote"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}]}]}}]}}]} as unknown as DocumentNode<DeleteRCloneRemoteMutation, DeleteRCloneRemoteMutationVariables>;
export const GetRCloneConfigFormDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetRCloneConfigForm"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"formOptions"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"RCloneConfigFormInput"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"rclone"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"configForm"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"formOptions"},"value":{"kind":"Variable","name":{"kind":"Name","value":"formOptions"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"dataSchema"}},{"kind":"Field","name":{"kind":"Name","value":"uiSchema"}}]}}]}}]}}]} as unknown as DocumentNode<GetRCloneConfigFormQuery, GetRCloneConfigFormQueryVariables>;
export const ListRCloneRemotesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ListRCloneRemotes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"rclone"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"remotes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"parameters"}},{"kind":"Field","name":{"kind":"Name","value":"config"}}]}}]}}]}}]} as unknown as DocumentNode<ListRCloneRemotesQuery, ListRCloneRemotesQueryVariables>;
export const InfoVersionsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"InfoVersions"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"info"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"os"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"hostname"}}]}},{"kind":"Field","name":{"kind":"Name","value":"versions"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"core"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"unraid"}},{"kind":"Field","name":{"kind":"Name","value":"api"}}]}}]}}]}}]}}]} as unknown as DocumentNode<InfoVersionsQuery, InfoVersionsQueryVariables>;
export const OidcProvidersDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"OidcProviders"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"settings"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"sso"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"oidcProviders"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"clientId"}},{"kind":"Field","name":{"kind":"Name","value":"issuer"}},{"kind":"Field","name":{"kind":"Name","value":"authorizationEndpoint"}},{"kind":"Field","name":{"kind":"Name","value":"tokenEndpoint"}},{"kind":"Field","name":{"kind":"Name","value":"jwksUri"}},{"kind":"Field","name":{"kind":"Name","value":"scopes"}},{"kind":"Field","name":{"kind":"Name","value":"authorizationRules"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"claim"}},{"kind":"Field","name":{"kind":"Name","value":"operator"}},{"kind":"Field","name":{"kind":"Name","value":"value"}}]}},{"kind":"Field","name":{"kind":"Name","value":"authorizationRuleMode"}},{"kind":"Field","name":{"kind":"Name","value":"buttonText"}},{"kind":"Field","name":{"kind":"Name","value":"buttonIcon"}}]}}]}}]}}]}}]} as unknown as DocumentNode<OidcProvidersQuery, OidcProvidersQueryVariables>;
export const PublicOidcProvidersDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"PublicOidcProviders"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"publicOidcProviders"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"buttonText"}},{"kind":"Field","name":{"kind":"Name","value":"buttonIcon"}},{"kind":"Field","name":{"kind":"Name","value":"buttonVariant"}},{"kind":"Field","name":{"kind":"Name","value":"buttonStyle"}}]}}]}}]} as unknown as DocumentNode<PublicOidcProvidersQuery, PublicOidcProvidersQueryVariables>;
export const ConnectSignInDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ConnectSignIn"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ConnectSignInInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"connectSignIn"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}]}]}}]} as unknown as DocumentNode<ConnectSignInMutation, ConnectSignInMutationVariables>;
export const SignOutDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"SignOut"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"connectSignOut"}}]}}]} as unknown as DocumentNode<SignOutMutation, SignOutMutationVariables>;
export const IsSsoEnabledDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"IsSSOEnabled"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"isSSOEnabled"}}]}}]} as unknown as DocumentNode<IsSsoEnabledQuery, IsSsoEnabledQueryVariables>;
export const CloudStateDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"cloudState"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"cloud"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"PartialCloud"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"PartialCloud"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Cloud"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"error"}},{"kind":"Field","name":{"kind":"Name","value":"apiKey"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"valid"}},{"kind":"Field","name":{"kind":"Name","value":"error"}}]}},{"kind":"Field","name":{"kind":"Name","value":"cloud"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"error"}}]}},{"kind":"Field","name":{"kind":"Name","value":"minigraphql"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"error"}}]}},{"kind":"Field","name":{"kind":"Name","value":"relay"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"error"}}]}}]}}]} as unknown as DocumentNode<CloudStateQuery, CloudStateQueryVariables>;
export const ServerStateDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"serverState"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"config"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"error"}},{"kind":"Field","name":{"kind":"Name","value":"valid"}}]}},{"kind":"Field","name":{"kind":"Name","value":"info"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"os"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"hostname"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"owner"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"avatar"}},{"kind":"Field","name":{"kind":"Name","value":"username"}}]}},{"kind":"Field","name":{"kind":"Name","value":"registration"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"state"}},{"kind":"Field","name":{"kind":"Name","value":"expiration"}},{"kind":"Field","name":{"kind":"Name","value":"keyFile"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"contents"}}]}},{"kind":"Field","name":{"kind":"Name","value":"updateExpiration"}}]}},{"kind":"Field","name":{"kind":"Name","value":"vars"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"regGen"}},{"kind":"Field","name":{"kind":"Name","value":"regState"}},{"kind":"Field","name":{"kind":"Name","value":"configError"}},{"kind":"Field","name":{"kind":"Name","value":"configValid"}}]}}]}}]} as unknown as DocumentNode<ServerStateQuery, ServerStateQueryVariables>;
export const GetThemeDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"getTheme"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"publicTheme"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"showBannerImage"}},{"kind":"Field","name":{"kind":"Name","value":"showBannerGradient"}},{"kind":"Field","name":{"kind":"Name","value":"headerBackgroundColor"}},{"kind":"Field","name":{"kind":"Name","value":"showHeaderDescription"}},{"kind":"Field","name":{"kind":"Name","value":"headerPrimaryTextColor"}},{"kind":"Field","name":{"kind":"Name","value":"headerSecondaryTextColor"}}]}}]}}]} as unknown as DocumentNode<GetThemeQuery, GetThemeQueryVariables>;