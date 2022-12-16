/* eslint-disable */
import { GraphQLResolveInfo, GraphQLScalarType, GraphQLScalarTypeConfig } from 'graphql';
import { Context } from '@app/graphql/schema/utils';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type RequireFields<T, K extends keyof T> = Omit<T, K> & { [P in K]-?: NonNullable<T[P]> };
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
  UUID: any;
};

export type ApiKey = {
  __typename?: 'ApiKey';
  description?: Maybe<Scalars['String']>;
  expiresAt: Scalars['Long'];
  key: Scalars['String'];
  name: Scalars['String'];
  scopes: Scalars['JSON'];
};

export type ApiKeyResponse = {
  __typename?: 'ApiKeyResponse';
  error?: Maybe<Scalars['String']>;
  valid?: Maybe<Scalars['Boolean']>;
};

export type ArrayType = {
  __typename?: 'Array';
  /** Current boot disk */
  boot?: Maybe<ArrayDataDisk>;
  /** Caches in the current array */
  caches?: Maybe<Array<Maybe<ArrayDataDisk>>>;
  /** Current array capacity */
  capacity: ArrayCapacity;
  /** Data disks in the current array */
  disks?: Maybe<Array<Maybe<ArrayDataDisk>>>;
  /** Parity disks in the current array */
  parities?: Maybe<Array<Maybe<ArrayDataDisk>>>;
  /** Array state after this query/mutation */
  pendingState?: Maybe<ArrayPendingState>;
  /** Array state before this query/mutation */
  previousState?: Maybe<ArrayState>;
  /** Current array state */
  state: ArrayState;
};

export type ArrayCapacity = {
  __typename?: 'ArrayCapacity';
  bytes?: Maybe<Capacity>;
  disks?: Maybe<Capacity>;
};

export type ArrayDataDisk = {
  __typename?: 'ArrayDataDisk';
  color: Scalars['String'];
  comment?: Maybe<Scalars['String']>;
  device: Scalars['String'];
  deviceSb?: Maybe<Scalars['String']>;
  /** Indicates if the disk should be exported as a network share. */
  exportable: Scalars['Boolean'];
  format: Scalars['String'];
  fsColor?: Maybe<ArrayDiskFsColor>;
  fsFree?: Maybe<Scalars['Long']>;
  fsSize?: Maybe<Scalars['Long']>;
  fsStatus?: Maybe<Scalars['String']>;
  /** Indicates the file system detected in partition 1 of the device. */
  fsType?: Maybe<DiskFsType>;
  id: Scalars['ID'];
  idSb?: Maybe<Scalars['String']>;
  luksState?: Maybe<Scalars['String']>;
  name: Scalars['String'];
  /** Number of unrecoverable errors reported by the device I/O drivers. Missing data due to unrecoverable array read errors is filled in on-the-fly using parity reconstruct (and we attempt to write this data back to the sector(s) which failed). Any unrecoverable write error results in disabling the disk. */
  numErrors: Scalars['Int'];
  /** Count of I/O read requests sent to the device I/O drivers. These statistics may be cleared at any time. */
  numReads: Scalars['Int'];
  /** Count of I/O writes requests sent to the device I/O drivers. These statistics may be cleared at any time. */
  numWrites: Scalars['Int'];
  rotational: Scalars['Boolean'];
  size: Scalars['Long'];
  sizeSb?: Maybe<Scalars['Long']>;
  /** Array slot number. Parity1 is always 0 and Parity2 is always 29. Array slots will be 1 - 28. Cache slots are 30 - 53. Flash is 54. */
  slot: Scalars['Long'];
  spindownDelay?: Maybe<Scalars['String']>;
  spinupGroup?: Maybe<Scalars['String']>;
  status: ArrayDiskStatus;
  temp: Scalars['Int'];
  type: ArrayDiskType;
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
  DISK_OK = 'DISK_OK'
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
  DISABLE_DISK = 'disable_disk',
  /** Too many changes to array at the same time */
  INVALID_EXPANSION = 'invalid_expansion',
  /** Array has new disks */
  NEW_ARRAY = 'new_array',
  /** Array has new disks they're too small */
  NEW_DISK_TOO_SMALL = 'new_disk_too_small',
  /** Array has no data disks */
  NO_DATA_DISKS = 'no_data_disks',
  /** Parity isn't the biggest, can't start array */
  PARITY_NOT_BIGGEST = 'parity_not_biggest',
  /** A disk is being reconstructed */
  RECON_DISK = 'recon_disk',
  /** Array is running */
  STARTED = 'started',
  /** Array has stopped */
  STOPPED = 'stopped',
  /** Array is disabled */
  SWAP_DSBL = 'swap_dsbl',
  /** Array has too many missing data disks */
  TOO_MANY_MISSING_DISKS = 'too_many_missing_disks'
}

export type Baseboard = {
  __typename?: 'Baseboard';
  assetTag?: Maybe<Scalars['String']>;
  manufacturer: Scalars['String'];
  model?: Maybe<Scalars['String']>;
  serial?: Maybe<Scalars['String']>;
  version?: Maybe<Scalars['String']>;
};

export type Capacity = {
  __typename?: 'Capacity';
  free?: Maybe<Scalars['String']>;
  total?: Maybe<Scalars['String']>;
  used?: Maybe<Scalars['String']>;
};

export type Case = {
  __typename?: 'Case';
  base64?: Maybe<Scalars['String']>;
  error?: Maybe<Scalars['String']>;
  icon?: Maybe<Scalars['String']>;
  url?: Maybe<Scalars['String']>;
};

export type Cloud = {
  __typename?: 'Cloud';
  allowedOrigins?: Maybe<Array<Maybe<Scalars['String']>>>;
  apiKey?: Maybe<ApiKeyResponse>;
  cloud?: Maybe<CloudResponse>;
  emhttp?: Maybe<EmhttpResponse>;
  error?: Maybe<Scalars['String']>;
  minigraphql?: Maybe<MinigraphqlResponse>;
  relay?: Maybe<RelayResponse>;
};

export type CloudResponse = {
  __typename?: 'CloudResponse';
  error?: Maybe<Scalars['String']>;
  ip?: Maybe<Scalars['String']>;
  status: Scalars['String'];
};

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

export type ContainerHostConfig = {
  __typename?: 'ContainerHostConfig';
  networkMode: Scalars['String'];
};

export type ContainerMount = {
  __typename?: 'ContainerMount';
  destination: Scalars['String'];
  driver: Scalars['String'];
  mode: Scalars['String'];
  name: Scalars['String'];
  propagation: Scalars['String'];
  rw: Scalars['Boolean'];
  source: Scalars['String'];
  type: Scalars['String'];
};

export type ContainerPort = {
  __typename?: 'ContainerPort';
  ip: Scalars['String'];
  privatePort?: Maybe<Scalars['Int']>;
  publicPort?: Maybe<Scalars['Int']>;
  type?: Maybe<ContainerPortType>;
};

export enum ContainerPortType {
  TCP = 'tcp',
  UDP = 'udp'
}

export enum ContainerState {
  EXITED = 'exited',
  RUNNING = 'running'
}

export type Dashboard = {
  __typename?: 'Dashboard';
  apps: DashboardApps;
  array: DashboardArray;
  config: DashboardConfig;
  display: DashboardDisplay;
  os: DashboardOs;
  services: Array<Maybe<DashboardService>>;
  twoFactor: DashboardTwoFactor;
  vars: DashboardVars;
  versions: DashboardVersions;
  vms: DashboardVms;
};

export type DashboardApps = {
  __typename?: 'DashboardApps';
  installed?: Maybe<Scalars['Int']>;
  started?: Maybe<Scalars['Int']>;
};

export type DashboardArray = {
  __typename?: 'DashboardArray';
  /** Current array capacity */
  capacity: ArrayCapacity;
  /** Current array state */
  state: ArrayState;
};

export type DashboardCase = {
  __typename?: 'DashboardCase';
  base64?: Maybe<Scalars['String']>;
  error?: Maybe<Scalars['String']>;
  icon?: Maybe<Scalars['String']>;
  url?: Maybe<Scalars['String']>;
};

export type DashboardConfig = {
  __typename?: 'DashboardConfig';
  error?: Maybe<Scalars['String']>;
  valid?: Maybe<Scalars['Boolean']>;
};

export type DashboardDisplay = {
  __typename?: 'DashboardDisplay';
  case?: Maybe<DashboardCase>;
};

export type DashboardOs = {
  __typename?: 'DashboardOs';
  hostname?: Maybe<Scalars['String']>;
  uptime?: Maybe<Scalars['DateTime']>;
};

export type DashboardService = {
  __typename?: 'DashboardService';
  name?: Maybe<Scalars['String']>;
  online?: Maybe<Scalars['Boolean']>;
  uptime?: Maybe<DashboardServiceUptime>;
  version?: Maybe<Scalars['String']>;
};

export type DashboardServiceUptime = {
  __typename?: 'DashboardServiceUptime';
  timestamp?: Maybe<Scalars['DateTime']>;
};

export type DashboardTwoFactor = {
  __typename?: 'DashboardTwoFactor';
  local?: Maybe<DashboardTwoFactorLocal>;
  remote?: Maybe<DashboardTwoFactorRemote>;
};

export type DashboardTwoFactorLocal = {
  __typename?: 'DashboardTwoFactorLocal';
  enabled?: Maybe<Scalars['Boolean']>;
};

export type DashboardTwoFactorRemote = {
  __typename?: 'DashboardTwoFactorRemote';
  enabled?: Maybe<Scalars['Boolean']>;
};

export type DashboardVars = {
  __typename?: 'DashboardVars';
  flashGuid?: Maybe<Scalars['String']>;
  regState?: Maybe<Scalars['String']>;
  regTy?: Maybe<Scalars['String']>;
};

export type DashboardVersions = {
  __typename?: 'DashboardVersions';
  unraid?: Maybe<Scalars['String']>;
};

export type DashboardVms = {
  __typename?: 'DashboardVms';
  installed?: Maybe<Scalars['Int']>;
  started?: Maybe<Scalars['Int']>;
};

export type Device = {
  __typename?: 'Device';
  device?: Maybe<Scalars['String']>;
  id: Scalars['ID'];
  sectorSize?: Maybe<Scalars['String']>;
  sectors?: Maybe<Scalars['String']>;
  tag?: Maybe<Scalars['String']>;
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
  bytesPerSector: Scalars['Long'];
  device: Scalars['String'];
  firmwareRevision: Scalars['String'];
  interfaceType: DiskInterfaceType;
  name: Scalars['String'];
  partitions?: Maybe<Array<DiskPartition>>;
  sectorsPerTrack: Scalars['Long'];
  serialNum: Scalars['String'];
  size: Scalars['Long'];
  smartStatus: DiskSmartStatus;
  temperature: Scalars['Long'];
  totalCylinders: Scalars['Long'];
  totalHeads: Scalars['Long'];
  totalSectors: Scalars['Long'];
  totalTracks: Scalars['Long'];
  tracksPerCylinder: Scalars['Long'];
  type: Scalars['String'];
  vendor: Scalars['String'];
};

export enum DiskFsType {
  BTRFS = 'btrfs',
  VFAT = 'vfat',
  XFS = 'xfs'
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
  name: Scalars['String'];
  size: Scalars['Long'];
};

export enum DiskSmartStatus {
  OK = 'Ok',
  UNKNOWN = 'Unknown'
}

export type Display = {
  __typename?: 'Display';
  banner?: Maybe<Scalars['String']>;
  case?: Maybe<Case>;
  critical?: Maybe<Scalars['Int']>;
  dashapps?: Maybe<Scalars['String']>;
  date?: Maybe<Scalars['String']>;
  hot?: Maybe<Scalars['Int']>;
  locale?: Maybe<Scalars['String']>;
  max?: Maybe<Scalars['Int']>;
  number?: Maybe<Scalars['String']>;
  resize?: Maybe<Scalars['Boolean']>;
  scale?: Maybe<Scalars['Boolean']>;
  tabs?: Maybe<Scalars['Boolean']>;
  text?: Maybe<Scalars['Boolean']>;
  theme?: Maybe<Theme>;
  total?: Maybe<Scalars['Boolean']>;
  unit?: Maybe<Temperature>;
  usage?: Maybe<Scalars['Boolean']>;
  users?: Maybe<Scalars['String']>;
  warning?: Maybe<Scalars['Int']>;
  wwn?: Maybe<Scalars['Boolean']>;
};

