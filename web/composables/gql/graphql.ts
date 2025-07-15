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
  /** A date-time string at UTC, such as 2007-12-03T10:15:30Z, compliant with the `date-time` format outlined in section 5.6 of the RFC 3339 profile of the ISO 8601 standard for representation of dates and times using the Gregorian calendar.This scalar is serialized to a string in ISO 8601 format and parsed from a string in ISO 8601 format. */
  DateTimeISO: { input: any; output: any; }
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

export type Backup = Node & {
  __typename?: 'Backup';
  configs: Array<BackupJobConfig>;
  id: Scalars['PrefixedID']['output'];
  jobs: Array<JobStatus>;
  /** Get the status for the backup service */
  status: BackupStatus;
};

export type BackupJobConfig = Node & {
  __typename?: 'BackupJobConfig';
  /** When this config was created */
  createdAt: Scalars['DateTimeISO']['output'];
  /** Get the current running job for this backup config */
  currentJob?: Maybe<JobStatus>;
  /** Current running job ID for this config */
  currentJobId?: Maybe<Scalars['String']['output']>;
  /** Destination configuration for this backup job */
  destinationConfig: DestinationConfigUnion;
  /** Type of the backup destination */
  destinationType: DestinationType;
  /** Whether this backup job is enabled */
  enabled: Scalars['Boolean']['output'];
  id: Scalars['PrefixedID']['output'];
  /** Last time this job ran */
  lastRunAt?: Maybe<Scalars['DateTimeISO']['output']>;
  /** Status of last run */
  lastRunStatus?: Maybe<Scalars['String']['output']>;
  /** Human-readable name for this backup job */
  name: Scalars['String']['output'];
  /** Cron schedule expression (e.g., "0 2 * * *" for daily at 2AM) */
  schedule: Scalars['String']['output'];
  /** Source configuration for this backup job */
  sourceConfig: SourceConfigUnion;
  /** Type of the backup source */
  sourceType: SourceType;
  /** When this config was last updated */
  updatedAt: Scalars['DateTimeISO']['output'];
};

export type BackupJobConfigForm = {
  __typename?: 'BackupJobConfigForm';
  dataSchema: Scalars['JSON']['output'];
  id: Scalars['PrefixedID']['output'];
  uiSchema: Scalars['JSON']['output'];
};

export type BackupJobConfigFormInput = {
  showAdvanced?: Scalars['Boolean']['input'];
};

/** Status of a backup job */
export enum BackupJobStatus {
  CANCELLED = 'CANCELLED',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  QUEUED = 'QUEUED',
  RUNNING = 'RUNNING'
}

/** Backup related mutations */
export type BackupMutations = {
  __typename?: 'BackupMutations';
  /** Create a new backup job configuration */
  createBackupJobConfig: BackupJobConfig;
  /** Delete a backup job configuration */
  deleteBackupJobConfig: Scalars['Boolean']['output'];
  /** Forget all finished backup jobs to clean up the job list */
  forgetFinishedBackupJobs: BackupStatus;
  /** Initiates a backup using a configured remote. */
  initiateBackup: BackupStatus;
  /** Stop all running backup jobs */
  stopAllBackupJobs: BackupStatus;
  /** Stop a specific backup job */
  stopBackupJob: BackupStatus;
  /** Toggle a backup job configuration enabled/disabled */
  toggleJobConfig?: Maybe<BackupJobConfig>;
  /** Manually trigger a backup job using existing configuration */
  triggerJob: BackupStatus;
  /** Update a backup job configuration */
  updateBackupJobConfig?: Maybe<BackupJobConfig>;
};


/** Backup related mutations */
export type BackupMutationsCreateBackupJobConfigArgs = {
  input: CreateBackupJobConfigInput;
};


/** Backup related mutations */
export type BackupMutationsDeleteBackupJobConfigArgs = {
  id: Scalars['PrefixedID']['input'];
};


/** Backup related mutations */
export type BackupMutationsInitiateBackupArgs = {
  input: InitiateBackupInput;
};


/** Backup related mutations */
export type BackupMutationsStopBackupJobArgs = {
  id: Scalars['PrefixedID']['input'];
};


/** Backup related mutations */
export type BackupMutationsToggleJobConfigArgs = {
  id: Scalars['PrefixedID']['input'];
};


/** Backup related mutations */
export type BackupMutationsTriggerJobArgs = {
  id: Scalars['PrefixedID']['input'];
};


/** Backup related mutations */
export type BackupMutationsUpdateBackupJobConfigArgs = {
  id: Scalars['PrefixedID']['input'];
  input: UpdateBackupJobConfigInput;
};

export type BackupStatus = {
  __typename?: 'BackupStatus';
  /** Job ID if available, can be used to check job status. */
  jobId?: Maybe<Scalars['String']['output']>;
  /** Status message indicating the outcome of the backup initiation. */
  status: Scalars['String']['output'];
};

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