export type DockerContainer = {
  __typename?: 'DockerContainer';
  autoStart: Scalars['Boolean'];
  command: Scalars['String'];
  created: Scalars['Int'];
  hostConfig?: Maybe<ContainerHostConfig>;
  id: Scalars['ID'];
  image: Scalars['String'];
  imageId: Scalars['String'];
  labels?: Maybe<Scalars['JSON']>;
  mounts?: Maybe<Array<Maybe<Scalars['JSON']>>>;
  names?: Maybe<Array<Scalars['String']>>;
  networkSettings?: Maybe<Scalars['JSON']>;
  ports?: Maybe<Array<Maybe<ContainerPort>>>;
  sizeRootFs: Scalars['Int'];
  state?: Maybe<ContainerState>;
  status: Scalars['String'];
};

export type DockerNetwork = {
  __typename?: 'DockerNetwork';
  attachable: Scalars['Boolean'];
  configFrom?: Maybe<Scalars['JSON']>;
  configOnly: Scalars['Boolean'];
  containers?: Maybe<Scalars['JSON']>;
  created?: Maybe<Scalars['String']>;
  driver?: Maybe<Scalars['String']>;
  enableIPv6: Scalars['Boolean'];
  id?: Maybe<Scalars['ID']>;
  ingress: Scalars['Boolean'];
  internal: Scalars['Boolean'];
  ipam?: Maybe<Scalars['JSON']>;
  labels?: Maybe<Scalars['JSON']>;
  name?: Maybe<Scalars['String']>;
  options?: Maybe<Scalars['JSON']>;
  scope?: Maybe<Scalars['String']>;
};

export type EmhttpResponse = {
  __typename?: 'EmhttpResponse';
  mode?: Maybe<Scalars['String']>;
};

export type Flash = {
  __typename?: 'Flash';
  guid?: Maybe<Scalars['String']>;
  product?: Maybe<Scalars['String']>;
  vendor?: Maybe<Scalars['String']>;
};

export type Gpu = {
  __typename?: 'Gpu';
  blacklisted: Scalars['Boolean'];
  class: Scalars['String'];
  id: Scalars['ID'];
  productid: Scalars['String'];
  type: Scalars['String'];
  typeid: Scalars['String'];
  vendorname: Scalars['String'];
};

export enum Importance {
  ALERT = 'alert',
  INFO = 'info',
  WARNING = 'warning'
}

export type Info = {
  __typename?: 'Info';
  /** Count of docker containers */
  apps?: Maybe<InfoApps>;
  baseboard?: Maybe<Baseboard>;
  cpu?: Maybe<InfoCpu>;
  devices?: Maybe<Devices>;
  display?: Maybe<Display>;
  /** Machine ID */
  machineId?: Maybe<Scalars['ID']>;
  memory?: Maybe<InfoMemory>;
  os?: Maybe<Os>;
  system?: Maybe<System>;
  versions?: Maybe<Versions>;
  /** Count of VMs */
  vms?: Maybe<InfoVMs>;
};

export type InfoApps = {
  __typename?: 'InfoApps';
  /** How many docker containers are installed */
  installed?: Maybe<Scalars['Int']>;
  /** How many docker containers are running */
  started?: Maybe<Scalars['Int']>;
};

export type InfoCpu = {
  __typename?: 'InfoCpu';
  brand: Scalars['String'];
  cache: Scalars['JSON'];
  cores: Scalars['Int'];
  family: Scalars['String'];
  flags?: Maybe<Array<Scalars['String']>>;
  manufacturer: Scalars['String'];
  model: Scalars['String'];
  processors: Scalars['Long'];
  revision: Scalars['String'];
  socket: Scalars['String'];
  speed: Scalars['Float'];
  speedmax: Scalars['Float'];
  speedmin: Scalars['Float'];
  stepping: Scalars['Int'];
  threads: Scalars['Int'];
  vendor: Scalars['String'];
  voltage?: Maybe<Scalars['String']>;
};

export type InfoMemory = {
  __typename?: 'InfoMemory';
  active: Scalars['Long'];
  available: Scalars['Long'];
  buffcache: Scalars['Long'];
  free: Scalars['Long'];
  layout?: Maybe<Array<MemoryLayout>>;
  max: Scalars['Long'];
  swapfree: Scalars['Long'];
  swaptotal: Scalars['Long'];
  swapused: Scalars['Long'];
  total: Scalars['Long'];
  used: Scalars['Long'];
};

export type InfoVMs = {
  __typename?: 'InfoVMs';
  /** How many VMs are installed */
  installed?: Maybe<Scalars['Int']>;
  /** How many VMs are running */
  started?: Maybe<Scalars['Int']>;
};

export type KeyFile = {
  __typename?: 'KeyFile';
  contents?: Maybe<Scalars['String']>;
  location?: Maybe<Scalars['String']>;
};

/** The current user */
export type Me = UserAccount & {
  __typename?: 'Me';
  description: Scalars['String'];
  id: Scalars['ID'];
  name: Scalars['String'];
  permissions?: Maybe<Scalars['JSON']>;
  role: Scalars['String'];
};

export enum MemoryFormFactor {
  DIMM = 'DIMM'
}

export type MemoryLayout = {
  __typename?: 'MemoryLayout';
  bank?: Maybe<Scalars['String']>;
  clockSpeed?: Maybe<Scalars['Long']>;
  formFactor?: Maybe<MemoryFormFactor>;
  manufacturer?: Maybe<Scalars['String']>;
  partNum?: Maybe<Scalars['String']>;
  serialNum?: Maybe<Scalars['String']>;
  size: Scalars['Long'];
  type?: Maybe<MemoryType>;
  voltageConfigured?: Maybe<Scalars['Long']>;
  voltageMax?: Maybe<Scalars['Long']>;
  voltageMin?: Maybe<Scalars['Long']>;
};

export enum MemoryType {
  DDR2 = 'DDR2',
  DDR3 = 'DDR3',
  DDR4 = 'DDR4'
}

export type MinigraphqlResponse = {
  __typename?: 'MinigraphqlResponse';
  status: Scalars['String'];
};

export type Mount = {
  __typename?: 'Mount';
  directory?: Maybe<Scalars['String']>;
  name?: Maybe<Scalars['String']>;
  permissions?: Maybe<Scalars['String']>;
  type?: Maybe<Scalars['String']>;
};

export type Mutation = {
  __typename?: 'Mutation';
  /** Create a new API key */
  addApikey?: Maybe<ApiKey>;
  /** Add new disk to array */
  addDiskToArray?: Maybe<ArrayType>;
  /** Add a new permission scope */
  addScope?: Maybe<Scope>;
  /** Add a new permission scope to apiKey */
  addScopeToApiKey?: Maybe<Scope>;
  /** Add a new user */
  addUser?: Maybe<User>;
  /** Cancel parity check */
  cancelParityCheck?: Maybe<Scalars['JSON']>;
  clearArrayDiskStatistics?: Maybe<Scalars['JSON']>;
  /** Delete a user */
  deleteUser?: Maybe<User>;
  /** Get an existing API key */
  getApiKey?: Maybe<ApiKey>;
  login?: Maybe<Scalars['String']>;
  mountArrayDisk?: Maybe<Disk>;
  /** Pause parity check */
  pauseParityCheck?: Maybe<Scalars['JSON']>;
  reboot?: Maybe<Scalars['String']>;
  /** Remove existing disk from array. NOTE: The array must be stopped before running this otherwise it'll throw an error. */
  removeDiskFromArray?: Maybe<ArrayType>;
  /** Resume parity check */
  resumeParityCheck?: Maybe<Scalars['JSON']>;
  sendNotification?: Maybe<Notification>;
  shutdown?: Maybe<Scalars['String']>;
  /** Start array */
  startArray?: Maybe<ArrayType>;
  /** Start parity check */
  startParityCheck?: Maybe<Scalars['JSON']>;
  /** Stop array */
  stopArray?: Maybe<ArrayType>;
  testMutation?: Maybe<Scalars['JSON']>;
  unmountArrayDisk?: Maybe<Disk>;
  /** Update an existing API key */
  updateApikey?: Maybe<ApiKey>;
};


export type MutationaddApikeyArgs = {
  input?: InputMaybe<updateApikeyInput>;
  name: Scalars['String'];
};


export type MutationaddDiskToArrayArgs = {
  input?: InputMaybe<arrayDiskInput>;
};


export type MutationaddScopeArgs = {
  input: addScopeInput;
};


export type MutationaddScopeToApiKeyArgs = {
  input: addScopeToApiKeyInput;
};


export type MutationaddUserArgs = {
  input: addUserInput;
};


export type MutationclearArrayDiskStatisticsArgs = {
  id: Scalars['ID'];
};


export type MutationdeleteUserArgs = {
  input: deleteUserInput;
};


export type MutationgetApiKeyArgs = {
  input?: InputMaybe<authenticateInput>;
  name: Scalars['String'];
};


export type MutationloginArgs = {
  password: Scalars['String'];
  username: Scalars['String'];
};


export type MutationmountArrayDiskArgs = {
  id: Scalars['ID'];
};


export type MutationremoveDiskFromArrayArgs = {
  input?: InputMaybe<arrayDiskInput>;
};


export type MutationsendNotificationArgs = {
  notification: NotificationInput;
};


export type MutationstartParityCheckArgs = {
  correct?: InputMaybe<Scalars['Boolean']>;
};


export type MutationtestMutationArgs = {
  id: Scalars['String'];
  input?: InputMaybe<testMutationInput>;
};


export type MutationunmountArrayDiskArgs = {
  id: Scalars['ID'];
};


export type MutationupdateApikeyArgs = {
  input?: InputMaybe<updateApikeyInput>;
  name: Scalars['String'];
};

export type Network = {
  __typename?: 'Network';
  carrierChanges?: Maybe<Scalars['String']>;
  duplex?: Maybe<Scalars['String']>;
  iface?: Maybe<Scalars['String']>;
  ifaceName?: Maybe<Scalars['String']>;
  internal?: Maybe<Scalars['String']>;
  ipv4?: Maybe<Scalars['String']>;
  ipv6?: Maybe<Scalars['String']>;
  mac?: Maybe<Scalars['String']>;
  mtu?: Maybe<Scalars['String']>;
  operstate?: Maybe<Scalars['String']>;
  speed?: Maybe<Scalars['String']>;
  type?: Maybe<Scalars['String']>;
};

export type Notification = {
  __typename?: 'Notification';
  description: Scalars['String'];
  importance: Importance;
  link: Scalars['String'];
  subject: Scalars['String'];
  title: Scalars['String'];
};

export type NotificationInput = {
  description?: InputMaybe<Scalars['String']>;
  importance: Importance;
  link?: InputMaybe<Scalars['String']>;
  subject?: InputMaybe<Scalars['String']>;
  title?: InputMaybe<Scalars['String']>;
};

export type Os = {
  __typename?: 'Os';
  arch?: Maybe<Scalars['String']>;
  build?: Maybe<Scalars['String']>;
  codename?: Maybe<Scalars['String']>;
  codepage?: Maybe<Scalars['String']>;
  distro?: Maybe<Scalars['String']>;
  hostname?: Maybe<Scalars['String']>;
  kernel?: Maybe<Scalars['String']>;
  logofile?: Maybe<Scalars['String']>;
  platform?: Maybe<Scalars['String']>;
  release?: Maybe<Scalars['String']>;
  serial?: Maybe<Scalars['String']>;
  uptime?: Maybe<Scalars['DateTime']>;
};

export type Owner = {
  __typename?: 'Owner';
  avatar?: Maybe<Scalars['String']>;
  url?: Maybe<Scalars['String']>;
  username?: Maybe<Scalars['String']>;
};

export type ParityCheck = {
  __typename?: 'ParityCheck';
  date: Scalars['String'];
  duration: Scalars['Int'];
  errors: Scalars['String'];
  speed: Scalars['String'];
  status: Scalars['String'];
};

export type Partition = {
  __typename?: 'Partition';
  devlinks?: Maybe<Scalars['String']>;
  devname?: Maybe<Scalars['String']>;
  devpath?: Maybe<Scalars['String']>;
  devtype?: Maybe<Scalars['String']>;
  idAta?: Maybe<Scalars['String']>;
  idAtaDownloadMicrocode?: Maybe<Scalars['String']>;
  idAtaFeatureSetAam?: Maybe<Scalars['String']>;
  idAtaFeatureSetAamCurrentValue?: Maybe<Scalars['String']>;
  idAtaFeatureSetAamEnabled?: Maybe<Scalars['String']>;
  idAtaFeatureSetAamVendorRecommendedValue?: Maybe<Scalars['String']>;
  idAtaFeatureSetApm?: Maybe<Scalars['String']>;
  idAtaFeatureSetApmCurrentValue?: Maybe<Scalars['String']>;
  idAtaFeatureSetApmEnabled?: Maybe<Scalars['String']>;
  idAtaFeatureSetHpa?: Maybe<Scalars['String']>;
  idAtaFeatureSetHpaEnabled?: Maybe<Scalars['String']>;
  idAtaFeatureSetPm?: Maybe<Scalars['String']>;
  idAtaFeatureSetPmEnabled?: Maybe<Scalars['String']>;
  idAtaFeatureSetPuis?: Maybe<Scalars['String']>;
  idAtaFeatureSetPuisEnabled?: Maybe<Scalars['String']>;
  idAtaFeatureSetSecurity?: Maybe<Scalars['String']>;
  idAtaFeatureSetSecurityEnabled?: Maybe<Scalars['String']>;
  idAtaFeatureSetSecurityEnhancedEraseUnitMin?: Maybe<Scalars['String']>;
  idAtaFeatureSetSecurityEraseUnitMin?: Maybe<Scalars['String']>;
  idAtaFeatureSetSmart?: Maybe<Scalars['String']>;
  idAtaFeatureSetSmartEnabled?: Maybe<Scalars['String']>;
  idAtaRotationRateRpm?: Maybe<Scalars['String']>;
  idAtaSata?: Maybe<Scalars['String']>;
  idAtaSataSignalRateGen1?: Maybe<Scalars['String']>;
  idAtaSataSignalRateGen2?: Maybe<Scalars['String']>;
  idAtaWriteCache?: Maybe<Scalars['String']>;
  idAtaWriteCacheEnabled?: Maybe<Scalars['String']>;
  idBus?: Maybe<Scalars['String']>;
  idFsType?: Maybe<Scalars['String']>;
  idFsUsage?: Maybe<Scalars['String']>;
  idFsUuid?: Maybe<Scalars['String']>;
  idFsUuidEnc?: Maybe<Scalars['String']>;
  idModel?: Maybe<Scalars['String']>;
  idModelEnc?: Maybe<Scalars['String']>;
  idPartEntryDisk?: Maybe<Scalars['String']>;
  idPartEntryNumber?: Maybe<Scalars['String']>;
  idPartEntryOffset?: Maybe<Scalars['String']>;
  idPartEntryScheme?: Maybe<Scalars['String']>;
  idPartEntrySize?: Maybe<Scalars['String']>;
  idPartEntryType?: Maybe<Scalars['String']>;
  idPartTableType?: Maybe<Scalars['String']>;
  idPath?: Maybe<Scalars['String']>;
  idPathTag?: Maybe<Scalars['String']>;
  idRevision?: Maybe<Scalars['String']>;
  idSerial?: Maybe<Scalars['String']>;
  idSerialShort?: Maybe<Scalars['String']>;
  idType?: Maybe<Scalars['String']>;
  idWwn?: Maybe<Scalars['String']>;
  idWwnWithExtension?: Maybe<Scalars['String']>;
  major?: Maybe<Scalars['String']>;
  minor?: Maybe<Scalars['String']>;
  partn?: Maybe<Scalars['String']>;
  subsystem?: Maybe<Scalars['String']>;
  usecInitialized?: Maybe<Scalars['String']>;
};

export type Pci = {
  __typename?: 'Pci';
  blacklisted?: Maybe<Scalars['String']>;
  class?: Maybe<Scalars['String']>;
  id: Scalars['ID'];
  productid?: Maybe<Scalars['String']>;
  productname?: Maybe<Scalars['String']>;
  type?: Maybe<Scalars['String']>;
  typeid?: Maybe<Scalars['String']>;
  vendorid?: Maybe<Scalars['String']>;
  vendorname?: Maybe<Scalars['String']>;
};

export type Permissions = {
  __typename?: 'Permissions';
  grants?: Maybe<Scalars['JSON']>;
  scopes?: Maybe<Scalars['JSON']>;
};

export type Query = {
  __typename?: 'Query';
  /** Get all API keys */
  apiKeys?: Maybe<Array<Maybe<ApiKey>>>;
  /** An Unraid array consisting of 1 or 2 Parity disks and a number of Data disks. */
  array?: Maybe<ArrayType>;
  cloud?: Maybe<Cloud>;
  config: Config;
  crashReportingEnabled?: Maybe<Scalars['Boolean']>;
  dashboard?: Maybe<Dashboard>;
  device?: Maybe<Device>;
  devices: Array<Maybe<Device>>;
  /** Single disk */
  disk?: Maybe<Disk>;
  /** Mulitiple disks */
  disks: Array<Maybe<Disk>>;
  display?: Maybe<Display>;
  /** Docker container */
  dockerContainer: DockerContainer;
  /** All Docker containers */
  dockerContainers: Array<Maybe<DockerContainer>>;
  /** Docker network */
  dockerNetwork: DockerNetwork;
  /** All Docker networks */
  dockerNetworks: Array<Maybe<DockerNetwork>>;
  flash?: Maybe<Flash>;
  info?: Maybe<Info>;
  /** Current user account */
  me?: Maybe<Me>;
  online?: Maybe<Scalars['Boolean']>;
  owner?: Maybe<Owner>;
  parityHistory?: Maybe<Array<Maybe<ParityCheck>>>;
  permissions?: Maybe<Permissions>;
  registration?: Maybe<Registration>;
  server?: Maybe<Server>;
  servers?: Maybe<Array<Maybe<Server>>>;
  service?: Maybe<Service>;
  services?: Maybe<Array<Maybe<Service>>>;
  /** Network Shares */
  shares?: Maybe<Array<Maybe<Share>>>;
  testQuery?: Maybe<Scalars['JSON']>;
  twoFactor?: Maybe<TwoFactorWithToken>;
  unassignedDevices?: Maybe<Array<Maybe<UnassignedDevice>>>;
  /** User account */
  user?: Maybe<User>;
  /** User accounts */
  users: Array<User>;
  vars?: Maybe<Vars>;
  /** Virtual network for vms */
  vmNetwork?: Maybe<Scalars['JSON']>;
  /** Virtual machines */
  vms?: Maybe<Vms>;
  welcome?: Maybe<Welcome>;
};


export type QuerydeviceArgs = {
  id: Scalars['ID'];
};


export type QuerydiskArgs = {
  id: Scalars['ID'];
};


export type QuerydockerContainerArgs = {
  id: Scalars['ID'];
};


export type QuerydockerContainersArgs = {
  all?: InputMaybe<Scalars['Boolean']>;
};


export type QuerydockerNetworkArgs = {
  id: Scalars['ID'];
};


export type QuerydockerNetworksArgs = {
  all?: InputMaybe<Scalars['Boolean']>;
};


export type QueryserverArgs = {
  name: Scalars['String'];
};


export type QueryserviceArgs = {
  name: Scalars['String'];
};


export type QuerytestQueryArgs = {
  id: Scalars['String'];
  input?: InputMaybe<testQueryInput>;
};


export type QueryuserArgs = {
  id: Scalars['ID'];
};


export type QueryusersArgs = {
  input?: InputMaybe<usersInput>;
};


export type QueryvmNetworkArgs = {
  name: Scalars['String'];
};

export type Registration = {
  __typename?: 'Registration';
  expiration?: Maybe<Scalars['String']>;
  guid?: Maybe<Scalars['String']>;
  keyFile?: Maybe<KeyFile>;
  state?: Maybe<registrationState>;
  type?: Maybe<registrationType>;
};

export type RelayResponse = {
  __typename?: 'RelayResponse';
  error?: Maybe<Scalars['String']>;
  status: Scalars['String'];
  timeout?: Maybe<Scalars['String']>;
};

/** A permission scope */
export type Scope = {
  __typename?: 'Scope';
  /** A user friendly description */
  description?: Maybe<Scalars['String']>;
  /** A unique name for the scope */
  name?: Maybe<Scalars['String']>;
};

export type Server = {
  __typename?: 'Server';
  apikey?: Maybe<Scalars['String']>;
  guid?: Maybe<Scalars['String']>;
  lanip?: Maybe<Scalars['String']>;
  localurl?: Maybe<Scalars['String']>;
  name?: Maybe<Scalars['String']>;
  owner?: Maybe<Owner>;
  remoteurl?: Maybe<Scalars['String']>;
  status?: Maybe<Status>;
  wanip?: Maybe<Scalars['String']>;
};

export type Service = {
  __typename?: 'Service';
  name: Scalars['String'];
  online?: Maybe<Scalars['Boolean']>;
  uptime?: Maybe<Uptime>;
  version?: Maybe<Scalars['String']>;
};

/** Network Share */
export type Share = {
  __typename?: 'Share';
  allocator?: Maybe<Scalars['String']>;
  cache?: Maybe<Scalars['Boolean']>;
  color?: Maybe<Scalars['String']>;
  /** User comment */
  comment?: Maybe<Scalars['String']>;
  cow?: Maybe<Scalars['String']>;
  /** Disks that're excluded from this share */
  exclude?: Maybe<Array<Maybe<Scalars['String']>>>;
  floor?: Maybe<Scalars['String']>;
  /** Free space in bytes */
  free?: Maybe<Scalars['Int']>;
  /** Disks that're included in this share */
  include?: Maybe<Array<Maybe<Scalars['String']>>>;
  luksStatus?: Maybe<Scalars['String']>;
  /** Display name */
  name?: Maybe<Scalars['String']>;
  nameOrig?: Maybe<Scalars['String']>;
  /** Total size in bytes */
  size?: Maybe<Scalars['Int']>;
  splitLevel?: Maybe<Scalars['String']>;
};

export enum Status {
  NEVER_CONNECTED = 'never_connected',
  OFFLINE = 'offline',
  ONLINE = 'online'
}

export type Subscription = {
  __typename?: 'Subscription';
  apikeys?: Maybe<Array<Maybe<ApiKey>>>;
  array: ArrayType;
  config: Config;
  crashReportingEnabled: Scalars['Boolean'];
  dashboard?: Maybe<Dashboard>;
  device: Device;
  devices?: Maybe<Array<Device>>;
  display?: Maybe<Display>;
  dockerContainer: DockerContainer;
  dockerContainers?: Maybe<Array<Maybe<DockerContainer>>>;
  dockerNetwork: DockerNetwork;
  dockerNetworks: Array<Maybe<DockerNetwork>>;
  flash: Flash;
  info: Info;
  me?: Maybe<Me>;
  online: Scalars['Boolean'];
  owner: Owner;
  parityHistory: ParityCheck;
  ping: Scalars['String'];
  registration: Registration;
  server: Server;
  servers?: Maybe<Array<Server>>;
  service?: Maybe<Array<Service>>;
  services?: Maybe<Array<Service>>;
  share: Share;
  shares?: Maybe<Array<Share>>;
  testSubscription: Scalars['String'];
  twoFactor?: Maybe<TwoFactorWithoutToken>;
  unassignedDevices?: Maybe<Array<UnassignedDevice>>;
  user: User;
  users: Array<Maybe<User>>;
  vars: Vars;
  vmNetworks?: Maybe<Array<VmNetwork>>;
  vms?: Maybe<Vms>;
};


export type SubscriptiondeviceArgs = {
  id: Scalars['ID'];
};


export type SubscriptiondockerContainerArgs = {
  id: Scalars['ID'];
};


export type SubscriptiondockerNetworkArgs = {
  id: Scalars['ID'];
};


export type SubscriptionserverArgs = {
  name: Scalars['String'];
};


export type SubscriptionserviceArgs = {
  name: Scalars['String'];
};


export type SubscriptionshareArgs = {
  id: Scalars['ID'];
};


export type SubscriptionuserArgs = {
  id: Scalars['ID'];
};

export type System = {
  __typename?: 'System';
  manufacturer?: Maybe<Scalars['String']>;
  model?: Maybe<Scalars['String']>;
  serial?: Maybe<Scalars['String']>;
  sku?: Maybe<Scalars['String']>;
  uuid?: Maybe<Scalars['String']>;
  version?: Maybe<Scalars['String']>;
};

export enum Temperature {
  C = 'C',
  F = 'F'
}

export enum Theme {
  WHITE = 'white'
}

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