export type CreateBackupJobConfigInput = {
  /** Destination configuration for this backup job */
  destinationConfig?: InputMaybe<DestinationConfigInput>;
  enabled?: Scalars['Boolean']['input'];
  name: Scalars['String']['input'];
  schedule?: InputMaybe<Scalars['String']['input']>;
  /** Source configuration for this backup job */
  sourceConfig?: InputMaybe<SourceConfigInput>;
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

export type DestinationConfigInput = {
  rcloneConfig?: InputMaybe<RcloneDestinationConfigInput>;
  type: DestinationType;
};

export type DestinationConfigUnion = RcloneDestinationConfig;

export enum DestinationType {
  RCLONE = 'RCLONE'
}

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

export type FlashPreprocessConfig = {
  __typename?: 'FlashPreprocessConfig';
  additionalPaths?: Maybe<Array<Scalars['String']['output']>>;
  flashPath: Scalars['String']['output'];
  includeGitHistory: Scalars['Boolean']['output'];
  label: Scalars['String']['output'];
};

export type FlashPreprocessConfigInput = {
  /** Additional paths to include in backup */
  additionalPaths?: InputMaybe<Array<Scalars['String']['input']>>;
  /** Flash drive mount path */
  flashPath?: Scalars['String']['input'];
  /** Whether to include git history */
  includeGitHistory?: Scalars['Boolean']['input'];
  /** Human-readable label for this source configuration */
  label?: InputMaybe<Scalars['String']['input']>;
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

export type InitiateBackupInput = {
  /** Destination path on the remote. */
  destinationPath: Scalars['String']['input'];
  /** Additional options for the backup operation, such as --dry-run or --transfers. */
  options?: InputMaybe<Scalars['JSON']['input']>;
  /** The name of the remote configuration to use for the backup. */
  remoteName: Scalars['String']['input'];
  /** Source path to backup. */
  sourcePath: Scalars['String']['input'];
};

export type JobStatus = Node & {
  __typename?: 'JobStatus';
  /** Bytes transferred */
  bytesTransferred?: Maybe<Scalars['Int']['output']>;
  /** Elapsed time in seconds */
  elapsedTime?: Maybe<Scalars['Int']['output']>;
  endTime?: Maybe<Scalars['DateTime']['output']>;
  error?: Maybe<Scalars['String']['output']>;
  /** Estimated time to completion in seconds */
  eta?: Maybe<Scalars['Int']['output']>;
  /** External job ID from the job execution system */
  externalJobId: Scalars['String']['output'];
  /** Human-readable bytes transferred */
  formattedBytesTransferred?: Maybe<Scalars['String']['output']>;
  /** Human-readable elapsed time */
  formattedElapsedTime?: Maybe<Scalars['String']['output']>;
  /** Human-readable ETA */
  formattedEta?: Maybe<Scalars['String']['output']>;
  /** Human-readable transfer speed */
  formattedSpeed?: Maybe<Scalars['String']['output']>;
  id: Scalars['PrefixedID']['output'];
  message?: Maybe<Scalars['String']['output']>;
  name: Scalars['String']['output'];
  /** Progress percentage (0-100) */
  progress: Scalars['Int']['output'];
  /** Transfer speed in bytes per second */
  speed?: Maybe<Scalars['Int']['output']>;
  startTime: Scalars['DateTime']['output'];
  status: BackupJobStatus;
  /** Total bytes to transfer */
  totalBytes?: Maybe<Scalars['Int']['output']>;
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
  backup: BackupMutations;
  connectSignIn: Scalars['Boolean']['output'];
  connectSignOut: Scalars['Boolean']['output'];
  /** Creates a new notification record */
  createNotification: Notification;
  /** Deletes all archived notifications on server. */
  deleteArchivedNotifications: NotificationOverview;
  deleteNotification: NotificationOverview;
  docker: DockerMutations;
  enableDynamicRemoteAccess: Scalars['Boolean']['output'];
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
  allBackupJobStatuses: Array<JobStatus>;
  apiKey?: Maybe<ApiKey>;
  /** All possible permissions for API keys */
  apiKeyPossiblePermissions: Array<Permission>;
  /** All possible roles for API keys */
  apiKeyPossibleRoles: Array<Role>;
  apiKeys: Array<ApiKey>;
  array: UnraidArray;
  /** Get backup service information */
  backup: Backup;
  /** Get status of a specific backup job */
  backupJob?: Maybe<JobStatus>;
  /** Get a specific backup job configuration */
  backupJobConfig?: Maybe<BackupJobConfig>;
  /** Get the JSON schema for backup job configuration form */
  backupJobConfigForm: BackupJobConfigForm;
  backupJobStatus?: Maybe<JobStatus>;
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
  vars: Vars;
  /** Get information about all VMs on the system */
  vms: Vms;
};


export type QueryApiKeyArgs = {
  id: Scalars['PrefixedID']['input'];
};


export type QueryBackupJobArgs = {
  id: Scalars['PrefixedID']['input'];
};


export type QueryBackupJobConfigArgs = {
  id: Scalars['PrefixedID']['input'];
};


export type QueryBackupJobConfigFormArgs = {
  input?: InputMaybe<BackupJobConfigFormInput>;
};


export type QueryBackupJobStatusArgs = {
  jobId: Scalars['PrefixedID']['input'];
};


export type QueryDiskArgs = {
  id: Scalars['PrefixedID']['input'];
};


export type QueryLogFileArgs = {
  lines?: InputMaybe<Scalars['Int']['input']>;
  path: Scalars['String']['input'];
  startLine?: InputMaybe<Scalars['Int']['input']>;
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

export type RCloneJobStats = {
  __typename?: 'RCloneJobStats';
  /** Bytes transferred */
  bytes?: Maybe<Scalars['Float']['output']>;
  /** Calculated percentage (fallback when percentage is null) */
  calculatedPercentage?: Maybe<Scalars['Float']['output']>;
  /** Currently checking files */
  checking?: Maybe<Scalars['JSON']['output']>;
  /** Number of checks completed */
  checks?: Maybe<Scalars['Float']['output']>;
  /** Number of deletes completed */
  deletes?: Maybe<Scalars['Float']['output']>;
  /** Elapsed time in seconds */
  elapsedTime?: Maybe<Scalars['Float']['output']>;
  /** Number of errors encountered */
  errors?: Maybe<Scalars['Float']['output']>;
  /** Estimated time to completion in seconds */
  eta?: Maybe<Scalars['Float']['output']>;
  /** Whether a fatal error occurred */
  fatalError?: Maybe<Scalars['Boolean']['output']>;
  /** Human-readable bytes transferred */
  formattedBytes?: Maybe<Scalars['String']['output']>;
  /** Human-readable elapsed time */
  formattedElapsedTime?: Maybe<Scalars['String']['output']>;
  /** Human-readable ETA */
  formattedEta?: Maybe<Scalars['String']['output']>;
  /** Human-readable transfer speed */
  formattedSpeed?: Maybe<Scalars['String']['output']>;
  /** Whether the job is actively running */
  isActivelyRunning?: Maybe<Scalars['Boolean']['output']>;
  /** Whether the job is completed */
  isCompleted?: Maybe<Scalars['Boolean']['output']>;
  /** Last error message */
  lastError?: Maybe<Scalars['String']['output']>;
  /** Progress percentage (0-100) */
  percentage?: Maybe<Scalars['Float']['output']>;
  /** Number of renames completed */
  renames?: Maybe<Scalars['Float']['output']>;
  /** Whether there is a retry error */
  retryError?: Maybe<Scalars['Boolean']['output']>;
  /** Number of server-side copies */
  serverSideCopies?: Maybe<Scalars['Float']['output']>;
  /** Bytes in server-side copies */
  serverSideCopyBytes?: Maybe<Scalars['Float']['output']>;
  /** Bytes in server-side moves */
  serverSideMoveBytes?: Maybe<Scalars['Float']['output']>;
  /** Number of server-side moves */
  serverSideMoves?: Maybe<Scalars['Float']['output']>;
  /** Transfer speed in bytes/sec */
  speed?: Maybe<Scalars['Float']['output']>;
  /** Total bytes to transfer */
  totalBytes?: Maybe<Scalars['Float']['output']>;
  /** Total checks to perform */
  totalChecks?: Maybe<Scalars['Float']['output']>;
  /** Total transfers to perform */
  totalTransfers?: Maybe<Scalars['Float']['output']>;
  /** Time spent transferring in seconds */
  transferTime?: Maybe<Scalars['Float']['output']>;
  /** Currently transferring files */
  transferring?: Maybe<Scalars['JSON']['output']>;
  /** Number of transfers completed */
  transfers?: Maybe<Scalars['Float']['output']>;
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

export type RawBackupConfig = {
  __typename?: 'RawBackupConfig';
  excludePatterns?: Maybe<Array<Scalars['String']['output']>>;
  includePatterns?: Maybe<Array<Scalars['String']['output']>>;
  label: Scalars['String']['output'];
  sourcePath: Scalars['String']['output'];
};

export type RawBackupConfigInput = {
  /** File patterns to exclude from backup */
  excludePatterns?: InputMaybe<Array<Scalars['String']['input']>>;
  /** File patterns to include in backup */
  includePatterns?: InputMaybe<Array<Scalars['String']['input']>>;
  /** Human-readable label for this source configuration */
  label?: InputMaybe<Scalars['String']['input']>;
  /** Source path to backup */
  sourcePath: Scalars['String']['input'];
};

export type RcloneDestinationConfig = {
  __typename?: 'RcloneDestinationConfig';
  /** Destination path on the remote */
  destinationPath: Scalars['String']['output'];
  /** RClone options (e.g., --transfers, --checkers) */
  rcloneOptions?: Maybe<Scalars['JSON']['output']>;
  /** Remote name from rclone config */
  remoteName: Scalars['String']['output'];
  type: Scalars['String']['output'];
};

export type RcloneDestinationConfigInput = {
  destinationPath: Scalars['String']['input'];
  rcloneOptions?: InputMaybe<Scalars['JSON']['input']>;
  remoteName: Scalars['String']['input'];
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

/** Available resources for permissions */
export enum Resource {
  ACTIVATION_CODE = 'ACTIVATION_CODE',
  API_KEY = 'API_KEY',
  ARRAY = 'ARRAY',
  BACKUP = 'BACKUP',
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

export type ScriptPreprocessConfig = {
  __typename?: 'ScriptPreprocessConfig';
  environment?: Maybe<Scalars['JSON']['output']>;
  label: Scalars['String']['output'];
  outputPath: Scalars['String']['output'];
  scriptArgs?: Maybe<Array<Scalars['String']['output']>>;
  scriptPath: Scalars['String']['output'];
  workingDirectory?: Maybe<Scalars['String']['output']>;
};

export type ScriptPreprocessConfigInput = {
  /** Environment variables for script execution */
  environment?: InputMaybe<Scalars['JSON']['input']>;
  /** Human-readable label for this source configuration */
  label?: InputMaybe<Scalars['String']['input']>;
  /** Output file path where script should write data */
  outputPath: Scalars['String']['input'];
  /** Arguments to pass to the script */
  scriptArgs?: InputMaybe<Array<Scalars['String']['input']>>;
  /** Path to the script file */
  scriptPath: Scalars['String']['input'];
  /** Working directory for script execution */
  workingDirectory?: InputMaybe<Scalars['String']['input']>;
};

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

export type SourceConfigInput = {
  /** Whether to cleanup on failure */
  cleanupOnFailure?: Scalars['Boolean']['input'];
  flashConfig?: InputMaybe<FlashPreprocessConfigInput>;
  rawConfig?: InputMaybe<RawBackupConfigInput>;
  scriptConfig?: InputMaybe<ScriptPreprocessConfigInput>;
  /** Timeout for backup operation in seconds */
  timeout?: Scalars['Float']['input'];
  type: SourceType;
  zfsConfig?: InputMaybe<ZfsPreprocessConfigInput>;
};

export type SourceConfigUnion = FlashPreprocessConfig | RawBackupConfig | ScriptPreprocessConfig | ZfsPreprocessConfig;

/** Type of backup to perform (ZFS snapshot, Flash backup, Custom script, or Raw file backup) */
export enum SourceType {
  FLASH = 'FLASH',
  RAW = 'RAW',
  SCRIPT = 'SCRIPT',
  ZFS = 'ZFS'
}

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
  registrationSubscription: Registration;
  serversSubscription: Server;
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

export type UpdateBackupJobConfigInput = {
  currentJobId?: InputMaybe<Scalars['String']['input']>;
  /** Destination configuration for this backup job */
  destinationConfig?: InputMaybe<DestinationConfigInput>;
  enabled?: InputMaybe<Scalars['Boolean']['input']>;
  lastRunAt?: InputMaybe<Scalars['String']['input']>;
  lastRunStatus?: InputMaybe<Scalars['String']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  schedule?: InputMaybe<Scalars['String']['input']>;
  /** Source configuration for this backup job */
  sourceConfig?: InputMaybe<SourceConfigInput>;
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

export type ZfsPreprocessConfig = {
  __typename?: 'ZfsPreprocessConfig';
  cleanupSnapshots: Scalars['Boolean']['output'];
  datasetName: Scalars['String']['output'];
  label: Scalars['String']['output'];
  poolName: Scalars['String']['output'];
  retainSnapshots?: Maybe<Scalars['Float']['output']>;
  snapshotPrefix?: Maybe<Scalars['String']['output']>;
};

export type ZfsPreprocessConfigInput = {
  /** Whether to cleanup snapshots after backup */
  cleanupSnapshots?: Scalars['Boolean']['input'];
  /** Dataset name within the pool */
  datasetName: Scalars['String']['input'];
  /** Human-readable label for this source configuration */
  label?: InputMaybe<Scalars['String']['input']>;
  /** ZFS pool name */
  poolName: Scalars['String']['input'];
  /** Number of snapshots to retain */
  retainSnapshots?: InputMaybe<Scalars['Float']['input']>;
  /** Snapshot name prefix */
  snapshotPrefix?: InputMaybe<Scalars['String']['input']>;
};

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

export type ActivationCodeQueryVariables = Exact<{ [key: string]: never; }>;


export type ActivationCodeQuery = { __typename?: 'Query', vars: { __typename?: 'Vars', regState?: RegistrationState | null }, customization?: { __typename?: 'Customization', activationCode?: { __typename?: 'ActivationCode', code?: string | null, partnerName?: string | null, serverName?: string | null, sysModel?: string | null, comment?: string | null, header?: string | null, headermetacolor?: string | null, background?: string | null, showBannerGradient?: boolean | null, theme?: string | null } | null, partnerInfo?: { __typename?: 'PublicPartnerInfo', hasPartnerLogo: boolean, partnerName?: string | null, partnerUrl?: string | null, partnerLogoUrl?: string | null } | null } | null };

export type ApiKeyFragment = { __typename?: 'ApiKey', id: string, name: string, description?: string | null, createdAt: string, roles: Array<Role>, permissions: Array<{ __typename?: 'Permission', resource: Resource, actions: Array<string> }> } & { ' $fragmentName'?: 'ApiKeyFragment' };

export type ApiKeyWithKeyFragment = { __typename?: 'ApiKeyWithSecret', id: string, key: string, name: string, description?: string | null, createdAt: string, roles: Array<Role>, permissions: Array<{ __typename?: 'Permission', resource: Resource, actions: Array<string> }> } & { ' $fragmentName'?: 'ApiKeyWithKeyFragment' };

export type ApiKeysQueryVariables = Exact<{ [key: string]: never; }>;


export type ApiKeysQuery = { __typename?: 'Query', apiKeys: Array<(
    { __typename?: 'ApiKey' }
    & { ' $fragmentRefs'?: { 'ApiKeyFragment': ApiKeyFragment } }
  )> };

export type CreateApiKeyMutationVariables = Exact<{
  input: CreateApiKeyInput;
}>;


export type CreateApiKeyMutation = { __typename?: 'Mutation', apiKey: { __typename?: 'ApiKeyMutations', create: (
      { __typename?: 'ApiKeyWithSecret' }
      & { ' $fragmentRefs'?: { 'ApiKeyWithKeyFragment': ApiKeyWithKeyFragment } }
    ) } };

export type UpdateApiKeyMutationVariables = Exact<{
  input: UpdateApiKeyInput;
}>;


export type UpdateApiKeyMutation = { __typename?: 'Mutation', apiKey: { __typename?: 'ApiKeyMutations', update: (
      { __typename?: 'ApiKeyWithSecret' }
      & { ' $fragmentRefs'?: { 'ApiKeyWithKeyFragment': ApiKeyWithKeyFragment } }
    ) } };

export type DeleteApiKeyMutationVariables = Exact<{
  input: DeleteApiKeyInput;
}>;


export type DeleteApiKeyMutation = { __typename?: 'Mutation', apiKey: { __typename?: 'ApiKeyMutations', delete: boolean } };

export type ApiKeyMetaQueryVariables = Exact<{ [key: string]: never; }>;


export type ApiKeyMetaQuery = { __typename?: 'Query', apiKeyPossibleRoles: Array<Role>, apiKeyPossiblePermissions: Array<{ __typename?: 'Permission', resource: Resource, actions: Array<string> }> };

export type JobStatusFragment = { __typename?: 'JobStatus', id: string, externalJobId: string, name: string, status: BackupJobStatus, progress: number, message?: string | null, error?: string | null, startTime: string, endTime?: string | null, bytesTransferred?: number | null, totalBytes?: number | null, speed?: number | null, elapsedTime?: number | null, eta?: number | null, formattedBytesTransferred?: string | null, formattedSpeed?: string | null, formattedElapsedTime?: string | null, formattedEta?: string | null } & { ' $fragmentName'?: 'JobStatusFragment' };

type SourceConfigFlashPreprocessConfigFragment = { __typename?: 'FlashPreprocessConfig', label: string, flashPath: string, includeGitHistory: boolean, additionalPaths?: Array<string> | null } & { ' $fragmentName'?: 'SourceConfigFlashPreprocessConfigFragment' };

type SourceConfigRawBackupConfigFragment = { __typename?: 'RawBackupConfig', label: string, sourcePath: string, excludePatterns?: Array<string> | null, includePatterns?: Array<string> | null } & { ' $fragmentName'?: 'SourceConfigRawBackupConfigFragment' };

type SourceConfigScriptPreprocessConfigFragment = { __typename?: 'ScriptPreprocessConfig', label: string, scriptPath: string, scriptArgs?: Array<string> | null, workingDirectory?: string | null, environment?: any | null, outputPath: string } & { ' $fragmentName'?: 'SourceConfigScriptPreprocessConfigFragment' };

type SourceConfigZfsPreprocessConfigFragment = { __typename?: 'ZfsPreprocessConfig', label: string, poolName: string, datasetName: string, snapshotPrefix?: string | null, cleanupSnapshots: boolean, retainSnapshots?: number | null } & { ' $fragmentName'?: 'SourceConfigZfsPreprocessConfigFragment' };

export type SourceConfigFragment = SourceConfigFlashPreprocessConfigFragment | SourceConfigRawBackupConfigFragment | SourceConfigScriptPreprocessConfigFragment | SourceConfigZfsPreprocessConfigFragment;

export type DestinationConfigFragment = { __typename?: 'RcloneDestinationConfig', type: string, remoteName: string, destinationPath: string, rcloneOptions?: any | null } & { ' $fragmentName'?: 'DestinationConfigFragment' };

export type BackupJobConfigFragment = { __typename?: 'BackupJobConfig', id: string, name: string, sourceType: SourceType, destinationType: DestinationType, schedule: string, enabled: boolean, createdAt: any, updatedAt: any, lastRunAt?: any | null, lastRunStatus?: string | null, sourceConfig: (
    { __typename?: 'FlashPreprocessConfig' }
    & { ' $fragmentRefs'?: { 'SourceConfigFlashPreprocessConfigFragment': SourceConfigFlashPreprocessConfigFragment } }
  ) | (
    { __typename?: 'RawBackupConfig' }
    & { ' $fragmentRefs'?: { 'SourceConfigRawBackupConfigFragment': SourceConfigRawBackupConfigFragment } }
  ) | (
    { __typename?: 'ScriptPreprocessConfig' }
    & { ' $fragmentRefs'?: { 'SourceConfigScriptPreprocessConfigFragment': SourceConfigScriptPreprocessConfigFragment } }
  ) | (
    { __typename?: 'ZfsPreprocessConfig' }
    & { ' $fragmentRefs'?: { 'SourceConfigZfsPreprocessConfigFragment': SourceConfigZfsPreprocessConfigFragment } }
  ), destinationConfig: (
    { __typename?: 'RcloneDestinationConfig' }
    & { ' $fragmentRefs'?: { 'DestinationConfigFragment': DestinationConfigFragment } }
  ) } & { ' $fragmentName'?: 'BackupJobConfigFragment' };

export type BackupJobConfigWithCurrentJobFragment = (
  { __typename?: 'BackupJobConfig', currentJob?: (
    { __typename?: 'JobStatus' }
    & { ' $fragmentRefs'?: { 'JobStatusFragment': JobStatusFragment } }
  ) | null }
  & { ' $fragmentRefs'?: { 'BackupJobConfigFragment': BackupJobConfigFragment } }
) & { ' $fragmentName'?: 'BackupJobConfigWithCurrentJobFragment' };

export type BackupJobsQueryVariables = Exact<{ [key: string]: never; }>;


export type BackupJobsQuery = { __typename?: 'Query', backup: { __typename?: 'Backup', id: string, jobs: Array<(
      { __typename?: 'JobStatus' }
      & { ' $fragmentRefs'?: { 'JobStatusFragment': JobStatusFragment } }
    )> } };

export type BackupJobQueryVariables = Exact<{
  id: Scalars['PrefixedID']['input'];
}>;


export type BackupJobQuery = { __typename?: 'Query', backupJob?: (
    { __typename?: 'JobStatus' }
    & { ' $fragmentRefs'?: { 'JobStatusFragment': JobStatusFragment } }
  ) | null };

export type BackupJobConfigQueryVariables = Exact<{
  id: Scalars['PrefixedID']['input'];
}>;


export type BackupJobConfigQuery = { __typename?: 'Query', backupJobConfig?: (
    { __typename?: 'BackupJobConfig' }
    & { ' $fragmentRefs'?: { 'BackupJobConfigWithCurrentJobFragment': BackupJobConfigWithCurrentJobFragment } }
  ) | null };

export type BackupJobConfigsQueryVariables = Exact<{ [key: string]: never; }>;


export type BackupJobConfigsQuery = { __typename?: 'Query', backup: { __typename?: 'Backup', id: string, configs: Array<(
      { __typename?: 'BackupJobConfig' }
      & { ' $fragmentRefs'?: { 'BackupJobConfigWithCurrentJobFragment': BackupJobConfigWithCurrentJobFragment } }
    )> } };

export type BackupJobConfigsListQueryVariables = Exact<{ [key: string]: never; }>;


export type BackupJobConfigsListQuery = { __typename?: 'Query', backup: { __typename?: 'Backup', id: string, configs: Array<{ __typename?: 'BackupJobConfig', id: string, name: string }> } };

export type BackupJobConfigFormQueryVariables = Exact<{
  input?: InputMaybe<BackupJobConfigFormInput>;
}>;


export type BackupJobConfigFormQuery = { __typename?: 'Query', backupJobConfigForm: { __typename?: 'BackupJobConfigForm', id: string, dataSchema: any, uiSchema: any } };

export type CreateBackupJobConfigMutationVariables = Exact<{
  input: CreateBackupJobConfigInput;
}>;


export type CreateBackupJobConfigMutation = { __typename?: 'Mutation', backup: { __typename?: 'BackupMutations', createBackupJobConfig: (
      { __typename?: 'BackupJobConfig' }
      & { ' $fragmentRefs'?: { 'BackupJobConfigFragment': BackupJobConfigFragment } }
    ) } };

export type UpdateBackupJobConfigMutationVariables = Exact<{
  id: Scalars['PrefixedID']['input'];
  input: UpdateBackupJobConfigInput;
}>;


export type UpdateBackupJobConfigMutation = { __typename?: 'Mutation', backup: { __typename?: 'BackupMutations', updateBackupJobConfig?: (
      { __typename?: 'BackupJobConfig' }
      & { ' $fragmentRefs'?: { 'BackupJobConfigFragment': BackupJobConfigFragment } }
    ) | null } };

export type DeleteBackupJobConfigMutationVariables = Exact<{
  id: Scalars['PrefixedID']['input'];
}>;


export type DeleteBackupJobConfigMutation = { __typename?: 'Mutation', backup: { __typename?: 'BackupMutations', deleteBackupJobConfig: boolean } };

export type ToggleBackupJobConfigMutationVariables = Exact<{
  id: Scalars['PrefixedID']['input'];
}>;


export type ToggleBackupJobConfigMutation = { __typename?: 'Mutation', backup: { __typename?: 'BackupMutations', toggleJobConfig?: (
      { __typename?: 'BackupJobConfig' }
      & { ' $fragmentRefs'?: { 'BackupJobConfigFragment': BackupJobConfigFragment } }
    ) | null } };

export type TriggerBackupJobMutationVariables = Exact<{
  id: Scalars['PrefixedID']['input'];
}>;


export type TriggerBackupJobMutation = { __typename?: 'Mutation', backup: { __typename?: 'BackupMutations', triggerJob: { __typename?: 'BackupStatus', jobId?: string | null } } };

export type StopBackupJobMutationVariables = Exact<{
  id: Scalars['PrefixedID']['input'];
}>;


export type StopBackupJobMutation = { __typename?: 'Mutation', backup: { __typename?: 'BackupMutations', stopBackupJob: { __typename?: 'BackupStatus', status: string, jobId?: string | null } } };

export type InitiateBackupMutationVariables = Exact<{
  input: InitiateBackupInput;
}>;


export type InitiateBackupMutation = { __typename?: 'Mutation', backup: { __typename?: 'BackupMutations', initiateBackup: { __typename?: 'BackupStatus', status: string, jobId?: string | null } } };

export type UnifiedQueryVariables = Exact<{ [key: string]: never; }>;


export type UnifiedQuery = { __typename?: 'Query', settings: { __typename?: 'Settings', unified: { __typename?: 'UnifiedSettings', id: string, dataSchema: any, uiSchema: any, values: any } } };

export type UpdateConnectSettingsMutationVariables = Exact<{
  input: Scalars['JSON']['input'];
}>;


export type UpdateConnectSettingsMutation = { __typename?: 'Mutation', updateSettings: { __typename?: 'UpdateSettingsResponse', restartRequired: boolean, values: any } };

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


export type ServerStateQuery = { __typename?: 'Query', config: { __typename?: 'Config', error?: string | null, valid?: boolean | null }, info: { __typename?: 'Info', os: { __typename?: 'Os', hostname?: string | null } }, owner: { __typename?: 'Owner', avatar: string, username: string }, registration?: { __typename?: 'Registration', state?: RegistrationState | null, expiration?: string | null, updateExpiration?: string | null, keyFile?: { __typename?: 'KeyFile', contents?: string | null } | null } | null, vars: { __typename?: 'Vars', regGen?: string | null, regState?: RegistrationState | null, configError?: ConfigErrorState | null, configValid?: boolean | null } };

export type GetThemeQueryVariables = Exact<{ [key: string]: never; }>;


export type GetThemeQuery = { __typename?: 'Query', publicTheme: { __typename?: 'Theme', name: ThemeName, showBannerImage: boolean, showBannerGradient: boolean, headerBackgroundColor?: string | null, showHeaderDescription: boolean, headerPrimaryTextColor?: string | null, headerSecondaryTextColor?: string | null } };

export const ApiKeyFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ApiKey"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"ApiKey"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"roles"}},{"kind":"Field","name":{"kind":"Name","value":"permissions"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"resource"}},{"kind":"Field","name":{"kind":"Name","value":"actions"}}]}}]}}]} as unknown as DocumentNode<ApiKeyFragment, unknown>;
export const ApiKeyWithKeyFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ApiKeyWithKey"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"ApiKeyWithSecret"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"key"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"roles"}},{"kind":"Field","name":{"kind":"Name","value":"permissions"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"resource"}},{"kind":"Field","name":{"kind":"Name","value":"actions"}}]}}]}}]} as unknown as DocumentNode<ApiKeyWithKeyFragment, unknown>;
export const SourceConfigFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"SourceConfig"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"SourceConfigUnion"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"ZfsPreprocessConfig"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"poolName"}},{"kind":"Field","name":{"kind":"Name","value":"datasetName"}},{"kind":"Field","name":{"kind":"Name","value":"snapshotPrefix"}},{"kind":"Field","name":{"kind":"Name","value":"cleanupSnapshots"}},{"kind":"Field","name":{"kind":"Name","value":"retainSnapshots"}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"FlashPreprocessConfig"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"flashPath"}},{"kind":"Field","name":{"kind":"Name","value":"includeGitHistory"}},{"kind":"Field","name":{"kind":"Name","value":"additionalPaths"}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"ScriptPreprocessConfig"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"scriptPath"}},{"kind":"Field","name":{"kind":"Name","value":"scriptArgs"}},{"kind":"Field","name":{"kind":"Name","value":"workingDirectory"}},{"kind":"Field","name":{"kind":"Name","value":"environment"}},{"kind":"Field","name":{"kind":"Name","value":"outputPath"}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"RawBackupConfig"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"sourcePath"}},{"kind":"Field","name":{"kind":"Name","value":"excludePatterns"}},{"kind":"Field","name":{"kind":"Name","value":"includePatterns"}}]}}]}}]} as unknown as DocumentNode<SourceConfigFragment, unknown>;
export const DestinationConfigFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"DestinationConfig"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"DestinationConfigUnion"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"RcloneDestinationConfig"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"remoteName"}},{"kind":"Field","name":{"kind":"Name","value":"destinationPath"}},{"kind":"Field","name":{"kind":"Name","value":"rcloneOptions"}}]}}]}}]} as unknown as DocumentNode<DestinationConfigFragment, unknown>;
export const BackupJobConfigFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"BackupJobConfig"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"BackupJobConfig"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"sourceType"}},{"kind":"Field","name":{"kind":"Name","value":"destinationType"}},{"kind":"Field","name":{"kind":"Name","value":"schedule"}},{"kind":"Field","name":{"kind":"Name","value":"enabled"}},{"kind":"Field","name":{"kind":"Name","value":"sourceConfig"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"SourceConfig"}}]}},{"kind":"Field","name":{"kind":"Name","value":"destinationConfig"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"DestinationConfig"}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"lastRunAt"}},{"kind":"Field","name":{"kind":"Name","value":"lastRunStatus"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"SourceConfig"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"SourceConfigUnion"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"ZfsPreprocessConfig"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"poolName"}},{"kind":"Field","name":{"kind":"Name","value":"datasetName"}},{"kind":"Field","name":{"kind":"Name","value":"snapshotPrefix"}},{"kind":"Field","name":{"kind":"Name","value":"cleanupSnapshots"}},{"kind":"Field","name":{"kind":"Name","value":"retainSnapshots"}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"FlashPreprocessConfig"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"flashPath"}},{"kind":"Field","name":{"kind":"Name","value":"includeGitHistory"}},{"kind":"Field","name":{"kind":"Name","value":"additionalPaths"}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"ScriptPreprocessConfig"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"scriptPath"}},{"kind":"Field","name":{"kind":"Name","value":"scriptArgs"}},{"kind":"Field","name":{"kind":"Name","value":"workingDirectory"}},{"kind":"Field","name":{"kind":"Name","value":"environment"}},{"kind":"Field","name":{"kind":"Name","value":"outputPath"}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"RawBackupConfig"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"sourcePath"}},{"kind":"Field","name":{"kind":"Name","value":"excludePatterns"}},{"kind":"Field","name":{"kind":"Name","value":"includePatterns"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"DestinationConfig"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"DestinationConfigUnion"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"RcloneDestinationConfig"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"remoteName"}},{"kind":"Field","name":{"kind":"Name","value":"destinationPath"}},{"kind":"Field","name":{"kind":"Name","value":"rcloneOptions"}}]}}]}}]} as unknown as DocumentNode<BackupJobConfigFragment, unknown>;
export const JobStatusFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"JobStatus"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"JobStatus"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"externalJobId"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"progress"}},{"kind":"Field","name":{"kind":"Name","value":"message"}},{"kind":"Field","name":{"kind":"Name","value":"error"}},{"kind":"Field","name":{"kind":"Name","value":"startTime"}},{"kind":"Field","name":{"kind":"Name","value":"endTime"}},{"kind":"Field","name":{"kind":"Name","value":"bytesTransferred"}},{"kind":"Field","name":{"kind":"Name","value":"totalBytes"}},{"kind":"Field","name":{"kind":"Name","value":"speed"}},{"kind":"Field","name":{"kind":"Name","value":"elapsedTime"}},{"kind":"Field","name":{"kind":"Name","value":"eta"}},{"kind":"Field","name":{"kind":"Name","value":"formattedBytesTransferred"}},{"kind":"Field","name":{"kind":"Name","value":"formattedSpeed"}},{"kind":"Field","name":{"kind":"Name","value":"formattedElapsedTime"}},{"kind":"Field","name":{"kind":"Name","value":"formattedEta"}}]}}]} as unknown as DocumentNode<JobStatusFragment, unknown>;
export const BackupJobConfigWithCurrentJobFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"BackupJobConfigWithCurrentJob"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"BackupJobConfig"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"BackupJobConfig"}},{"kind":"Field","name":{"kind":"Name","value":"currentJob"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"JobStatus"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"SourceConfig"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"SourceConfigUnion"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"ZfsPreprocessConfig"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"poolName"}},{"kind":"Field","name":{"kind":"Name","value":"datasetName"}},{"kind":"Field","name":{"kind":"Name","value":"snapshotPrefix"}},{"kind":"Field","name":{"kind":"Name","value":"cleanupSnapshots"}},{"kind":"Field","name":{"kind":"Name","value":"retainSnapshots"}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"FlashPreprocessConfig"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"flashPath"}},{"kind":"Field","name":{"kind":"Name","value":"includeGitHistory"}},{"kind":"Field","name":{"kind":"Name","value":"additionalPaths"}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"ScriptPreprocessConfig"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"scriptPath"}},{"kind":"Field","name":{"kind":"Name","value":"scriptArgs"}},{"kind":"Field","name":{"kind":"Name","value":"workingDirectory"}},{"kind":"Field","name":{"kind":"Name","value":"environment"}},{"kind":"Field","name":{"kind":"Name","value":"outputPath"}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"RawBackupConfig"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"sourcePath"}},{"kind":"Field","name":{"kind":"Name","value":"excludePatterns"}},{"kind":"Field","name":{"kind":"Name","value":"includePatterns"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"DestinationConfig"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"DestinationConfigUnion"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"RcloneDestinationConfig"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"remoteName"}},{"kind":"Field","name":{"kind":"Name","value":"destinationPath"}},{"kind":"Field","name":{"kind":"Name","value":"rcloneOptions"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"BackupJobConfig"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"BackupJobConfig"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"sourceType"}},{"kind":"Field","name":{"kind":"Name","value":"destinationType"}},{"kind":"Field","name":{"kind":"Name","value":"schedule"}},{"kind":"Field","name":{"kind":"Name","value":"enabled"}},{"kind":"Field","name":{"kind":"Name","value":"sourceConfig"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"SourceConfig"}}]}},{"kind":"Field","name":{"kind":"Name","value":"destinationConfig"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"DestinationConfig"}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"lastRunAt"}},{"kind":"Field","name":{"kind":"Name","value":"lastRunStatus"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"JobStatus"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"JobStatus"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"externalJobId"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"progress"}},{"kind":"Field","name":{"kind":"Name","value":"message"}},{"kind":"Field","name":{"kind":"Name","value":"error"}},{"kind":"Field","name":{"kind":"Name","value":"startTime"}},{"kind":"Field","name":{"kind":"Name","value":"endTime"}},{"kind":"Field","name":{"kind":"Name","value":"bytesTransferred"}},{"kind":"Field","name":{"kind":"Name","value":"totalBytes"}},{"kind":"Field","name":{"kind":"Name","value":"speed"}},{"kind":"Field","name":{"kind":"Name","value":"elapsedTime"}},{"kind":"Field","name":{"kind":"Name","value":"eta"}},{"kind":"Field","name":{"kind":"Name","value":"formattedBytesTransferred"}},{"kind":"Field","name":{"kind":"Name","value":"formattedSpeed"}},{"kind":"Field","name":{"kind":"Name","value":"formattedElapsedTime"}},{"kind":"Field","name":{"kind":"Name","value":"formattedEta"}}]}}]} as unknown as DocumentNode<BackupJobConfigWithCurrentJobFragment, unknown>;
export const NotificationFragmentFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"NotificationFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Notification"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"subject"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"importance"}},{"kind":"Field","name":{"kind":"Name","value":"link"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"timestamp"}},{"kind":"Field","name":{"kind":"Name","value":"formattedTimestamp"}}]}}]} as unknown as DocumentNode<NotificationFragmentFragment, unknown>;
export const NotificationCountFragmentFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"NotificationCountFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"NotificationCounts"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"total"}},{"kind":"Field","name":{"kind":"Name","value":"info"}},{"kind":"Field","name":{"kind":"Name","value":"warning"}},{"kind":"Field","name":{"kind":"Name","value":"alert"}}]}}]} as unknown as DocumentNode<NotificationCountFragmentFragment, unknown>;
export const PartialCloudFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"PartialCloud"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Cloud"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"error"}},{"kind":"Field","name":{"kind":"Name","value":"apiKey"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"valid"}},{"kind":"Field","name":{"kind":"Name","value":"error"}}]}},{"kind":"Field","name":{"kind":"Name","value":"cloud"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"error"}}]}},{"kind":"Field","name":{"kind":"Name","value":"minigraphql"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"error"}}]}},{"kind":"Field","name":{"kind":"Name","value":"relay"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"error"}}]}}]}}]} as unknown as DocumentNode<PartialCloudFragment, unknown>;
export const PartnerInfoDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"PartnerInfo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"publicPartnerInfo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"hasPartnerLogo"}},{"kind":"Field","name":{"kind":"Name","value":"partnerName"}},{"kind":"Field","name":{"kind":"Name","value":"partnerUrl"}},{"kind":"Field","name":{"kind":"Name","value":"partnerLogoUrl"}}]}}]}}]} as unknown as DocumentNode<PartnerInfoQuery, PartnerInfoQueryVariables>;
export const ActivationCodeDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ActivationCode"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"vars"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"regState"}}]}},{"kind":"Field","name":{"kind":"Name","value":"customization"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"activationCode"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"code"}},{"kind":"Field","name":{"kind":"Name","value":"partnerName"}},{"kind":"Field","name":{"kind":"Name","value":"serverName"}},{"kind":"Field","name":{"kind":"Name","value":"sysModel"}},{"kind":"Field","name":{"kind":"Name","value":"comment"}},{"kind":"Field","name":{"kind":"Name","value":"header"}},{"kind":"Field","name":{"kind":"Name","value":"headermetacolor"}},{"kind":"Field","name":{"kind":"Name","value":"background"}},{"kind":"Field","name":{"kind":"Name","value":"showBannerGradient"}},{"kind":"Field","name":{"kind":"Name","value":"theme"}}]}},{"kind":"Field","name":{"kind":"Name","value":"partnerInfo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"hasPartnerLogo"}},{"kind":"Field","name":{"kind":"Name","value":"partnerName"}},{"kind":"Field","name":{"kind":"Name","value":"partnerUrl"}},{"kind":"Field","name":{"kind":"Name","value":"partnerLogoUrl"}}]}}]}}]}}]} as unknown as DocumentNode<ActivationCodeQuery, ActivationCodeQueryVariables>;
export const ApiKeysDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ApiKeys"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"apiKeys"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ApiKey"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ApiKey"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"ApiKey"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"roles"}},{"kind":"Field","name":{"kind":"Name","value":"permissions"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"resource"}},{"kind":"Field","name":{"kind":"Name","value":"actions"}}]}}]}}]} as unknown as DocumentNode<ApiKeysQuery, ApiKeysQueryVariables>;
export const CreateApiKeyDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateApiKey"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateApiKeyInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"apiKey"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"create"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ApiKeyWithKey"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ApiKeyWithKey"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"ApiKeyWithSecret"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"key"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"roles"}},{"kind":"Field","name":{"kind":"Name","value":"permissions"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"resource"}},{"kind":"Field","name":{"kind":"Name","value":"actions"}}]}}]}}]} as unknown as DocumentNode<CreateApiKeyMutation, CreateApiKeyMutationVariables>;
export const UpdateApiKeyDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateApiKey"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateApiKeyInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"apiKey"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"update"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ApiKeyWithKey"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ApiKeyWithKey"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"ApiKeyWithSecret"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"key"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"roles"}},{"kind":"Field","name":{"kind":"Name","value":"permissions"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"resource"}},{"kind":"Field","name":{"kind":"Name","value":"actions"}}]}}]}}]} as unknown as DocumentNode<UpdateApiKeyMutation, UpdateApiKeyMutationVariables>;
export const DeleteApiKeyDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteApiKey"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"DeleteApiKeyInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"apiKey"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"delete"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}]}]}}]}}]} as unknown as DocumentNode<DeleteApiKeyMutation, DeleteApiKeyMutationVariables>;
export const ApiKeyMetaDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ApiKeyMeta"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"apiKeyPossibleRoles"}},{"kind":"Field","name":{"kind":"Name","value":"apiKeyPossiblePermissions"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"resource"}},{"kind":"Field","name":{"kind":"Name","value":"actions"}}]}}]}}]} as unknown as DocumentNode<ApiKeyMetaQuery, ApiKeyMetaQueryVariables>;
export const BackupJobsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"BackupJobs"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"backup"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"jobs"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"JobStatus"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"JobStatus"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"JobStatus"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"externalJobId"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"progress"}},{"kind":"Field","name":{"kind":"Name","value":"message"}},{"kind":"Field","name":{"kind":"Name","value":"error"}},{"kind":"Field","name":{"kind":"Name","value":"startTime"}},{"kind":"Field","name":{"kind":"Name","value":"endTime"}},{"kind":"Field","name":{"kind":"Name","value":"bytesTransferred"}},{"kind":"Field","name":{"kind":"Name","value":"totalBytes"}},{"kind":"Field","name":{"kind":"Name","value":"speed"}},{"kind":"Field","name":{"kind":"Name","value":"elapsedTime"}},{"kind":"Field","name":{"kind":"Name","value":"eta"}},{"kind":"Field","name":{"kind":"Name","value":"formattedBytesTransferred"}},{"kind":"Field","name":{"kind":"Name","value":"formattedSpeed"}},{"kind":"Field","name":{"kind":"Name","value":"formattedElapsedTime"}},{"kind":"Field","name":{"kind":"Name","value":"formattedEta"}}]}}]} as unknown as DocumentNode<BackupJobsQuery, BackupJobsQueryVariables>;
export const BackupJobDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"BackupJob"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"PrefixedID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"backupJob"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"JobStatus"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"JobStatus"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"JobStatus"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"externalJobId"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"progress"}},{"kind":"Field","name":{"kind":"Name","value":"message"}},{"kind":"Field","name":{"kind":"Name","value":"error"}},{"kind":"Field","name":{"kind":"Name","value":"startTime"}},{"kind":"Field","name":{"kind":"Name","value":"endTime"}},{"kind":"Field","name":{"kind":"Name","value":"bytesTransferred"}},{"kind":"Field","name":{"kind":"Name","value":"totalBytes"}},{"kind":"Field","name":{"kind":"Name","value":"speed"}},{"kind":"Field","name":{"kind":"Name","value":"elapsedTime"}},{"kind":"Field","name":{"kind":"Name","value":"eta"}},{"kind":"Field","name":{"kind":"Name","value":"formattedBytesTransferred"}},{"kind":"Field","name":{"kind":"Name","value":"formattedSpeed"}},{"kind":"Field","name":{"kind":"Name","value":"formattedElapsedTime"}},{"kind":"Field","name":{"kind":"Name","value":"formattedEta"}}]}}]} as unknown as DocumentNode<BackupJobQuery, BackupJobQueryVariables>;
export const BackupJobConfigDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"BackupJobConfig"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"PrefixedID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"backupJobConfig"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"BackupJobConfigWithCurrentJob"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"SourceConfig"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"SourceConfigUnion"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"ZfsPreprocessConfig"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"poolName"}},{"kind":"Field","name":{"kind":"Name","value":"datasetName"}},{"kind":"Field","name":{"kind":"Name","value":"snapshotPrefix"}},{"kind":"Field","name":{"kind":"Name","value":"cleanupSnapshots"}},{"kind":"Field","name":{"kind":"Name","value":"retainSnapshots"}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"FlashPreprocessConfig"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"flashPath"}},{"kind":"Field","name":{"kind":"Name","value":"includeGitHistory"}},{"kind":"Field","name":{"kind":"Name","value":"additionalPaths"}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"ScriptPreprocessConfig"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"scriptPath"}},{"kind":"Field","name":{"kind":"Name","value":"scriptArgs"}},{"kind":"Field","name":{"kind":"Name","value":"workingDirectory"}},{"kind":"Field","name":{"kind":"Name","value":"environment"}},{"kind":"Field","name":{"kind":"Name","value":"outputPath"}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"RawBackupConfig"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"sourcePath"}},{"kind":"Field","name":{"kind":"Name","value":"excludePatterns"}},{"kind":"Field","name":{"kind":"Name","value":"includePatterns"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"DestinationConfig"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"DestinationConfigUnion"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"RcloneDestinationConfig"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"remoteName"}},{"kind":"Field","name":{"kind":"Name","value":"destinationPath"}},{"kind":"Field","name":{"kind":"Name","value":"rcloneOptions"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"BackupJobConfig"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"BackupJobConfig"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"sourceType"}},{"kind":"Field","name":{"kind":"Name","value":"destinationType"}},{"kind":"Field","name":{"kind":"Name","value":"schedule"}},{"kind":"Field","name":{"kind":"Name","value":"enabled"}},{"kind":"Field","name":{"kind":"Name","value":"sourceConfig"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"SourceConfig"}}]}},{"kind":"Field","name":{"kind":"Name","value":"destinationConfig"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"DestinationConfig"}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"lastRunAt"}},{"kind":"Field","name":{"kind":"Name","value":"lastRunStatus"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"JobStatus"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"JobStatus"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"externalJobId"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"progress"}},{"kind":"Field","name":{"kind":"Name","value":"message"}},{"kind":"Field","name":{"kind":"Name","value":"error"}},{"kind":"Field","name":{"kind":"Name","value":"startTime"}},{"kind":"Field","name":{"kind":"Name","value":"endTime"}},{"kind":"Field","name":{"kind":"Name","value":"bytesTransferred"}},{"kind":"Field","name":{"kind":"Name","value":"totalBytes"}},{"kind":"Field","name":{"kind":"Name","value":"speed"}},{"kind":"Field","name":{"kind":"Name","value":"elapsedTime"}},{"kind":"Field","name":{"kind":"Name","value":"eta"}},{"kind":"Field","name":{"kind":"Name","value":"formattedBytesTransferred"}},{"kind":"Field","name":{"kind":"Name","value":"formattedSpeed"}},{"kind":"Field","name":{"kind":"Name","value":"formattedElapsedTime"}},{"kind":"Field","name":{"kind":"Name","value":"formattedEta"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"BackupJobConfigWithCurrentJob"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"BackupJobConfig"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"BackupJobConfig"}},{"kind":"Field","name":{"kind":"Name","value":"currentJob"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"JobStatus"}}]}}]}}]} as unknown as DocumentNode<BackupJobConfigQuery, BackupJobConfigQueryVariables>;
export const BackupJobConfigsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"BackupJobConfigs"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"backup"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"configs"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"BackupJobConfigWithCurrentJob"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"SourceConfig"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"SourceConfigUnion"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"ZfsPreprocessConfig"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"poolName"}},{"kind":"Field","name":{"kind":"Name","value":"datasetName"}},{"kind":"Field","name":{"kind":"Name","value":"snapshotPrefix"}},{"kind":"Field","name":{"kind":"Name","value":"cleanupSnapshots"}},{"kind":"Field","name":{"kind":"Name","value":"retainSnapshots"}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"FlashPreprocessConfig"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"flashPath"}},{"kind":"Field","name":{"kind":"Name","value":"includeGitHistory"}},{"kind":"Field","name":{"kind":"Name","value":"additionalPaths"}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"ScriptPreprocessConfig"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"scriptPath"}},{"kind":"Field","name":{"kind":"Name","value":"scriptArgs"}},{"kind":"Field","name":{"kind":"Name","value":"workingDirectory"}},{"kind":"Field","name":{"kind":"Name","value":"environment"}},{"kind":"Field","name":{"kind":"Name","value":"outputPath"}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"RawBackupConfig"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"sourcePath"}},{"kind":"Field","name":{"kind":"Name","value":"excludePatterns"}},{"kind":"Field","name":{"kind":"Name","value":"includePatterns"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"DestinationConfig"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"DestinationConfigUnion"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"RcloneDestinationConfig"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"remoteName"}},{"kind":"Field","name":{"kind":"Name","value":"destinationPath"}},{"kind":"Field","name":{"kind":"Name","value":"rcloneOptions"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"BackupJobConfig"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"BackupJobConfig"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"sourceType"}},{"kind":"Field","name":{"kind":"Name","value":"destinationType"}},{"kind":"Field","name":{"kind":"Name","value":"schedule"}},{"kind":"Field","name":{"kind":"Name","value":"enabled"}},{"kind":"Field","name":{"kind":"Name","value":"sourceConfig"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"SourceConfig"}}]}},{"kind":"Field","name":{"kind":"Name","value":"destinationConfig"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"DestinationConfig"}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"lastRunAt"}},{"kind":"Field","name":{"kind":"Name","value":"lastRunStatus"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"JobStatus"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"JobStatus"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"externalJobId"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"progress"}},{"kind":"Field","name":{"kind":"Name","value":"message"}},{"kind":"Field","name":{"kind":"Name","value":"error"}},{"kind":"Field","name":{"kind":"Name","value":"startTime"}},{"kind":"Field","name":{"kind":"Name","value":"endTime"}},{"kind":"Field","name":{"kind":"Name","value":"bytesTransferred"}},{"kind":"Field","name":{"kind":"Name","value":"totalBytes"}},{"kind":"Field","name":{"kind":"Name","value":"speed"}},{"kind":"Field","name":{"kind":"Name","value":"elapsedTime"}},{"kind":"Field","name":{"kind":"Name","value":"eta"}},{"kind":"Field","name":{"kind":"Name","value":"formattedBytesTransferred"}},{"kind":"Field","name":{"kind":"Name","value":"formattedSpeed"}},{"kind":"Field","name":{"kind":"Name","value":"formattedElapsedTime"}},{"kind":"Field","name":{"kind":"Name","value":"formattedEta"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"BackupJobConfigWithCurrentJob"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"BackupJobConfig"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"BackupJobConfig"}},{"kind":"Field","name":{"kind":"Name","value":"currentJob"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"JobStatus"}}]}}]}}]} as unknown as DocumentNode<BackupJobConfigsQuery, BackupJobConfigsQueryVariables>;
export const BackupJobConfigsListDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"BackupJobConfigsList"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"backup"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"configs"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]}}]} as unknown as DocumentNode<BackupJobConfigsListQuery, BackupJobConfigsListQueryVariables>;
export const BackupJobConfigFormDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"BackupJobConfigForm"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"BackupJobConfigFormInput"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"backupJobConfigForm"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"dataSchema"}},{"kind":"Field","name":{"kind":"Name","value":"uiSchema"}}]}}]}}]} as unknown as DocumentNode<BackupJobConfigFormQuery, BackupJobConfigFormQueryVariables>;
export const CreateBackupJobConfigDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateBackupJobConfig"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateBackupJobConfigInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"backup"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createBackupJobConfig"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"BackupJobConfig"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"SourceConfig"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"SourceConfigUnion"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"ZfsPreprocessConfig"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"poolName"}},{"kind":"Field","name":{"kind":"Name","value":"datasetName"}},{"kind":"Field","name":{"kind":"Name","value":"snapshotPrefix"}},{"kind":"Field","name":{"kind":"Name","value":"cleanupSnapshots"}},{"kind":"Field","name":{"kind":"Name","value":"retainSnapshots"}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"FlashPreprocessConfig"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"flashPath"}},{"kind":"Field","name":{"kind":"Name","value":"includeGitHistory"}},{"kind":"Field","name":{"kind":"Name","value":"additionalPaths"}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"ScriptPreprocessConfig"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"scriptPath"}},{"kind":"Field","name":{"kind":"Name","value":"scriptArgs"}},{"kind":"Field","name":{"kind":"Name","value":"workingDirectory"}},{"kind":"Field","name":{"kind":"Name","value":"environment"}},{"kind":"Field","name":{"kind":"Name","value":"outputPath"}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"RawBackupConfig"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"sourcePath"}},{"kind":"Field","name":{"kind":"Name","value":"excludePatterns"}},{"kind":"Field","name":{"kind":"Name","value":"includePatterns"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"DestinationConfig"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"DestinationConfigUnion"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"RcloneDestinationConfig"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"remoteName"}},{"kind":"Field","name":{"kind":"Name","value":"destinationPath"}},{"kind":"Field","name":{"kind":"Name","value":"rcloneOptions"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"BackupJobConfig"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"BackupJobConfig"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"sourceType"}},{"kind":"Field","name":{"kind":"Name","value":"destinationType"}},{"kind":"Field","name":{"kind":"Name","value":"schedule"}},{"kind":"Field","name":{"kind":"Name","value":"enabled"}},{"kind":"Field","name":{"kind":"Name","value":"sourceConfig"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"SourceConfig"}}]}},{"kind":"Field","name":{"kind":"Name","value":"destinationConfig"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"DestinationConfig"}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"lastRunAt"}},{"kind":"Field","name":{"kind":"Name","value":"lastRunStatus"}}]}}]} as unknown as DocumentNode<CreateBackupJobConfigMutation, CreateBackupJobConfigMutationVariables>;
export const UpdateBackupJobConfigDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateBackupJobConfig"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"PrefixedID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateBackupJobConfigInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"backup"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateBackupJobConfig"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"BackupJobConfig"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"SourceConfig"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"SourceConfigUnion"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"ZfsPreprocessConfig"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"poolName"}},{"kind":"Field","name":{"kind":"Name","value":"datasetName"}},{"kind":"Field","name":{"kind":"Name","value":"snapshotPrefix"}},{"kind":"Field","name":{"kind":"Name","value":"cleanupSnapshots"}},{"kind":"Field","name":{"kind":"Name","value":"retainSnapshots"}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"FlashPreprocessConfig"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"flashPath"}},{"kind":"Field","name":{"kind":"Name","value":"includeGitHistory"}},{"kind":"Field","name":{"kind":"Name","value":"additionalPaths"}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"ScriptPreprocessConfig"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"scriptPath"}},{"kind":"Field","name":{"kind":"Name","value":"scriptArgs"}},{"kind":"Field","name":{"kind":"Name","value":"workingDirectory"}},{"kind":"Field","name":{"kind":"Name","value":"environment"}},{"kind":"Field","name":{"kind":"Name","value":"outputPath"}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"RawBackupConfig"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"sourcePath"}},{"kind":"Field","name":{"kind":"Name","value":"excludePatterns"}},{"kind":"Field","name":{"kind":"Name","value":"includePatterns"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"DestinationConfig"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"DestinationConfigUnion"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"RcloneDestinationConfig"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"remoteName"}},{"kind":"Field","name":{"kind":"Name","value":"destinationPath"}},{"kind":"Field","name":{"kind":"Name","value":"rcloneOptions"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"BackupJobConfig"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"BackupJobConfig"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"sourceType"}},{"kind":"Field","name":{"kind":"Name","value":"destinationType"}},{"kind":"Field","name":{"kind":"Name","value":"schedule"}},{"kind":"Field","name":{"kind":"Name","value":"enabled"}},{"kind":"Field","name":{"kind":"Name","value":"sourceConfig"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"SourceConfig"}}]}},{"kind":"Field","name":{"kind":"Name","value":"destinationConfig"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"DestinationConfig"}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"lastRunAt"}},{"kind":"Field","name":{"kind":"Name","value":"lastRunStatus"}}]}}]} as unknown as DocumentNode<UpdateBackupJobConfigMutation, UpdateBackupJobConfigMutationVariables>;
export const DeleteBackupJobConfigDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteBackupJobConfig"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"PrefixedID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"backup"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteBackupJobConfig"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}]}}]}}]} as unknown as DocumentNode<DeleteBackupJobConfigMutation, DeleteBackupJobConfigMutationVariables>;
export const ToggleBackupJobConfigDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ToggleBackupJobConfig"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"PrefixedID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"backup"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"toggleJobConfig"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"BackupJobConfig"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"SourceConfig"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"SourceConfigUnion"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"ZfsPreprocessConfig"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"poolName"}},{"kind":"Field","name":{"kind":"Name","value":"datasetName"}},{"kind":"Field","name":{"kind":"Name","value":"snapshotPrefix"}},{"kind":"Field","name":{"kind":"Name","value":"cleanupSnapshots"}},{"kind":"Field","name":{"kind":"Name","value":"retainSnapshots"}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"FlashPreprocessConfig"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"flashPath"}},{"kind":"Field","name":{"kind":"Name","value":"includeGitHistory"}},{"kind":"Field","name":{"kind":"Name","value":"additionalPaths"}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"ScriptPreprocessConfig"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"scriptPath"}},{"kind":"Field","name":{"kind":"Name","value":"scriptArgs"}},{"kind":"Field","name":{"kind":"Name","value":"workingDirectory"}},{"kind":"Field","name":{"kind":"Name","value":"environment"}},{"kind":"Field","name":{"kind":"Name","value":"outputPath"}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"RawBackupConfig"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"sourcePath"}},{"kind":"Field","name":{"kind":"Name","value":"excludePatterns"}},{"kind":"Field","name":{"kind":"Name","value":"includePatterns"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"DestinationConfig"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"DestinationConfigUnion"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"RcloneDestinationConfig"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"remoteName"}},{"kind":"Field","name":{"kind":"Name","value":"destinationPath"}},{"kind":"Field","name":{"kind":"Name","value":"rcloneOptions"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"BackupJobConfig"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"BackupJobConfig"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"sourceType"}},{"kind":"Field","name":{"kind":"Name","value":"destinationType"}},{"kind":"Field","name":{"kind":"Name","value":"schedule"}},{"kind":"Field","name":{"kind":"Name","value":"enabled"}},{"kind":"Field","name":{"kind":"Name","value":"sourceConfig"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"SourceConfig"}}]}},{"kind":"Field","name":{"kind":"Name","value":"destinationConfig"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"DestinationConfig"}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"lastRunAt"}},{"kind":"Field","name":{"kind":"Name","value":"lastRunStatus"}}]}}]} as unknown as DocumentNode<ToggleBackupJobConfigMutation, ToggleBackupJobConfigMutationVariables>;
export const TriggerBackupJobDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"TriggerBackupJob"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"PrefixedID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"backup"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"triggerJob"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"jobId"}}]}}]}}]}}]} as unknown as DocumentNode<TriggerBackupJobMutation, TriggerBackupJobMutationVariables>;
export const StopBackupJobDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"StopBackupJob"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"PrefixedID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"backup"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"stopBackupJob"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"jobId"}}]}}]}}]}}]} as unknown as DocumentNode<StopBackupJobMutation, StopBackupJobMutationVariables>;
export const InitiateBackupDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"InitiateBackup"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"InitiateBackupInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"backup"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"initiateBackup"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"jobId"}}]}}]}}]}}]} as unknown as DocumentNode<InitiateBackupMutation, InitiateBackupMutationVariables>;
export const UnifiedDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"Unified"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"settings"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"unified"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"dataSchema"}},{"kind":"Field","name":{"kind":"Name","value":"uiSchema"}},{"kind":"Field","name":{"kind":"Name","value":"values"}}]}}]}}]}}]} as unknown as DocumentNode<UnifiedQuery, UnifiedQueryVariables>;
export const UpdateConnectSettingsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateConnectSettings"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"JSON"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateSettings"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"restartRequired"}},{"kind":"Field","name":{"kind":"Name","value":"values"}}]}}]}}]} as unknown as DocumentNode<UpdateConnectSettingsMutation, UpdateConnectSettingsMutationVariables>;
export const LogFilesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"LogFiles"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"logFiles"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"path"}},{"kind":"Field","name":{"kind":"Name","value":"size"}},{"kind":"Field","name":{"kind":"Name","value":"modifiedAt"}}]}}]}}]} as unknown as DocumentNode<LogFilesQuery, LogFilesQueryVariables>;
export const LogFileContentDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"LogFileContent"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"path"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"lines"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"startLine"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"logFile"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"path"},"value":{"kind":"Variable","name":{"kind":"Name","value":"path"}}},{"kind":"Argument","name":{"kind":"Name","value":"lines"},"value":{"kind":"Variable","name":{"kind":"Name","value":"lines"}}},{"kind":"Argument","name":{"kind":"Name","value":"startLine"},"value":{"kind":"Variable","name":{"kind":"Name","value":"startLine"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"path"}},{"kind":"Field","name":{"kind":"Name","value":"content"}},{"kind":"Field","name":{"kind":"Name","value":"totalLines"}},{"kind":"Field","name":{"kind":"Name","value":"startLine"}}]}}]}}]} as unknown as DocumentNode<LogFileContentQuery, LogFileContentQueryVariables>;
export const LogFileSubscriptionDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"subscription","name":{"kind":"Name","value":"LogFileSubscription"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"path"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"logFile"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"path"},"value":{"kind":"Variable","name":{"kind":"Name","value":"path"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"path"}},{"kind":"Field","name":{"kind":"Name","value":"content"}},{"kind":"Field","name":{"kind":"Name","value":"totalLines"}}]}}]}}]} as unknown as DocumentNode<LogFileSubscriptionSubscription, LogFileSubscriptionSubscriptionVariables>;
export const NotificationsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"Notifications"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"filter"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"NotificationFilter"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"notifications"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"list"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"filter"},"value":{"kind":"Variable","name":{"kind":"Name","value":"filter"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"NotificationFragment"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"NotificationFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Notification"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"subject"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"importance"}},{"kind":"Field","name":{"kind":"Name","value":"link"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"timestamp"}},{"kind":"Field","name":{"kind":"Name","value":"formattedTimestamp"}}]}}]} as unknown as DocumentNode<NotificationsQuery, NotificationsQueryVariables>;
export const ArchiveNotificationDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ArchiveNotification"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"PrefixedID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"archiveNotification"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"NotificationFragment"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"NotificationFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Notification"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"subject"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"importance"}},{"kind":"Field","name":{"kind":"Name","value":"link"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"timestamp"}},{"kind":"Field","name":{"kind":"Name","value":"formattedTimestamp"}}]}}]} as unknown as DocumentNode<ArchiveNotificationMutation, ArchiveNotificationMutationVariables>;
export const ArchiveAllNotificationsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ArchiveAllNotifications"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"archiveAll"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"unread"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"total"}}]}},{"kind":"Field","name":{"kind":"Name","value":"archive"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"info"}},{"kind":"Field","name":{"kind":"Name","value":"warning"}},{"kind":"Field","name":{"kind":"Name","value":"alert"}},{"kind":"Field","name":{"kind":"Name","value":"total"}}]}}]}}]}}]} as unknown as DocumentNode<ArchiveAllNotificationsMutation, ArchiveAllNotificationsMutationVariables>;
export const DeleteNotificationDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteNotification"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"PrefixedID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"type"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"NotificationType"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteNotification"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"type"},"value":{"kind":"Variable","name":{"kind":"Name","value":"type"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"archive"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"total"}}]}}]}}]}}]} as unknown as DocumentNode<DeleteNotificationMutation, DeleteNotificationMutationVariables>;
export const DeleteAllNotificationsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteAllNotifications"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteArchivedNotifications"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"archive"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"total"}}]}},{"kind":"Field","name":{"kind":"Name","value":"unread"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"total"}}]}}]}}]}}]} as unknown as DocumentNode<DeleteAllNotificationsMutation, DeleteAllNotificationsMutationVariables>;
export const OverviewDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"Overview"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"notifications"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"overview"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"unread"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"info"}},{"kind":"Field","name":{"kind":"Name","value":"warning"}},{"kind":"Field","name":{"kind":"Name","value":"alert"}},{"kind":"Field","name":{"kind":"Name","value":"total"}}]}},{"kind":"Field","name":{"kind":"Name","value":"archive"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"total"}}]}}]}}]}}]}}]} as unknown as DocumentNode<OverviewQuery, OverviewQueryVariables>;
export const RecomputeOverviewDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"RecomputeOverview"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"recalculateOverview"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"archive"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"NotificationCountFragment"}}]}},{"kind":"Field","name":{"kind":"Name","value":"unread"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"NotificationCountFragment"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"NotificationCountFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"NotificationCounts"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"total"}},{"kind":"Field","name":{"kind":"Name","value":"info"}},{"kind":"Field","name":{"kind":"Name","value":"warning"}},{"kind":"Field","name":{"kind":"Name","value":"alert"}}]}}]} as unknown as DocumentNode<RecomputeOverviewMutation, RecomputeOverviewMutationVariables>;
export const NotificationAddedSubDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"subscription","name":{"kind":"Name","value":"NotificationAddedSub"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"notificationAdded"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"NotificationFragment"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"NotificationFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Notification"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"subject"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"importance"}},{"kind":"Field","name":{"kind":"Name","value":"link"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"timestamp"}},{"kind":"Field","name":{"kind":"Name","value":"formattedTimestamp"}}]}}]} as unknown as DocumentNode<NotificationAddedSubSubscription, NotificationAddedSubSubscriptionVariables>;
export const NotificationOverviewSubDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"subscription","name":{"kind":"Name","value":"NotificationOverviewSub"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"notificationsOverview"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"archive"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"NotificationCountFragment"}}]}},{"kind":"Field","name":{"kind":"Name","value":"unread"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"NotificationCountFragment"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"NotificationCountFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"NotificationCounts"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"total"}},{"kind":"Field","name":{"kind":"Name","value":"info"}},{"kind":"Field","name":{"kind":"Name","value":"warning"}},{"kind":"Field","name":{"kind":"Name","value":"alert"}}]}}]} as unknown as DocumentNode<NotificationOverviewSubSubscription, NotificationOverviewSubSubscriptionVariables>;
export const CreateRCloneRemoteDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateRCloneRemote"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateRCloneRemoteInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"rclone"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createRCloneRemote"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"parameters"}}]}}]}}]}}]} as unknown as DocumentNode<CreateRCloneRemoteMutation, CreateRCloneRemoteMutationVariables>;
export const DeleteRCloneRemoteDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteRCloneRemote"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"DeleteRCloneRemoteInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"rclone"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteRCloneRemote"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}]}]}}]}}]} as unknown as DocumentNode<DeleteRCloneRemoteMutation, DeleteRCloneRemoteMutationVariables>;
export const GetRCloneConfigFormDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetRCloneConfigForm"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"formOptions"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"RCloneConfigFormInput"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"rclone"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"configForm"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"formOptions"},"value":{"kind":"Variable","name":{"kind":"Name","value":"formOptions"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"dataSchema"}},{"kind":"Field","name":{"kind":"Name","value":"uiSchema"}}]}}]}}]}}]} as unknown as DocumentNode<GetRCloneConfigFormQuery, GetRCloneConfigFormQueryVariables>;
export const ListRCloneRemotesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ListRCloneRemotes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"rclone"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"remotes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"parameters"}},{"kind":"Field","name":{"kind":"Name","value":"config"}}]}}]}}]}}]} as unknown as DocumentNode<ListRCloneRemotesQuery, ListRCloneRemotesQueryVariables>;
export const ConnectSignInDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ConnectSignIn"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ConnectSignInInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"connectSignIn"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}]}]}}]} as unknown as DocumentNode<ConnectSignInMutation, ConnectSignInMutationVariables>;
export const SignOutDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"SignOut"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"connectSignOut"}}]}}]} as unknown as DocumentNode<SignOutMutation, SignOutMutationVariables>;
export const IsSsoEnabledDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"IsSSOEnabled"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"isSSOEnabled"}}]}}]} as unknown as DocumentNode<IsSsoEnabledQuery, IsSsoEnabledQueryVariables>;
export const CloudStateDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"cloudState"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"cloud"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"PartialCloud"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"PartialCloud"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Cloud"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"error"}},{"kind":"Field","name":{"kind":"Name","value":"apiKey"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"valid"}},{"kind":"Field","name":{"kind":"Name","value":"error"}}]}},{"kind":"Field","name":{"kind":"Name","value":"cloud"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"error"}}]}},{"kind":"Field","name":{"kind":"Name","value":"minigraphql"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"error"}}]}},{"kind":"Field","name":{"kind":"Name","value":"relay"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"error"}}]}}]}}]} as unknown as DocumentNode<CloudStateQuery, CloudStateQueryVariables>;
export const ServerStateDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"serverState"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"config"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"error"}},{"kind":"Field","name":{"kind":"Name","value":"valid"}}]}},{"kind":"Field","name":{"kind":"Name","value":"info"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"os"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"hostname"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"owner"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"avatar"}},{"kind":"Field","name":{"kind":"Name","value":"username"}}]}},{"kind":"Field","name":{"kind":"Name","value":"registration"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"state"}},{"kind":"Field","name":{"kind":"Name","value":"expiration"}},{"kind":"Field","name":{"kind":"Name","value":"keyFile"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"contents"}}]}},{"kind":"Field","name":{"kind":"Name","value":"updateExpiration"}}]}},{"kind":"Field","name":{"kind":"Name","value":"vars"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"regGen"}},{"kind":"Field","name":{"kind":"Name","value":"regState"}},{"kind":"Field","name":{"kind":"Name","value":"configError"}},{"kind":"Field","name":{"kind":"Name","value":"configValid"}}]}}]}}]} as unknown as DocumentNode<ServerStateQuery, ServerStateQueryVariables>;
export const GetThemeDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"getTheme"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"publicTheme"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"showBannerImage"}},{"kind":"Field","name":{"kind":"Name","value":"showBannerGradient"}},{"kind":"Field","name":{"kind":"Name","value":"headerBackgroundColor"}},{"kind":"Field","name":{"kind":"Name","value":"showHeaderDescription"}},{"kind":"Field","name":{"kind":"Name","value":"headerPrimaryTextColor"}},{"kind":"Field","name":{"kind":"Name","value":"headerSecondaryTextColor"}}]}}]}}]} as unknown as DocumentNode<GetThemeQuery, GetThemeQueryVariables>;