export type UnassignedDevice = {
  __typename?: 'UnassignedDevice';
  devlinks?: Maybe<Scalars['String']>;
  devname?: Maybe<Scalars['String']>;
  devpath?: Maybe<Scalars['String']>;
  devtype?: Maybe<Scalars['String']>;
  idAta?: Maybe<Scalars['String']>;
  idAtaDownloadMicrocode?: Maybe<Scalars['String']>;
  idAtaFeatureSetAam?: Maybe<Scalars['String']>;
  idAtaFeatureSetAamCurrentValue?: Maybe<Scalars['String']>;
  idAtaFeatureSetAamEnabled?: Maybe<Scalars['String']>;
  idAtaFeatureSetAamVendorRecommendedValue?: Maybe<Scalars['String']>;
  idAtaFeatureSetApm?: Maybe<Scalars['String']>;
  idAtaFeatureSetApmCurrentValue?: Maybe<Scalars['String']>;
  idAtaFeatureSetApmEnabled?: Maybe<Scalars['String']>;
  idAtaFeatureSetHpa?: Maybe<Scalars['String']>;
  idAtaFeatureSetHpaEnabled?: Maybe<Scalars['String']>;
  idAtaFeatureSetPm?: Maybe<Scalars['String']>;
  idAtaFeatureSetPmEnabled?: Maybe<Scalars['String']>;
  idAtaFeatureSetPuis?: Maybe<Scalars['String']>;
  idAtaFeatureSetPuisEnabled?: Maybe<Scalars['String']>;
  idAtaFeatureSetSecurity?: Maybe<Scalars['String']>;
  idAtaFeatureSetSecurityEnabled?: Maybe<Scalars['String']>;
  idAtaFeatureSetSecurityEnhancedEraseUnitMin?: Maybe<Scalars['String']>;
  idAtaFeatureSetSecurityEraseUnitMin?: Maybe<Scalars['String']>;
  idAtaFeatureSetSmart?: Maybe<Scalars['String']>;
  idAtaFeatureSetSmartEnabled?: Maybe<Scalars['String']>;
  idAtaRotationRateRpm?: Maybe<Scalars['String']>;
  idAtaSata?: Maybe<Scalars['String']>;
  idAtaSataSignalRateGen1?: Maybe<Scalars['String']>;
  idAtaSataSignalRateGen2?: Maybe<Scalars['String']>;
  idAtaWriteCache?: Maybe<Scalars['String']>;
  idAtaWriteCacheEnabled?: Maybe<Scalars['String']>;
  idBus?: Maybe<Scalars['String']>;
  idModel?: Maybe<Scalars['String']>;
  idModelEnc?: Maybe<Scalars['String']>;
  idPartTableType?: Maybe<Scalars['String']>;
  idPath?: Maybe<Scalars['String']>;
  idPathTag?: Maybe<Scalars['String']>;
  idRevision?: Maybe<Scalars['String']>;
  idSerial?: Maybe<Scalars['String']>;
  idSerialShort?: Maybe<Scalars['String']>;
  idType?: Maybe<Scalars['String']>;
  idWwn?: Maybe<Scalars['String']>;
  idWwnWithExtension?: Maybe<Scalars['String']>;
  major?: Maybe<Scalars['String']>;
  minor?: Maybe<Scalars['String']>;
  mount?: Maybe<Mount>;
  mounted?: Maybe<Scalars['Boolean']>;
  name?: Maybe<Scalars['String']>;
  partitions?: Maybe<Array<Maybe<Partition>>>;
  subsystem?: Maybe<Scalars['String']>;
  temp?: Maybe<Scalars['Int']>;
  usecInitialized?: Maybe<Scalars['String']>;
};

export type Uptime = {
  __typename?: 'Uptime';
  seconds?: Maybe<Scalars['Int']>;
  timestamp?: Maybe<Scalars['DateTime']>;
};

export type Usb = {
  __typename?: 'Usb';
  id: Scalars['ID'];
  name?: Maybe<Scalars['String']>;
};

/** A local user account */
export type User = UserAccount & {
  __typename?: 'User';
  description: Scalars['String'];
  id: Scalars['ID'];
  /** A unique name for the user */
  name: Scalars['String'];
  /** If the account has a password set */
  password?: Maybe<Scalars['Boolean']>;
  role: Scalars['String'];
};

export type UserAccount = {
  description: Scalars['String'];
  id: Scalars['ID'];
  name: Scalars['String'];
  role: Scalars['String'];
};

export type Vars = {
  __typename?: 'Vars';
  bindMgt?: Maybe<Scalars['Boolean']>;
  cacheNumDevices?: Maybe<Scalars['Int']>;
  cacheSbNumDisks?: Maybe<Scalars['Int']>;
  comment?: Maybe<Scalars['String']>;
  configError?: Maybe<ConfigErrorState>;
  configValid?: Maybe<Scalars['Boolean']>;
  csrfToken?: Maybe<Scalars['String']>;
  defaultFormat?: Maybe<Scalars['String']>;
  defaultFsType?: Maybe<Scalars['String']>;
  deviceCount?: Maybe<Scalars['Int']>;
  domain?: Maybe<Scalars['String']>;
  domainLogin?: Maybe<Scalars['String']>;
  domainShort?: Maybe<Scalars['String']>;
  enableFruit?: Maybe<Scalars['String']>;
  flashGuid?: Maybe<Scalars['String']>;
  flashProduct?: Maybe<Scalars['String']>;
  flashVendor?: Maybe<Scalars['String']>;
  /** Percentage from 0 - 100 while upgrading a disk or swapping parity drives */
  fsCopyPrcnt?: Maybe<Scalars['Int']>;
  fsNumMounted?: Maybe<Scalars['Int']>;
  fsNumUnmountable?: Maybe<Scalars['Int']>;
  /** Human friendly string of array events happening */
  fsProgress?: Maybe<Scalars['String']>;
  fsState?: Maybe<Scalars['String']>;
  fsUnmountableMask?: Maybe<Scalars['String']>;
  fuseDirectio?: Maybe<Scalars['String']>;
  fuseDirectioDefault?: Maybe<Scalars['String']>;
  fuseDirectioStatus?: Maybe<Scalars['String']>;
  fuseRemember?: Maybe<Scalars['String']>;
  fuseRememberDefault?: Maybe<Scalars['String']>;
  fuseRememberStatus?: Maybe<Scalars['String']>;
  hideDotFiles?: Maybe<Scalars['Boolean']>;
  joinStatus?: Maybe<Scalars['String']>;
  localMaster?: Maybe<Scalars['Boolean']>;
  localTld?: Maybe<Scalars['String']>;
  luksKeyfile?: Maybe<Scalars['String']>;
  maxArraysz?: Maybe<Scalars['Int']>;
  maxCachesz?: Maybe<Scalars['Int']>;
  mdColor?: Maybe<Scalars['String']>;
  mdNumDisabled?: Maybe<Scalars['Int']>;
  mdNumDisks?: Maybe<Scalars['Int']>;
  mdNumErased?: Maybe<Scalars['Int']>;
  mdNumInvalid?: Maybe<Scalars['Int']>;
  mdNumMissing?: Maybe<Scalars['Int']>;
  mdNumNew?: Maybe<Scalars['Int']>;
  mdNumStripes?: Maybe<Scalars['Int']>;
  mdNumStripesDefault?: Maybe<Scalars['Int']>;
  mdNumStripesStatus?: Maybe<Scalars['String']>;
  mdResync?: Maybe<Scalars['Int']>;
  mdResyncAction?: Maybe<Scalars['String']>;
  mdResyncCorr?: Maybe<Scalars['String']>;
  mdResyncDb?: Maybe<Scalars['String']>;
  mdResyncDt?: Maybe<Scalars['String']>;
  mdResyncPos?: Maybe<Scalars['String']>;
  mdResyncSize?: Maybe<Scalars['Int']>;
  mdState?: Maybe<Scalars['String']>;
  mdSyncThresh?: Maybe<Scalars['Int']>;
  mdSyncThreshDefault?: Maybe<Scalars['Int']>;
  mdSyncThreshStatus?: Maybe<Scalars['String']>;
  mdSyncWindow?: Maybe<Scalars['Int']>;
  mdSyncWindowDefault?: Maybe<Scalars['Int']>;
  mdSyncWindowStatus?: Maybe<Scalars['String']>;
  mdVersion?: Maybe<Scalars['String']>;
  mdWriteMethod?: Maybe<Scalars['Int']>;
  mdWriteMethodDefault?: Maybe<Scalars['String']>;
  mdWriteMethodStatus?: Maybe<Scalars['String']>;
  /** Machine hostname */
  name?: Maybe<Scalars['String']>;
  nrRequests?: Maybe<Scalars['Int']>;
  nrRequestsDefault?: Maybe<Scalars['Int']>;
  nrRequestsStatus?: Maybe<Scalars['String']>;
  /** NTP Server 1 */
  ntpServer1?: Maybe<Scalars['String']>;
  /** NTP Server 2 */
  ntpServer2?: Maybe<Scalars['String']>;
  /** NTP Server 3 */
  ntpServer3?: Maybe<Scalars['String']>;
  /** NTP Server 4 */
  ntpServer4?: Maybe<Scalars['String']>;
  pollAttributes?: Maybe<Scalars['String']>;
  pollAttributesDefault?: Maybe<Scalars['String']>;
  pollAttributesStatus?: Maybe<Scalars['String']>;
  /** Port for the webui via HTTP */
  port?: Maybe<Scalars['Int']>;
  portssh?: Maybe<Scalars['Int']>;
  /** Port for the webui via HTTPS */
  portssl?: Maybe<Scalars['Int']>;
  porttelnet?: Maybe<Scalars['Int']>;
  queueDepth?: Maybe<Scalars['String']>;
  regCheck?: Maybe<Scalars['String']>;
  regFile?: Maybe<Scalars['String']>;
  regGen?: Maybe<Scalars['String']>;
  regGuid?: Maybe<Scalars['String']>;
  regState?: Maybe<registrationState>;
  regTm?: Maybe<Scalars['String']>;
  regTm2?: Maybe<Scalars['String']>;
  /** Registration owner */
  regTo?: Maybe<Scalars['String']>;
  /** Registration type */
  regTy?: Maybe<registrationType>;
  safeMode?: Maybe<Scalars['Boolean']>;
  sbClean?: Maybe<Scalars['Boolean']>;
  sbEvents?: Maybe<Scalars['Int']>;
  sbName?: Maybe<Scalars['String']>;
  sbNumDisks?: Maybe<Scalars['Int']>;
  sbState?: Maybe<Scalars['String']>;
  sbSyncErrs?: Maybe<Scalars['Int']>;
  sbSyncExit?: Maybe<Scalars['String']>;
  sbSynced?: Maybe<Scalars['Int']>;
  sbSynced2?: Maybe<Scalars['Int']>;
  sbUpdated?: Maybe<Scalars['String']>;
  sbVersion?: Maybe<Scalars['String']>;
  security?: Maybe<Scalars['String']>;
  /** Total amount shares with AFP enabled */
  shareAfpCount?: Maybe<Scalars['Int']>;
  shareAfpEnabled?: Maybe<Scalars['Boolean']>;
  shareAvahiAfpModel?: Maybe<Scalars['String']>;
  shareAvahiAfpName?: Maybe<Scalars['String']>;
  shareAvahiEnabled?: Maybe<Scalars['Boolean']>;
  shareAvahiSmbModel?: Maybe<Scalars['String']>;
  shareAvahiSmbName?: Maybe<Scalars['String']>;
  shareCacheEnabled?: Maybe<Scalars['Boolean']>;
  shareCacheFloor?: Maybe<Scalars['String']>;
  /** Total amount of user shares */
  shareCount?: Maybe<Scalars['Int']>;
  shareDisk?: Maybe<Scalars['String']>;
  shareInitialGroup?: Maybe<Scalars['String']>;
  shareInitialOwner?: Maybe<Scalars['String']>;
  shareMoverActive?: Maybe<Scalars['Boolean']>;
  shareMoverLogging?: Maybe<Scalars['Boolean']>;
  shareMoverSchedule?: Maybe<Scalars['String']>;
  /** Total amount shares with NFS enabled */
  shareNfsCount?: Maybe<Scalars['Int']>;
  shareNfsEnabled?: Maybe<Scalars['Boolean']>;
  /** Total amount shares with SMB enabled */
  shareSmbCount?: Maybe<Scalars['Int']>;
  shareSmbEnabled?: Maybe<Scalars['Boolean']>;
  shareUser?: Maybe<Scalars['String']>;
  shareUserExclude?: Maybe<Scalars['String']>;
  shareUserInclude?: Maybe<Scalars['String']>;
  shutdownTimeout?: Maybe<Scalars['Int']>;
  spindownDelay?: Maybe<Scalars['String']>;
  spinupGroups?: Maybe<Scalars['Boolean']>;
  startArray?: Maybe<Scalars['Boolean']>;
  startMode?: Maybe<Scalars['String']>;
  startPage?: Maybe<Scalars['String']>;
  sysArraySlots?: Maybe<Scalars['Int']>;
  sysCacheSlots?: Maybe<Scalars['Int']>;
  sysFlashSlots?: Maybe<Scalars['Int']>;
  sysModel?: Maybe<Scalars['String']>;
  timeZone?: Maybe<Scalars['String']>;
  /** Should a NTP server be used for time sync? */
  useNtp?: Maybe<Scalars['Boolean']>;
  useSsh?: Maybe<Scalars['Boolean']>;
  useSsl?: Maybe<Scalars['Boolean']>;
  /** Should telnet be enabled? */
  useTelnet?: Maybe<Scalars['Boolean']>;
  /** Unraid version */
  version?: Maybe<Scalars['String']>;
  workgroup?: Maybe<Scalars['String']>;
};

export type Versions = {
  __typename?: 'Versions';
  apache?: Maybe<Scalars['String']>;
  docker?: Maybe<Scalars['String']>;
  gcc?: Maybe<Scalars['String']>;
  git?: Maybe<Scalars['String']>;
  grunt?: Maybe<Scalars['String']>;
  gulp?: Maybe<Scalars['String']>;
  kernel?: Maybe<Scalars['String']>;
  mongodb?: Maybe<Scalars['String']>;
  mysql?: Maybe<Scalars['String']>;
  nginx?: Maybe<Scalars['String']>;
  node?: Maybe<Scalars['String']>;
  npm?: Maybe<Scalars['String']>;
  openssl?: Maybe<Scalars['String']>;
  perl?: Maybe<Scalars['String']>;
  php?: Maybe<Scalars['String']>;
  pm2?: Maybe<Scalars['String']>;
  postfix?: Maybe<Scalars['String']>;
  postgresql?: Maybe<Scalars['String']>;
  python?: Maybe<Scalars['String']>;
  redis?: Maybe<Scalars['String']>;
  systemOpenssl?: Maybe<Scalars['String']>;
  systemOpensslLib?: Maybe<Scalars['String']>;
  tsc?: Maybe<Scalars['String']>;
  unraid?: Maybe<Scalars['String']>;
  v8?: Maybe<Scalars['String']>;
  yarn?: Maybe<Scalars['String']>;
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

export type VmNetwork = {
  __typename?: 'VmNetwork';
  _placeholderType?: Maybe<Scalars['String']>;
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

export type Welcome = {
  __typename?: 'Welcome';
  message: Scalars['String'];
};

export type addApiKeyInput = {
  key?: InputMaybe<Scalars['String']>;
  name?: InputMaybe<Scalars['String']>;
  userId?: InputMaybe<Scalars['String']>;
};

export type addScopeInput = {
  /** Scope description */
  description?: InputMaybe<Scalars['String']>;
  /** Scope name */
  name: Scalars['String'];
};

export type addScopeToApiKeyInput = {
  apiKey: Scalars['String'];
  /** Scope name */
  name: Scalars['String'];
};

export type addUserInput = {
  description?: InputMaybe<Scalars['String']>;
  name: Scalars['String'];
  password: Scalars['String'];
};

export type arrayDiskInput = {
  /** Disk ID */
  id: Scalars['ID'];
  /** The slot for the disk */
  slot?: InputMaybe<Scalars['Int']>;
};

export type authenticateInput = {
  password: Scalars['String'];
};

export type deleteUserInput = {
  name: Scalars['String'];
};

export enum mdState {
  STARTED = 'STARTED',
  SWAP_DSBL = 'SWAP_DSBL'
}

export enum registrationState {
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

export enum registrationType {
  /** Basic */
  BASIC = 'BASIC',
  /** Invalid */
  INVALID = 'INVALID',
  /** Plus */
  PLUS = 'PLUS',
  /** Pro */
  PRO = 'PRO',
  /** Trial */
  TRIAL = 'TRIAL'
}

export type testMutationInput = {
  state: Scalars['String'];
};

export type testQueryInput = {
  optional?: InputMaybe<Scalars['Boolean']>;
  state: Scalars['String'];
};

export type updateApikeyInput = {
  description?: InputMaybe<Scalars['String']>;
  expiresAt: Scalars['Long'];
};

export type usersInput = {
  slim?: InputMaybe<Scalars['Boolean']>;
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

/** Mapping between all available schema types and the resolvers types */
export type ResolversTypes = ResolversObject<{
  ApiKey: ResolverTypeWrapper<ApiKey>;
  ApiKeyResponse: ResolverTypeWrapper<ApiKeyResponse>;
  Array: ResolverTypeWrapper<ArrayType>;
  ArrayCapacity: ResolverTypeWrapper<ArrayCapacity>;
  ArrayDataDisk: ResolverTypeWrapper<ArrayDataDisk>;
  ArrayDiskFsColor: ArrayDiskFsColor;
  ArrayDiskStatus: ArrayDiskStatus;
  ArrayDiskType: ArrayDiskType;
  ArrayPendingState: ArrayPendingState;
  ArrayState: ArrayState;
  Baseboard: ResolverTypeWrapper<Baseboard>;
  Boolean: ResolverTypeWrapper<Scalars['Boolean']>;
  Capacity: ResolverTypeWrapper<Capacity>;
  Case: ResolverTypeWrapper<Case>;
  Cloud: ResolverTypeWrapper<Cloud>;
  CloudResponse: ResolverTypeWrapper<CloudResponse>;
  Config: ResolverTypeWrapper<Config>;
  ConfigErrorState: ConfigErrorState;
  ContainerHostConfig: ResolverTypeWrapper<ContainerHostConfig>;
  ContainerMount: ResolverTypeWrapper<ContainerMount>;
  ContainerPort: ResolverTypeWrapper<ContainerPort>;
  ContainerPortType: ContainerPortType;
  ContainerState: ContainerState;
  Dashboard: ResolverTypeWrapper<Dashboard>;
  DashboardApps: ResolverTypeWrapper<DashboardApps>;
  DashboardArray: ResolverTypeWrapper<DashboardArray>;
  DashboardCase: ResolverTypeWrapper<DashboardCase>;
  DashboardConfig: ResolverTypeWrapper<DashboardConfig>;
  DashboardDisplay: ResolverTypeWrapper<DashboardDisplay>;
  DashboardOs: ResolverTypeWrapper<DashboardOs>;
  DashboardService: ResolverTypeWrapper<DashboardService>;
  DashboardServiceUptime: ResolverTypeWrapper<DashboardServiceUptime>;
  DashboardTwoFactor: ResolverTypeWrapper<DashboardTwoFactor>;
  DashboardTwoFactorLocal: ResolverTypeWrapper<DashboardTwoFactorLocal>;
  DashboardTwoFactorRemote: ResolverTypeWrapper<DashboardTwoFactorRemote>;
  DashboardVars: ResolverTypeWrapper<DashboardVars>;
  DashboardVersions: ResolverTypeWrapper<DashboardVersions>;
  DashboardVms: ResolverTypeWrapper<DashboardVms>;
  DateTime: ResolverTypeWrapper<Scalars['DateTime']>;
  Device: ResolverTypeWrapper<Device>;
  Devices: ResolverTypeWrapper<Devices>;
  Disk: ResolverTypeWrapper<Disk>;
  DiskFsType: DiskFsType;
  DiskInterfaceType: DiskInterfaceType;
  DiskPartition: ResolverTypeWrapper<DiskPartition>;
  DiskSmartStatus: DiskSmartStatus;
  Display: ResolverTypeWrapper<Display>;
  DockerContainer: ResolverTypeWrapper<DockerContainer>;
  DockerNetwork: ResolverTypeWrapper<DockerNetwork>;
  EmhttpResponse: ResolverTypeWrapper<EmhttpResponse>;
  Flash: ResolverTypeWrapper<Flash>;
  Float: ResolverTypeWrapper<Scalars['Float']>;
  Gpu: ResolverTypeWrapper<Gpu>;
  ID: ResolverTypeWrapper<Scalars['ID']>;
  Importance: Importance;
  Info: ResolverTypeWrapper<Info>;
  InfoApps: ResolverTypeWrapper<InfoApps>;
  InfoCpu: ResolverTypeWrapper<InfoCpu>;
  InfoMemory: ResolverTypeWrapper<InfoMemory>;
  InfoVMs: ResolverTypeWrapper<InfoVMs>;
  Int: ResolverTypeWrapper<Scalars['Int']>;
  JSON: ResolverTypeWrapper<Scalars['JSON']>;
  KeyFile: ResolverTypeWrapper<KeyFile>;
  Long: ResolverTypeWrapper<Scalars['Long']>;
  Me: ResolverTypeWrapper<Me>;
  MemoryFormFactor: MemoryFormFactor;
  MemoryLayout: ResolverTypeWrapper<MemoryLayout>;
  MemoryType: MemoryType;
  MinigraphqlResponse: ResolverTypeWrapper<MinigraphqlResponse>;
  Mount: ResolverTypeWrapper<Mount>;
  Mutation: ResolverTypeWrapper<{}>;
  Network: ResolverTypeWrapper<Network>;
  Notification: ResolverTypeWrapper<Notification>;
  NotificationInput: NotificationInput;
  Os: ResolverTypeWrapper<Os>;
  Owner: ResolverTypeWrapper<Owner>;
  ParityCheck: ResolverTypeWrapper<ParityCheck>;
  Partition: ResolverTypeWrapper<Partition>;
  Pci: ResolverTypeWrapper<Pci>;
  Permissions: ResolverTypeWrapper<Permissions>;
  Query: ResolverTypeWrapper<{}>;
  Registration: ResolverTypeWrapper<Registration>;
  RelayResponse: ResolverTypeWrapper<RelayResponse>;
  Scope: ResolverTypeWrapper<Scope>;
  Server: ResolverTypeWrapper<Server>;
  Service: ResolverTypeWrapper<Service>;
  Share: ResolverTypeWrapper<Share>;
  Status: Status;
  String: ResolverTypeWrapper<Scalars['String']>;
  Subscription: ResolverTypeWrapper<{}>;
  System: ResolverTypeWrapper<System>;
  Temperature: Temperature;
  Theme: Theme;
  TwoFactorLocal: ResolverTypeWrapper<TwoFactorLocal>;
  TwoFactorRemote: ResolverTypeWrapper<TwoFactorRemote>;
  TwoFactorWithToken: ResolverTypeWrapper<TwoFactorWithToken>;
  TwoFactorWithoutToken: ResolverTypeWrapper<TwoFactorWithoutToken>;
  UUID: ResolverTypeWrapper<Scalars['UUID']>;
  UnassignedDevice: ResolverTypeWrapper<UnassignedDevice>;
  Uptime: ResolverTypeWrapper<Uptime>;
  Usb: ResolverTypeWrapper<Usb>;
  User: ResolverTypeWrapper<User>;
  UserAccount: ResolversTypes['Me'] | ResolversTypes['User'];
  Vars: ResolverTypeWrapper<Vars>;
  Versions: ResolverTypeWrapper<Versions>;
  VmDomain: ResolverTypeWrapper<VmDomain>;
  VmNetwork: ResolverTypeWrapper<VmNetwork>;
  VmState: VmState;
  Vms: ResolverTypeWrapper<Vms>;
  Welcome: ResolverTypeWrapper<Welcome>;
  addApiKeyInput: addApiKeyInput;
  addScopeInput: addScopeInput;
  addScopeToApiKeyInput: addScopeToApiKeyInput;
  addUserInput: addUserInput;
  arrayDiskInput: arrayDiskInput;
  authenticateInput: authenticateInput;
  deleteUserInput: deleteUserInput;
  mdState: mdState;
  registrationState: registrationState;
  registrationType: registrationType;
  testMutationInput: testMutationInput;
  testQueryInput: testQueryInput;
  updateApikeyInput: updateApikeyInput;
  usersInput: usersInput;
}>;

/** Mapping between all available schema types and the resolvers parents */
export type ResolversParentTypes = ResolversObject<{
  ApiKey: ApiKey;
  ApiKeyResponse: ApiKeyResponse;
  Array: ArrayType;
  ArrayCapacity: ArrayCapacity;
  ArrayDataDisk: ArrayDataDisk;
  Baseboard: Baseboard;
  Boolean: Scalars['Boolean'];
  Capacity: Capacity;
  Case: Case;
  Cloud: Cloud;
  CloudResponse: CloudResponse;
  Config: Config;
  ContainerHostConfig: ContainerHostConfig;
  ContainerMount: ContainerMount;
  ContainerPort: ContainerPort;
  Dashboard: Dashboard;
  DashboardApps: DashboardApps;
  DashboardArray: DashboardArray;
  DashboardCase: DashboardCase;
  DashboardConfig: DashboardConfig;
  DashboardDisplay: DashboardDisplay;
  DashboardOs: DashboardOs;
  DashboardService: DashboardService;
  DashboardServiceUptime: DashboardServiceUptime;
  DashboardTwoFactor: DashboardTwoFactor;
  DashboardTwoFactorLocal: DashboardTwoFactorLocal;
  DashboardTwoFactorRemote: DashboardTwoFactorRemote;
  DashboardVars: DashboardVars;
  DashboardVersions: DashboardVersions;
  DashboardVms: DashboardVms;
  DateTime: Scalars['DateTime'];
  Device: Device;
  Devices: Devices;
  Disk: Disk;
  DiskPartition: DiskPartition;
  Display: Display;
  DockerContainer: DockerContainer;
  DockerNetwork: DockerNetwork;
  EmhttpResponse: EmhttpResponse;
  Flash: Flash;
  Float: Scalars['Float'];
  Gpu: Gpu;
  ID: Scalars['ID'];
  Info: Info;
  InfoApps: InfoApps;
  InfoCpu: InfoCpu;
  InfoMemory: InfoMemory;
  InfoVMs: InfoVMs;
  Int: Scalars['Int'];
  JSON: Scalars['JSON'];
  KeyFile: KeyFile;
  Long: Scalars['Long'];
  Me: Me;
  MemoryLayout: MemoryLayout;
  MinigraphqlResponse: MinigraphqlResponse;
  Mount: Mount;
  Mutation: {};
  Network: Network;
  Notification: Notification;
  NotificationInput: NotificationInput;
  Os: Os;
  Owner: Owner;
  ParityCheck: ParityCheck;
  Partition: Partition;
  Pci: Pci;
  Permissions: Permissions;
  Query: {};
  Registration: Registration;
  RelayResponse: RelayResponse;
  Scope: Scope;
  Server: Server;
  Service: Service;
  Share: Share;
  String: Scalars['String'];
  Subscription: {};
  System: System;
  TwoFactorLocal: TwoFactorLocal;
  TwoFactorRemote: TwoFactorRemote;
  TwoFactorWithToken: TwoFactorWithToken;
  TwoFactorWithoutToken: TwoFactorWithoutToken;
  UUID: Scalars['UUID'];
  UnassignedDevice: UnassignedDevice;
  Uptime: Uptime;
  Usb: Usb;
  User: User;
  UserAccount: ResolversParentTypes['Me'] | ResolversParentTypes['User'];
  Vars: Vars;
  Versions: Versions;
  VmDomain: VmDomain;
  VmNetwork: VmNetwork;
  Vms: Vms;
  Welcome: Welcome;
  addApiKeyInput: addApiKeyInput;
  addScopeInput: addScopeInput;
  addScopeToApiKeyInput: addScopeToApiKeyInput;
  addUserInput: addUserInput;
  arrayDiskInput: arrayDiskInput;
  authenticateInput: authenticateInput;
  deleteUserInput: deleteUserInput;
  testMutationInput: testMutationInput;
  testQueryInput: testQueryInput;
  updateApikeyInput: updateApikeyInput;
  usersInput: usersInput;
}>;

export type subscriptionDirectiveArgs = {
  channel: Scalars['String'];
};

export type subscriptionDirectiveResolver<Result, Parent, ContextType = Context, Args = subscriptionDirectiveArgs> = DirectiveResolverFn<Result, Parent, ContextType, Args>;

export type ApiKeyResolvers<ContextType = Context, ParentType extends ResolversParentTypes['ApiKey'] = ResolversParentTypes['ApiKey']> = ResolversObject<{
  description?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  expiresAt?: Resolver<ResolversTypes['Long'], ParentType, ContextType>;
  key?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  scopes?: Resolver<ResolversTypes['JSON'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type ApiKeyResponseResolvers<ContextType = Context, ParentType extends ResolversParentTypes['ApiKeyResponse'] = ResolversParentTypes['ApiKeyResponse']> = ResolversObject<{
  error?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  valid?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type ArrayResolvers<ContextType = Context, ParentType extends ResolversParentTypes['Array'] = ResolversParentTypes['Array']> = ResolversObject<{
  boot?: Resolver<Maybe<ResolversTypes['ArrayDataDisk']>, ParentType, ContextType>;
  caches?: Resolver<Maybe<Array<Maybe<ResolversTypes['ArrayDataDisk']>>>, ParentType, ContextType>;
  capacity?: Resolver<ResolversTypes['ArrayCapacity'], ParentType, ContextType>;
  disks?: Resolver<Maybe<Array<Maybe<ResolversTypes['ArrayDataDisk']>>>, ParentType, ContextType>;
  parities?: Resolver<Maybe<Array<Maybe<ResolversTypes['ArrayDataDisk']>>>, ParentType, ContextType>;
  pendingState?: Resolver<Maybe<ResolversTypes['ArrayPendingState']>, ParentType, ContextType>;
  previousState?: Resolver<Maybe<ResolversTypes['ArrayState']>, ParentType, ContextType>;
  state?: Resolver<ResolversTypes['ArrayState'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type ArrayCapacityResolvers<ContextType = Context, ParentType extends ResolversParentTypes['ArrayCapacity'] = ResolversParentTypes['ArrayCapacity']> = ResolversObject<{
  bytes?: Resolver<Maybe<ResolversTypes['Capacity']>, ParentType, ContextType>;
  disks?: Resolver<Maybe<ResolversTypes['Capacity']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type ArrayDataDiskResolvers<ContextType = Context, ParentType extends ResolversParentTypes['ArrayDataDisk'] = ResolversParentTypes['ArrayDataDisk']> = ResolversObject<{
  color?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  comment?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  device?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  deviceSb?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  exportable?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  format?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  fsColor?: Resolver<Maybe<ResolversTypes['ArrayDiskFsColor']>, ParentType, ContextType>;
  fsFree?: Resolver<Maybe<ResolversTypes['Long']>, ParentType, ContextType>;
  fsSize?: Resolver<Maybe<ResolversTypes['Long']>, ParentType, ContextType>;
  fsStatus?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  fsType?: Resolver<Maybe<ResolversTypes['DiskFsType']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  idSb?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  luksState?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  numErrors?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  numReads?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  numWrites?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  rotational?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  size?: Resolver<ResolversTypes['Long'], ParentType, ContextType>;
  sizeSb?: Resolver<Maybe<ResolversTypes['Long']>, ParentType, ContextType>;
  slot?: Resolver<ResolversTypes['Long'], ParentType, ContextType>;
  spindownDelay?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  spinupGroup?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  status?: Resolver<ResolversTypes['ArrayDiskStatus'], ParentType, ContextType>;
  temp?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  type?: Resolver<ResolversTypes['ArrayDiskType'], ParentType, ContextType>;
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
  free?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  total?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  used?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
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
  allowedOrigins?: Resolver<Maybe<Array<Maybe<ResolversTypes['String']>>>, ParentType, ContextType>;
  apiKey?: Resolver<Maybe<ResolversTypes['ApiKeyResponse']>, ParentType, ContextType>;
  cloud?: Resolver<Maybe<ResolversTypes['CloudResponse']>, ParentType, ContextType>;
  emhttp?: Resolver<Maybe<ResolversTypes['EmhttpResponse']>, ParentType, ContextType>;
  error?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  minigraphql?: Resolver<Maybe<ResolversTypes['MinigraphqlResponse']>, ParentType, ContextType>;
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
  valid?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
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
  ip?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  privatePort?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  publicPort?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  type?: Resolver<Maybe<ResolversTypes['ContainerPortType']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type DashboardResolvers<ContextType = Context, ParentType extends ResolversParentTypes['Dashboard'] = ResolversParentTypes['Dashboard']> = ResolversObject<{
  apps?: Resolver<ResolversTypes['DashboardApps'], ParentType, ContextType>;
  array?: Resolver<ResolversTypes['DashboardArray'], ParentType, ContextType>;
  config?: Resolver<ResolversTypes['DashboardConfig'], ParentType, ContextType>;
  display?: Resolver<ResolversTypes['DashboardDisplay'], ParentType, ContextType>;
  os?: Resolver<ResolversTypes['DashboardOs'], ParentType, ContextType>;
  services?: Resolver<Array<Maybe<ResolversTypes['DashboardService']>>, ParentType, ContextType>;
  twoFactor?: Resolver<ResolversTypes['DashboardTwoFactor'], ParentType, ContextType>;
  vars?: Resolver<ResolversTypes['DashboardVars'], ParentType, ContextType>;
  versions?: Resolver<ResolversTypes['DashboardVersions'], ParentType, ContextType>;
  vms?: Resolver<ResolversTypes['DashboardVms'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type DashboardAppsResolvers<ContextType = Context, ParentType extends ResolversParentTypes['DashboardApps'] = ResolversParentTypes['DashboardApps']> = ResolversObject<{
  installed?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  started?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type DashboardArrayResolvers<ContextType = Context, ParentType extends ResolversParentTypes['DashboardArray'] = ResolversParentTypes['DashboardArray']> = ResolversObject<{
  capacity?: Resolver<ResolversTypes['ArrayCapacity'], ParentType, ContextType>;
  state?: Resolver<ResolversTypes['ArrayState'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type DashboardCaseResolvers<ContextType = Context, ParentType extends ResolversParentTypes['DashboardCase'] = ResolversParentTypes['DashboardCase']> = ResolversObject<{
  base64?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  error?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  icon?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  url?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type DashboardConfigResolvers<ContextType = Context, ParentType extends ResolversParentTypes['DashboardConfig'] = ResolversParentTypes['DashboardConfig']> = ResolversObject<{
  error?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  valid?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type DashboardDisplayResolvers<ContextType = Context, ParentType extends ResolversParentTypes['DashboardDisplay'] = ResolversParentTypes['DashboardDisplay']> = ResolversObject<{
  case?: Resolver<Maybe<ResolversTypes['DashboardCase']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type DashboardOsResolvers<ContextType = Context, ParentType extends ResolversParentTypes['DashboardOs'] = ResolversParentTypes['DashboardOs']> = ResolversObject<{
  hostname?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  uptime?: Resolver<Maybe<ResolversTypes['DateTime']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type DashboardServiceResolvers<ContextType = Context, ParentType extends ResolversParentTypes['DashboardService'] = ResolversParentTypes['DashboardService']> = ResolversObject<{
  name?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  online?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  uptime?: Resolver<Maybe<ResolversTypes['DashboardServiceUptime']>, ParentType, ContextType>;
  version?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type DashboardServiceUptimeResolvers<ContextType = Context, ParentType extends ResolversParentTypes['DashboardServiceUptime'] = ResolversParentTypes['DashboardServiceUptime']> = ResolversObject<{
  timestamp?: Resolver<Maybe<ResolversTypes['DateTime']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type DashboardTwoFactorResolvers<ContextType = Context, ParentType extends ResolversParentTypes['DashboardTwoFactor'] = ResolversParentTypes['DashboardTwoFactor']> = ResolversObject<{
  local?: Resolver<Maybe<ResolversTypes['DashboardTwoFactorLocal']>, ParentType, ContextType>;
  remote?: Resolver<Maybe<ResolversTypes['DashboardTwoFactorRemote']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type DashboardTwoFactorLocalResolvers<ContextType = Context, ParentType extends ResolversParentTypes['DashboardTwoFactorLocal'] = ResolversParentTypes['DashboardTwoFactorLocal']> = ResolversObject<{
  enabled?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type DashboardTwoFactorRemoteResolvers<ContextType = Context, ParentType extends ResolversParentTypes['DashboardTwoFactorRemote'] = ResolversParentTypes['DashboardTwoFactorRemote']> = ResolversObject<{
  enabled?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type DashboardVarsResolvers<ContextType = Context, ParentType extends ResolversParentTypes['DashboardVars'] = ResolversParentTypes['DashboardVars']> = ResolversObject<{
  flashGuid?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  regState?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  regTy?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type DashboardVersionsResolvers<ContextType = Context, ParentType extends ResolversParentTypes['DashboardVersions'] = ResolversParentTypes['DashboardVersions']> = ResolversObject<{
  unraid?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type DashboardVmsResolvers<ContextType = Context, ParentType extends ResolversParentTypes['DashboardVms'] = ResolversParentTypes['DashboardVms']> = ResolversObject<{
  installed?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  started?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export interface DateTimeScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['DateTime'], any> {
  name: 'DateTime';
}

export type DeviceResolvers<ContextType = Context, ParentType extends ResolversParentTypes['Device'] = ResolversParentTypes['Device']> = ResolversObject<{
  device?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  sectorSize?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  sectors?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  tag?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

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
  ports?: Resolver<Maybe<Array<Maybe<ResolversTypes['ContainerPort']>>>, ParentType, ContextType>;
  sizeRootFs?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  state?: Resolver<Maybe<ResolversTypes['ContainerState']>, ParentType, ContextType>;
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

export type EmhttpResponseResolvers<ContextType = Context, ParentType extends ResolversParentTypes['EmhttpResponse'] = ResolversParentTypes['EmhttpResponse']> = ResolversObject<{
  mode?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
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
  machineId?: Resolver<Maybe<ResolversTypes['ID']>, ParentType, ContextType>;
  memory?: Resolver<Maybe<ResolversTypes['InfoMemory']>, ParentType, ContextType>;
  os?: Resolver<Maybe<ResolversTypes['Os']>, ParentType, ContextType>;
  system?: Resolver<Maybe<ResolversTypes['System']>, ParentType, ContextType>;
  versions?: Resolver<Maybe<ResolversTypes['Versions']>, ParentType, ContextType>;
  vms?: Resolver<Maybe<ResolversTypes['InfoVMs']>, ParentType, ContextType>;
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

export type InfoVMsResolvers<ContextType = Context, ParentType extends ResolversParentTypes['InfoVMs'] = ResolversParentTypes['InfoVMs']> = ResolversObject<{
  installed?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  started?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
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
  permissions?: Resolver<Maybe<ResolversTypes['JSON']>, ParentType, ContextType>;
  role?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
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
  status?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
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
  addApikey?: Resolver<Maybe<ResolversTypes['ApiKey']>, ParentType, ContextType, RequireFields<MutationaddApikeyArgs, 'name'>>;
  addDiskToArray?: Resolver<Maybe<ResolversTypes['Array']>, ParentType, ContextType, Partial<MutationaddDiskToArrayArgs>>;
  addScope?: Resolver<Maybe<ResolversTypes['Scope']>, ParentType, ContextType, RequireFields<MutationaddScopeArgs, 'input'>>;
  addScopeToApiKey?: Resolver<Maybe<ResolversTypes['Scope']>, ParentType, ContextType, RequireFields<MutationaddScopeToApiKeyArgs, 'input'>>;
  addUser?: Resolver<Maybe<ResolversTypes['User']>, ParentType, ContextType, RequireFields<MutationaddUserArgs, 'input'>>;
  cancelParityCheck?: Resolver<Maybe<ResolversTypes['JSON']>, ParentType, ContextType>;
  clearArrayDiskStatistics?: Resolver<Maybe<ResolversTypes['JSON']>, ParentType, ContextType, RequireFields<MutationclearArrayDiskStatisticsArgs, 'id'>>;
  deleteUser?: Resolver<Maybe<ResolversTypes['User']>, ParentType, ContextType, RequireFields<MutationdeleteUserArgs, 'input'>>;
  getApiKey?: Resolver<Maybe<ResolversTypes['ApiKey']>, ParentType, ContextType, RequireFields<MutationgetApiKeyArgs, 'name'>>;
  login?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType, RequireFields<MutationloginArgs, 'password' | 'username'>>;
  mountArrayDisk?: Resolver<Maybe<ResolversTypes['Disk']>, ParentType, ContextType, RequireFields<MutationmountArrayDiskArgs, 'id'>>;
  pauseParityCheck?: Resolver<Maybe<ResolversTypes['JSON']>, ParentType, ContextType>;
  reboot?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  removeDiskFromArray?: Resolver<Maybe<ResolversTypes['Array']>, ParentType, ContextType, Partial<MutationremoveDiskFromArrayArgs>>;
  resumeParityCheck?: Resolver<Maybe<ResolversTypes['JSON']>, ParentType, ContextType>;
  sendNotification?: Resolver<Maybe<ResolversTypes['Notification']>, ParentType, ContextType, RequireFields<MutationsendNotificationArgs, 'notification'>>;
  shutdown?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  startArray?: Resolver<Maybe<ResolversTypes['Array']>, ParentType, ContextType>;
  startParityCheck?: Resolver<Maybe<ResolversTypes['JSON']>, ParentType, ContextType, Partial<MutationstartParityCheckArgs>>;
  stopArray?: Resolver<Maybe<ResolversTypes['Array']>, ParentType, ContextType>;
  testMutation?: Resolver<Maybe<ResolversTypes['JSON']>, ParentType, ContextType, RequireFields<MutationtestMutationArgs, 'id'>>;
  unmountArrayDisk?: Resolver<Maybe<ResolversTypes['Disk']>, ParentType, ContextType, RequireFields<MutationunmountArrayDiskArgs, 'id'>>;
  updateApikey?: Resolver<Maybe<ResolversTypes['ApiKey']>, ParentType, ContextType, RequireFields<MutationupdateApikeyArgs, 'name'>>;
}>;

export type NetworkResolvers<ContextType = Context, ParentType extends ResolversParentTypes['Network'] = ResolversParentTypes['Network']> = ResolversObject<{
  carrierChanges?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  duplex?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
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

export type NotificationResolvers<ContextType = Context, ParentType extends ResolversParentTypes['Notification'] = ResolversParentTypes['Notification']> = ResolversObject<{
  description?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  importance?: Resolver<ResolversTypes['Importance'], ParentType, ContextType>;
  link?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  subject?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  title?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
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

export type PermissionsResolvers<ContextType = Context, ParentType extends ResolversParentTypes['Permissions'] = ResolversParentTypes['Permissions']> = ResolversObject<{
  grants?: Resolver<Maybe<ResolversTypes['JSON']>, ParentType, ContextType>;
  scopes?: Resolver<Maybe<ResolversTypes['JSON']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type QueryResolvers<ContextType = Context, ParentType extends ResolversParentTypes['Query'] = ResolversParentTypes['Query']> = ResolversObject<{
  apiKeys?: Resolver<Maybe<Array<Maybe<ResolversTypes['ApiKey']>>>, ParentType, ContextType>;
  array?: Resolver<Maybe<ResolversTypes['Array']>, ParentType, ContextType>;
  cloud?: Resolver<Maybe<ResolversTypes['Cloud']>, ParentType, ContextType>;
  config?: Resolver<ResolversTypes['Config'], ParentType, ContextType>;
  crashReportingEnabled?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  dashboard?: Resolver<Maybe<ResolversTypes['Dashboard']>, ParentType, ContextType>;
  device?: Resolver<Maybe<ResolversTypes['Device']>, ParentType, ContextType, RequireFields<QuerydeviceArgs, 'id'>>;
  devices?: Resolver<Array<Maybe<ResolversTypes['Device']>>, ParentType, ContextType>;
  disk?: Resolver<Maybe<ResolversTypes['Disk']>, ParentType, ContextType, RequireFields<QuerydiskArgs, 'id'>>;
  disks?: Resolver<Array<Maybe<ResolversTypes['Disk']>>, ParentType, ContextType>;
  display?: Resolver<Maybe<ResolversTypes['Display']>, ParentType, ContextType>;
  dockerContainer?: Resolver<ResolversTypes['DockerContainer'], ParentType, ContextType, RequireFields<QuerydockerContainerArgs, 'id'>>;
  dockerContainers?: Resolver<Array<Maybe<ResolversTypes['DockerContainer']>>, ParentType, ContextType, Partial<QuerydockerContainersArgs>>;
  dockerNetwork?: Resolver<ResolversTypes['DockerNetwork'], ParentType, ContextType, RequireFields<QuerydockerNetworkArgs, 'id'>>;
  dockerNetworks?: Resolver<Array<Maybe<ResolversTypes['DockerNetwork']>>, ParentType, ContextType, Partial<QuerydockerNetworksArgs>>;
  flash?: Resolver<Maybe<ResolversTypes['Flash']>, ParentType, ContextType>;
  info?: Resolver<Maybe<ResolversTypes['Info']>, ParentType, ContextType>;
  me?: Resolver<Maybe<ResolversTypes['Me']>, ParentType, ContextType>;
  online?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  owner?: Resolver<Maybe<ResolversTypes['Owner']>, ParentType, ContextType>;
  parityHistory?: Resolver<Maybe<Array<Maybe<ResolversTypes['ParityCheck']>>>, ParentType, ContextType>;
  permissions?: Resolver<Maybe<ResolversTypes['Permissions']>, ParentType, ContextType>;
  registration?: Resolver<Maybe<ResolversTypes['Registration']>, ParentType, ContextType>;
  server?: Resolver<Maybe<ResolversTypes['Server']>, ParentType, ContextType, RequireFields<QueryserverArgs, 'name'>>;
  servers?: Resolver<Maybe<Array<Maybe<ResolversTypes['Server']>>>, ParentType, ContextType>;
  service?: Resolver<Maybe<ResolversTypes['Service']>, ParentType, ContextType, RequireFields<QueryserviceArgs, 'name'>>;
  services?: Resolver<Maybe<Array<Maybe<ResolversTypes['Service']>>>, ParentType, ContextType>;
  shares?: Resolver<Maybe<Array<Maybe<ResolversTypes['Share']>>>, ParentType, ContextType>;
  testQuery?: Resolver<Maybe<ResolversTypes['JSON']>, ParentType, ContextType, RequireFields<QuerytestQueryArgs, 'id'>>;
  twoFactor?: Resolver<Maybe<ResolversTypes['TwoFactorWithToken']>, ParentType, ContextType>;
  unassignedDevices?: Resolver<Maybe<Array<Maybe<ResolversTypes['UnassignedDevice']>>>, ParentType, ContextType>;
  user?: Resolver<Maybe<ResolversTypes['User']>, ParentType, ContextType, RequireFields<QueryuserArgs, 'id'>>;
  users?: Resolver<Array<ResolversTypes['User']>, ParentType, ContextType, Partial<QueryusersArgs>>;
  vars?: Resolver<Maybe<ResolversTypes['Vars']>, ParentType, ContextType>;
  vmNetwork?: Resolver<Maybe<ResolversTypes['JSON']>, ParentType, ContextType, RequireFields<QueryvmNetworkArgs, 'name'>>;
  vms?: Resolver<Maybe<ResolversTypes['Vms']>, ParentType, ContextType>;
  welcome?: Resolver<Maybe<ResolversTypes['Welcome']>, ParentType, ContextType>;
}>;

export type RegistrationResolvers<ContextType = Context, ParentType extends ResolversParentTypes['Registration'] = ResolversParentTypes['Registration']> = ResolversObject<{
  expiration?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  guid?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  keyFile?: Resolver<Maybe<ResolversTypes['KeyFile']>, ParentType, ContextType>;
  state?: Resolver<Maybe<ResolversTypes['registrationState']>, ParentType, ContextType>;
  type?: Resolver<Maybe<ResolversTypes['registrationType']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type RelayResponseResolvers<ContextType = Context, ParentType extends ResolversParentTypes['RelayResponse'] = ResolversParentTypes['RelayResponse']> = ResolversObject<{
  error?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  status?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  timeout?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type ScopeResolvers<ContextType = Context, ParentType extends ResolversParentTypes['Scope'] = ResolversParentTypes['Scope']> = ResolversObject<{
  description?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  name?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type ServerResolvers<ContextType = Context, ParentType extends ResolversParentTypes['Server'] = ResolversParentTypes['Server']> = ResolversObject<{
  apikey?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  guid?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  lanip?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  localurl?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  name?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  owner?: Resolver<Maybe<ResolversTypes['Owner']>, ParentType, ContextType>;
  remoteurl?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  status?: Resolver<Maybe<ResolversTypes['Status']>, ParentType, ContextType>;
  wanip?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type ServiceResolvers<ContextType = Context, ParentType extends ResolversParentTypes['Service'] = ResolversParentTypes['Service']> = ResolversObject<{
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
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
  free?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  include?: Resolver<Maybe<Array<Maybe<ResolversTypes['String']>>>, ParentType, ContextType>;
  luksStatus?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  name?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  nameOrig?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  size?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  splitLevel?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type SubscriptionResolvers<ContextType = Context, ParentType extends ResolversParentTypes['Subscription'] = ResolversParentTypes['Subscription']> = ResolversObject<{
  apikeys?: SubscriptionResolver<Maybe<Array<Maybe<ResolversTypes['ApiKey']>>>, "apikeys", ParentType, ContextType>;
  array?: SubscriptionResolver<ResolversTypes['Array'], "array", ParentType, ContextType>;
  config?: SubscriptionResolver<ResolversTypes['Config'], "config", ParentType, ContextType>;
  crashReportingEnabled?: SubscriptionResolver<ResolversTypes['Boolean'], "crashReportingEnabled", ParentType, ContextType>;
  dashboard?: SubscriptionResolver<Maybe<ResolversTypes['Dashboard']>, "dashboard", ParentType, ContextType>;
  device?: SubscriptionResolver<ResolversTypes['Device'], "device", ParentType, ContextType, RequireFields<SubscriptiondeviceArgs, 'id'>>;
  devices?: SubscriptionResolver<Maybe<Array<ResolversTypes['Device']>>, "devices", ParentType, ContextType>;
  display?: SubscriptionResolver<Maybe<ResolversTypes['Display']>, "display", ParentType, ContextType>;
  dockerContainer?: SubscriptionResolver<ResolversTypes['DockerContainer'], "dockerContainer", ParentType, ContextType, RequireFields<SubscriptiondockerContainerArgs, 'id'>>;
  dockerContainers?: SubscriptionResolver<Maybe<Array<Maybe<ResolversTypes['DockerContainer']>>>, "dockerContainers", ParentType, ContextType>;
  dockerNetwork?: SubscriptionResolver<ResolversTypes['DockerNetwork'], "dockerNetwork", ParentType, ContextType, RequireFields<SubscriptiondockerNetworkArgs, 'id'>>;
  dockerNetworks?: SubscriptionResolver<Array<Maybe<ResolversTypes['DockerNetwork']>>, "dockerNetworks", ParentType, ContextType>;
  flash?: SubscriptionResolver<ResolversTypes['Flash'], "flash", ParentType, ContextType>;
  info?: SubscriptionResolver<ResolversTypes['Info'], "info", ParentType, ContextType>;
  me?: SubscriptionResolver<Maybe<ResolversTypes['Me']>, "me", ParentType, ContextType>;
  online?: SubscriptionResolver<ResolversTypes['Boolean'], "online", ParentType, ContextType>;
  owner?: SubscriptionResolver<ResolversTypes['Owner'], "owner", ParentType, ContextType>;
  parityHistory?: SubscriptionResolver<ResolversTypes['ParityCheck'], "parityHistory", ParentType, ContextType>;
  ping?: SubscriptionResolver<ResolversTypes['String'], "ping", ParentType, ContextType>;
  registration?: SubscriptionResolver<ResolversTypes['Registration'], "registration", ParentType, ContextType>;
  server?: SubscriptionResolver<ResolversTypes['Server'], "server", ParentType, ContextType, RequireFields<SubscriptionserverArgs, 'name'>>;
  servers?: SubscriptionResolver<Maybe<Array<ResolversTypes['Server']>>, "servers", ParentType, ContextType>;
  service?: SubscriptionResolver<Maybe<Array<ResolversTypes['Service']>>, "service", ParentType, ContextType, RequireFields<SubscriptionserviceArgs, 'name'>>;
  services?: SubscriptionResolver<Maybe<Array<ResolversTypes['Service']>>, "services", ParentType, ContextType>;
  share?: SubscriptionResolver<ResolversTypes['Share'], "share", ParentType, ContextType, RequireFields<SubscriptionshareArgs, 'id'>>;
  shares?: SubscriptionResolver<Maybe<Array<ResolversTypes['Share']>>, "shares", ParentType, ContextType>;
  testSubscription?: SubscriptionResolver<ResolversTypes['String'], "testSubscription", ParentType, ContextType>;
  twoFactor?: SubscriptionResolver<Maybe<ResolversTypes['TwoFactorWithoutToken']>, "twoFactor", ParentType, ContextType>;
  unassignedDevices?: SubscriptionResolver<Maybe<Array<ResolversTypes['UnassignedDevice']>>, "unassignedDevices", ParentType, ContextType>;
  user?: SubscriptionResolver<ResolversTypes['User'], "user", ParentType, ContextType, RequireFields<SubscriptionuserArgs, 'id'>>;
  users?: SubscriptionResolver<Array<Maybe<ResolversTypes['User']>>, "users", ParentType, ContextType>;
  vars?: SubscriptionResolver<ResolversTypes['Vars'], "vars", ParentType, ContextType>;
  vmNetworks?: SubscriptionResolver<Maybe<Array<ResolversTypes['VmNetwork']>>, "vmNetworks", ParentType, ContextType>;
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

export type TwoFactorLocalResolvers<ContextType = Context, ParentType extends ResolversParentTypes['TwoFactorLocal'] = ResolversParentTypes['TwoFactorLocal']> = ResolversObject<{
  enabled?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type TwoFactorRemoteResolvers<ContextType = Context, ParentType extends ResolversParentTypes['TwoFactorRemote'] = ResolversParentTypes['TwoFactorRemote']> = ResolversObject<{
  enabled?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type TwoFactorWithTokenResolvers<ContextType = Context, ParentType extends ResolversParentTypes['TwoFactorWithToken'] = ResolversParentTypes['TwoFactorWithToken']> = ResolversObject<{
  local?: Resolver<Maybe<ResolversTypes['TwoFactorLocal']>, ParentType, ContextType>;
  remote?: Resolver<Maybe<ResolversTypes['TwoFactorRemote']>, ParentType, ContextType>;
  token?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type TwoFactorWithoutTokenResolvers<ContextType = Context, ParentType extends ResolversParentTypes['TwoFactorWithoutToken'] = ResolversParentTypes['TwoFactorWithoutToken']> = ResolversObject<{
  local?: Resolver<Maybe<ResolversTypes['TwoFactorLocal']>, ParentType, ContextType>;
  remote?: Resolver<Maybe<ResolversTypes['TwoFactorRemote']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

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
  seconds?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  timestamp?: Resolver<Maybe<ResolversTypes['DateTime']>, ParentType, ContextType>;
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
  role?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type UserAccountResolvers<ContextType = Context, ParentType extends ResolversParentTypes['UserAccount'] = ResolversParentTypes['UserAccount']> = ResolversObject<{
  __resolveType: TypeResolveFn<'Me' | 'User', ParentType, ContextType>;
  description?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  role?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
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
  regState?: Resolver<Maybe<ResolversTypes['registrationState']>, ParentType, ContextType>;
  regTm?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  regTm2?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  regTo?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  regTy?: Resolver<Maybe<ResolversTypes['registrationType']>, ParentType, ContextType>;
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
  state?: Resolver<Maybe<ResolversTypes['VmState']>, ParentType, ContextType>;
  uuid?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type VmNetworkResolvers<ContextType = Context, ParentType extends ResolversParentTypes['VmNetwork'] = ResolversParentTypes['VmNetwork']> = ResolversObject<{
  _placeholderType?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type VmsResolvers<ContextType = Context, ParentType extends ResolversParentTypes['Vms'] = ResolversParentTypes['Vms']> = ResolversObject<{
  domain?: Resolver<Maybe<Array<ResolversTypes['VmDomain']>>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type WelcomeResolvers<ContextType = Context, ParentType extends ResolversParentTypes['Welcome'] = ResolversParentTypes['Welcome']> = ResolversObject<{
  message?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type Resolvers<ContextType = Context> = ResolversObject<{
  ApiKey?: ApiKeyResolvers<ContextType>;
  ApiKeyResponse?: ApiKeyResponseResolvers<ContextType>;
  Array?: ArrayResolvers<ContextType>;
  ArrayCapacity?: ArrayCapacityResolvers<ContextType>;
  ArrayDataDisk?: ArrayDataDiskResolvers<ContextType>;
  Baseboard?: BaseboardResolvers<ContextType>;
  Capacity?: CapacityResolvers<ContextType>;
  Case?: CaseResolvers<ContextType>;
  Cloud?: CloudResolvers<ContextType>;
  CloudResponse?: CloudResponseResolvers<ContextType>;
  Config?: ConfigResolvers<ContextType>;
  ContainerHostConfig?: ContainerHostConfigResolvers<ContextType>;
  ContainerMount?: ContainerMountResolvers<ContextType>;
  ContainerPort?: ContainerPortResolvers<ContextType>;
  Dashboard?: DashboardResolvers<ContextType>;
  DashboardApps?: DashboardAppsResolvers<ContextType>;
  DashboardArray?: DashboardArrayResolvers<ContextType>;
  DashboardCase?: DashboardCaseResolvers<ContextType>;
  DashboardConfig?: DashboardConfigResolvers<ContextType>;
  DashboardDisplay?: DashboardDisplayResolvers<ContextType>;
  DashboardOs?: DashboardOsResolvers<ContextType>;
  DashboardService?: DashboardServiceResolvers<ContextType>;
  DashboardServiceUptime?: DashboardServiceUptimeResolvers<ContextType>;
  DashboardTwoFactor?: DashboardTwoFactorResolvers<ContextType>;
  DashboardTwoFactorLocal?: DashboardTwoFactorLocalResolvers<ContextType>;
  DashboardTwoFactorRemote?: DashboardTwoFactorRemoteResolvers<ContextType>;
  DashboardVars?: DashboardVarsResolvers<ContextType>;
  DashboardVersions?: DashboardVersionsResolvers<ContextType>;
  DashboardVms?: DashboardVmsResolvers<ContextType>;
  DateTime?: GraphQLScalarType;
  Device?: DeviceResolvers<ContextType>;
  Devices?: DevicesResolvers<ContextType>;
  Disk?: DiskResolvers<ContextType>;
  DiskPartition?: DiskPartitionResolvers<ContextType>;
  Display?: DisplayResolvers<ContextType>;
  DockerContainer?: DockerContainerResolvers<ContextType>;
  DockerNetwork?: DockerNetworkResolvers<ContextType>;
  EmhttpResponse?: EmhttpResponseResolvers<ContextType>;
  Flash?: FlashResolvers<ContextType>;
  Gpu?: GpuResolvers<ContextType>;
  Info?: InfoResolvers<ContextType>;
  InfoApps?: InfoAppsResolvers<ContextType>;
  InfoCpu?: InfoCpuResolvers<ContextType>;
  InfoMemory?: InfoMemoryResolvers<ContextType>;
  InfoVMs?: InfoVMsResolvers<ContextType>;
  JSON?: GraphQLScalarType;
  KeyFile?: KeyFileResolvers<ContextType>;
  Long?: GraphQLScalarType;
  Me?: MeResolvers<ContextType>;
  MemoryLayout?: MemoryLayoutResolvers<ContextType>;
  MinigraphqlResponse?: MinigraphqlResponseResolvers<ContextType>;
  Mount?: MountResolvers<ContextType>;
  Mutation?: MutationResolvers<ContextType>;
  Network?: NetworkResolvers<ContextType>;
  Notification?: NotificationResolvers<ContextType>;
  Os?: OsResolvers<ContextType>;
  Owner?: OwnerResolvers<ContextType>;
  ParityCheck?: ParityCheckResolvers<ContextType>;
  Partition?: PartitionResolvers<ContextType>;
  Pci?: PciResolvers<ContextType>;
  Permissions?: PermissionsResolvers<ContextType>;
  Query?: QueryResolvers<ContextType>;
  Registration?: RegistrationResolvers<ContextType>;
  RelayResponse?: RelayResponseResolvers<ContextType>;
  Scope?: ScopeResolvers<ContextType>;
  Server?: ServerResolvers<ContextType>;
  Service?: ServiceResolvers<ContextType>;
  Share?: ShareResolvers<ContextType>;
  Subscription?: SubscriptionResolvers<ContextType>;
  System?: SystemResolvers<ContextType>;
  TwoFactorLocal?: TwoFactorLocalResolvers<ContextType>;
  TwoFactorRemote?: TwoFactorRemoteResolvers<ContextType>;
  TwoFactorWithToken?: TwoFactorWithTokenResolvers<ContextType>;
  TwoFactorWithoutToken?: TwoFactorWithoutTokenResolvers<ContextType>;
  UUID?: GraphQLScalarType;
  UnassignedDevice?: UnassignedDeviceResolvers<ContextType>;
  Uptime?: UptimeResolvers<ContextType>;
  Usb?: UsbResolvers<ContextType>;
  User?: UserResolvers<ContextType>;
  UserAccount?: UserAccountResolvers<ContextType>;
  Vars?: VarsResolvers<ContextType>;
  Versions?: VersionsResolvers<ContextType>;
  VmDomain?: VmDomainResolvers<ContextType>;
  VmNetwork?: VmNetworkResolvers<ContextType>;
  Vms?: VmsResolvers<ContextType>;
  Welcome?: WelcomeResolvers<ContextType>;
}>;

export type DirectiveResolvers<ContextType = Context> = ResolversObject<{
  subscription?: subscriptionDirectiveResolver<any, any, ContextType>;
}>;
