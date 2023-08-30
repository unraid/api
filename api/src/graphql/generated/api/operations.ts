/* eslint-disable */
import * as Types from '@app/graphql/generated/api/types';

import { z } from 'zod'
import { AllowedOriginInput, ApiKey, ApiKeyResponse, ArrayType, ArrayCapacity, ArrayDisk, ArrayDiskFsColor, ArrayDiskStatus, ArrayDiskType, ArrayPendingState, ArrayState, Baseboard, Capacity, Case, Cloud, CloudResponse, Config, ConfigErrorState, ConnectSignInInput, ConnectUserInfoInput, ContainerHostConfig, ContainerMount, ContainerPort, ContainerPortType, ContainerState, Device, Devices, Disk, DiskFsType, DiskInterfaceType, DiskPartition, DiskSmartStatus, Display, DockerContainer, DockerNetwork, Flash, Gpu, Importance, Info, InfoApps, InfoCpu, InfoMemory, KeyFile, Me, MemoryFormFactor, MemoryLayout, MemoryType, MinigraphStatus, MinigraphqlResponse, Mount, Network, Notification, NotificationFilter, NotificationInput, NotificationType, Os, Owner, ParityCheck, Partition, Pci, Permissions, ProfileModel, Registration, RegistrationState, RelayResponse, Scope, Server, ServerStatus, Service, SetupRemoteAccessInput, Share, System, Temperature, Theme, TwoFactorLocal, TwoFactorRemote, TwoFactorWithToken, TwoFactorWithoutToken, UnassignedDevice, Uptime, Usb, User, Vars, Versions, VmDomain, VmNetwork, VmState, Vms, WAN_ACCESS_TYPE, WAN_FORWARD_TYPE, Welcome, addApiKeyInput, addScopeInput, addScopeToApiKeyInput, addUserInput, arrayDiskInput, authenticateInput, deleteUserInput, mdState, registrationType, updateApikeyInput, usersInput } from '@app/graphql/generated/api/types'
import { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';

type Properties<T> = Required<{
  [K in keyof T]: z.ZodType<T[K], any, T[K]>;
}>;

type definedNonNullAny = {};

export const isDefinedNonNullAny = (v: any): v is definedNonNullAny => v !== undefined && v !== null;

export const definedNonNullAnySchema = z.any().refine((v) => isDefinedNonNullAny(v));

export const ArrayDiskFsColorSchema = z.nativeEnum(ArrayDiskFsColor);

export const ArrayDiskStatusSchema = z.nativeEnum(ArrayDiskStatus);

export const ArrayDiskTypeSchema = z.nativeEnum(ArrayDiskType);

export const ArrayPendingStateSchema = z.nativeEnum(ArrayPendingState);

export const ArrayStateSchema = z.nativeEnum(ArrayState);

export const ConfigErrorStateSchema = z.nativeEnum(ConfigErrorState);

export const ContainerPortTypeSchema = z.nativeEnum(ContainerPortType);

export const ContainerStateSchema = z.nativeEnum(ContainerState);

export const DiskFsTypeSchema = z.nativeEnum(DiskFsType);

export const DiskInterfaceTypeSchema = z.nativeEnum(DiskInterfaceType);

export const DiskSmartStatusSchema = z.nativeEnum(DiskSmartStatus);

export const ImportanceSchema = z.nativeEnum(Importance);

export const MemoryFormFactorSchema = z.nativeEnum(MemoryFormFactor);

export const MemoryTypeSchema = z.nativeEnum(MemoryType);

export const MinigraphStatusSchema = z.nativeEnum(MinigraphStatus);

export const NotificationTypeSchema = z.nativeEnum(NotificationType);

export const RegistrationStateSchema = z.nativeEnum(RegistrationState);

export const ServerStatusSchema = z.nativeEnum(ServerStatus);

export const TemperatureSchema = z.nativeEnum(Temperature);

export const ThemeSchema = z.nativeEnum(Theme);

export const VmStateSchema = z.nativeEnum(VmState);

export const WAN_ACCESS_TYPESchema = z.nativeEnum(WAN_ACCESS_TYPE);

export const WAN_FORWARD_TYPESchema = z.nativeEnum(WAN_FORWARD_TYPE);

export const mdStateSchema = z.nativeEnum(mdState);

export const registrationTypeSchema = z.nativeEnum(registrationType);

export function AllowedOriginInputSchema(): z.ZodObject<Properties<AllowedOriginInput>> {
  return z.object({
    origins: z.array(definedNonNullAnySchema)
  })
}

export function ApiKeySchema(): z.ZodObject<Properties<ApiKey>> {
  return z.object({
    __typename: z.literal('ApiKey').optional(),
    description: definedNonNullAnySchema.nullish(),
    expiresAt: definedNonNullAnySchema,
    key: definedNonNullAnySchema,
    name: definedNonNullAnySchema,
    scopes: definedNonNullAnySchema
  })
}

export function ApiKeyResponseSchema(): z.ZodObject<Properties<ApiKeyResponse>> {
  return z.object({
    __typename: z.literal('ApiKeyResponse').optional(),
    error: definedNonNullAnySchema.nullish(),
    valid: definedNonNullAnySchema
  })
}

export function ArrayTypeSchema(): z.ZodObject<Properties<ArrayType>> {
  return z.object({
    __typename: z.literal('Array').optional(),
    boot: ArrayDiskSchema().nullish(),
    caches: z.array(ArrayDiskSchema()),
    capacity: ArrayCapacitySchema(),
    disks: z.array(ArrayDiskSchema()),
    parities: z.array(ArrayDiskSchema()),
    pendingState: ArrayPendingStateSchema.nullish(),
    previousState: ArrayStateSchema.nullish(),
    state: ArrayStateSchema
  })
}

export function ArrayCapacitySchema(): z.ZodObject<Properties<ArrayCapacity>> {
  return z.object({
    __typename: z.literal('ArrayCapacity').optional(),
    disks: CapacitySchema(),
    kilobytes: CapacitySchema()
  })
}

export function ArrayDiskSchema(): z.ZodObject<Properties<ArrayDisk>> {
  return z.object({
    __typename: z.literal('ArrayDisk').optional(),
    comment: definedNonNullAnySchema.nullish(),
    critical: definedNonNullAnySchema.nullish(),
    device: definedNonNullAnySchema.nullish(),
    exportable: definedNonNullAnySchema.nullish(),
    format: definedNonNullAnySchema.nullish(),
    fsFree: definedNonNullAnySchema.nullish(),
    fsSize: definedNonNullAnySchema.nullish(),
    fsType: definedNonNullAnySchema.nullish(),
    fsUsed: definedNonNullAnySchema.nullish(),
    id: definedNonNullAnySchema,
    idx: definedNonNullAnySchema,
    name: definedNonNullAnySchema.nullish(),
    numErrors: definedNonNullAnySchema,
    numReads: definedNonNullAnySchema,
    numWrites: definedNonNullAnySchema,
    rotational: definedNonNullAnySchema.nullish(),
    size: definedNonNullAnySchema,
    status: ArrayDiskStatusSchema.nullish(),
    temp: definedNonNullAnySchema.nullish(),
    transport: definedNonNullAnySchema.nullish(),
    type: ArrayDiskTypeSchema,
    warning: definedNonNullAnySchema.nullish()
  })
}

export function BaseboardSchema(): z.ZodObject<Properties<Baseboard>> {
  return z.object({
    __typename: z.literal('Baseboard').optional(),
    assetTag: definedNonNullAnySchema.nullish(),
    manufacturer: definedNonNullAnySchema,
    model: definedNonNullAnySchema.nullish(),
    serial: definedNonNullAnySchema.nullish(),
    version: definedNonNullAnySchema.nullish()
  })
}

export function CapacitySchema(): z.ZodObject<Properties<Capacity>> {
  return z.object({
    __typename: z.literal('Capacity').optional(),
    free: definedNonNullAnySchema,
    total: definedNonNullAnySchema,
    used: definedNonNullAnySchema
  })
}

export function CaseSchema(): z.ZodObject<Properties<Case>> {
  return z.object({
    __typename: z.literal('Case').optional(),
    base64: definedNonNullAnySchema.nullish(),
    error: definedNonNullAnySchema.nullish(),
    icon: definedNonNullAnySchema.nullish(),
    url: definedNonNullAnySchema.nullish()
  })
}

export function CloudSchema(): z.ZodObject<Properties<Cloud>> {
  return z.object({
    __typename: z.literal('Cloud').optional(),
    allowedOrigins: z.array(definedNonNullAnySchema),
    apiKey: ApiKeyResponseSchema(),
    cloud: CloudResponseSchema(),
    error: definedNonNullAnySchema.nullish(),
    minigraphql: MinigraphqlResponseSchema(),
    relay: RelayResponseSchema().nullish()
  })
}

export function CloudResponseSchema(): z.ZodObject<Properties<CloudResponse>> {
  return z.object({
    __typename: z.literal('CloudResponse').optional(),
    error: definedNonNullAnySchema.nullish(),
    ip: definedNonNullAnySchema.nullish(),
    status: definedNonNullAnySchema
  })
}

export function ConfigSchema(): z.ZodObject<Properties<Config>> {
  return z.object({
    __typename: z.literal('Config').optional(),
    error: ConfigErrorStateSchema.nullish(),
    valid: definedNonNullAnySchema.nullish()
  })
}

export function ConnectSignInInputSchema(): z.ZodObject<Properties<ConnectSignInInput>> {
  return z.object({
    accessToken: definedNonNullAnySchema.nullish(),
    apiKey: definedNonNullAnySchema,
    idToken: definedNonNullAnySchema.nullish(),
    refreshToken: definedNonNullAnySchema.nullish(),
    userInfo: z.lazy(() => ConnectUserInfoInputSchema().nullish())
  })
}

export function ConnectUserInfoInputSchema(): z.ZodObject<Properties<ConnectUserInfoInput>> {
  return z.object({
    avatar: definedNonNullAnySchema.nullish(),
    email: definedNonNullAnySchema,
    preferred_username: definedNonNullAnySchema
  })
}

export function ContainerHostConfigSchema(): z.ZodObject<Properties<ContainerHostConfig>> {
  return z.object({
    __typename: z.literal('ContainerHostConfig').optional(),
    networkMode: definedNonNullAnySchema
  })
}

export function ContainerMountSchema(): z.ZodObject<Properties<ContainerMount>> {
  return z.object({
    __typename: z.literal('ContainerMount').optional(),
    destination: definedNonNullAnySchema,
    driver: definedNonNullAnySchema,
    mode: definedNonNullAnySchema,
    name: definedNonNullAnySchema,
    propagation: definedNonNullAnySchema,
    rw: definedNonNullAnySchema,
    source: definedNonNullAnySchema,
    type: definedNonNullAnySchema
  })
}

export function ContainerPortSchema(): z.ZodObject<Properties<ContainerPort>> {
  return z.object({
    __typename: z.literal('ContainerPort').optional(),
    ip: definedNonNullAnySchema.nullish(),
    privatePort: definedNonNullAnySchema.nullish(),
    publicPort: definedNonNullAnySchema.nullish(),
    type: ContainerPortTypeSchema.nullish()
  })
}

export function DeviceSchema(): z.ZodObject<Properties<Device>> {
  return z.object({
    __typename: z.literal('Device').optional(),
    device: definedNonNullAnySchema.nullish(),
    id: definedNonNullAnySchema,
    sectorSize: definedNonNullAnySchema.nullish(),
    sectors: definedNonNullAnySchema.nullish(),
    tag: definedNonNullAnySchema.nullish()
  })
}

export function DevicesSchema(): z.ZodObject<Properties<Devices>> {
  return z.object({
    __typename: z.literal('Devices').optional(),
    gpu: z.array(GpuSchema().nullable()).nullish(),
    network: z.array(NetworkSchema().nullable()).nullish(),
    pci: z.array(PciSchema().nullable()).nullish(),
    usb: z.array(UsbSchema().nullable()).nullish()
  })
}

export function DiskSchema(): z.ZodObject<Properties<Disk>> {
  return z.object({
    __typename: z.literal('Disk').optional(),
    bytesPerSector: definedNonNullAnySchema,
    device: definedNonNullAnySchema,
    firmwareRevision: definedNonNullAnySchema,
    interfaceType: DiskInterfaceTypeSchema,
    name: definedNonNullAnySchema,
    partitions: z.array(DiskPartitionSchema()).nullish(),
    sectorsPerTrack: definedNonNullAnySchema,
    serialNum: definedNonNullAnySchema,
    size: definedNonNullAnySchema,
    smartStatus: DiskSmartStatusSchema,
    temperature: definedNonNullAnySchema,
    totalCylinders: definedNonNullAnySchema,
    totalHeads: definedNonNullAnySchema,
    totalSectors: definedNonNullAnySchema,
    totalTracks: definedNonNullAnySchema,
    tracksPerCylinder: definedNonNullAnySchema,
    type: definedNonNullAnySchema,
    vendor: definedNonNullAnySchema
  })
}

export function DiskPartitionSchema(): z.ZodObject<Properties<DiskPartition>> {
  return z.object({
    __typename: z.literal('DiskPartition').optional(),
    fsType: DiskFsTypeSchema,
    name: definedNonNullAnySchema,
    size: definedNonNullAnySchema
  })
}

export function DisplaySchema(): z.ZodObject<Properties<Display>> {
  return z.object({
    __typename: z.literal('Display').optional(),
    banner: definedNonNullAnySchema.nullish(),
    case: CaseSchema().nullish(),
    critical: definedNonNullAnySchema.nullish(),
    dashapps: definedNonNullAnySchema.nullish(),
    date: definedNonNullAnySchema.nullish(),
    hot: definedNonNullAnySchema.nullish(),
    locale: definedNonNullAnySchema.nullish(),
    max: definedNonNullAnySchema.nullish(),
    number: definedNonNullAnySchema.nullish(),
    resize: definedNonNullAnySchema.nullish(),
    scale: definedNonNullAnySchema.nullish(),
    tabs: definedNonNullAnySchema.nullish(),
    text: definedNonNullAnySchema.nullish(),
    theme: ThemeSchema.nullish(),
    total: definedNonNullAnySchema.nullish(),
    unit: TemperatureSchema.nullish(),
    usage: definedNonNullAnySchema.nullish(),
    users: definedNonNullAnySchema.nullish(),
    warning: definedNonNullAnySchema.nullish(),
    wwn: definedNonNullAnySchema.nullish()
  })
}

export function DockerContainerSchema(): z.ZodObject<Properties<DockerContainer>> {
  return z.object({
    __typename: z.literal('DockerContainer').optional(),
    autoStart: definedNonNullAnySchema,
    command: definedNonNullAnySchema,
    created: definedNonNullAnySchema,
    hostConfig: ContainerHostConfigSchema().nullish(),
    id: definedNonNullAnySchema,
    image: definedNonNullAnySchema,
    imageId: definedNonNullAnySchema,
    labels: definedNonNullAnySchema.nullish(),
    mounts: z.array(definedNonNullAnySchema.nullable()).nullish(),
    names: z.array(definedNonNullAnySchema).nullish(),
    networkSettings: definedNonNullAnySchema.nullish(),
    ports: z.array(ContainerPortSchema()),
    sizeRootFs: definedNonNullAnySchema.nullish(),
    state: ContainerStateSchema,
    status: definedNonNullAnySchema
  })
}

export function DockerNetworkSchema(): z.ZodObject<Properties<DockerNetwork>> {
  return z.object({
    __typename: z.literal('DockerNetwork').optional(),
    attachable: definedNonNullAnySchema,
    configFrom: definedNonNullAnySchema.nullish(),
    configOnly: definedNonNullAnySchema,
    containers: definedNonNullAnySchema.nullish(),
    created: definedNonNullAnySchema.nullish(),
    driver: definedNonNullAnySchema.nullish(),
    enableIPv6: definedNonNullAnySchema,
    id: definedNonNullAnySchema.nullish(),
    ingress: definedNonNullAnySchema,
    internal: definedNonNullAnySchema,
    ipam: definedNonNullAnySchema.nullish(),
    labels: definedNonNullAnySchema.nullish(),
    name: definedNonNullAnySchema.nullish(),
    options: definedNonNullAnySchema.nullish(),
    scope: definedNonNullAnySchema.nullish()
  })
}

export function FlashSchema(): z.ZodObject<Properties<Flash>> {
  return z.object({
    __typename: z.literal('Flash').optional(),
    guid: definedNonNullAnySchema.nullish(),
    product: definedNonNullAnySchema.nullish(),
    vendor: definedNonNullAnySchema.nullish()
  })
}

export function GpuSchema(): z.ZodObject<Properties<Gpu>> {
  return z.object({
    __typename: z.literal('Gpu').optional(),
    blacklisted: definedNonNullAnySchema,
    class: definedNonNullAnySchema,
    id: definedNonNullAnySchema,
    productid: definedNonNullAnySchema,
    type: definedNonNullAnySchema,
    typeid: definedNonNullAnySchema,
    vendorname: definedNonNullAnySchema
  })
}

export function InfoSchema(): z.ZodObject<Properties<Info>> {
  return z.object({
    __typename: z.literal('Info').optional(),
    apps: InfoAppsSchema().nullish(),
    baseboard: BaseboardSchema().nullish(),
    cpu: InfoCpuSchema().nullish(),
    devices: DevicesSchema().nullish(),
    display: DisplaySchema().nullish(),
    machineId: definedNonNullAnySchema.nullish(),
    memory: InfoMemorySchema().nullish(),
    os: OsSchema().nullish(),
    system: SystemSchema().nullish(),
    versions: VersionsSchema().nullish()
  })
}

export function InfoAppsSchema(): z.ZodObject<Properties<InfoApps>> {
  return z.object({
    __typename: z.literal('InfoApps').optional(),
    installed: definedNonNullAnySchema.nullish(),
    started: definedNonNullAnySchema.nullish()
  })
}

export function InfoCpuSchema(): z.ZodObject<Properties<InfoCpu>> {
  return z.object({
    __typename: z.literal('InfoCpu').optional(),
    brand: definedNonNullAnySchema,
    cache: definedNonNullAnySchema,
    cores: definedNonNullAnySchema,
    family: definedNonNullAnySchema,
    flags: z.array(definedNonNullAnySchema).nullish(),
    manufacturer: definedNonNullAnySchema,
    model: definedNonNullAnySchema,
    processors: definedNonNullAnySchema,
    revision: definedNonNullAnySchema,
    socket: definedNonNullAnySchema,
    speed: definedNonNullAnySchema,
    speedmax: definedNonNullAnySchema,
    speedmin: definedNonNullAnySchema,
    stepping: definedNonNullAnySchema,
    threads: definedNonNullAnySchema,
    vendor: definedNonNullAnySchema,
    voltage: definedNonNullAnySchema.nullish()
  })
}

export function InfoMemorySchema(): z.ZodObject<Properties<InfoMemory>> {
  return z.object({
    __typename: z.literal('InfoMemory').optional(),
    active: definedNonNullAnySchema,
    available: definedNonNullAnySchema,
    buffcache: definedNonNullAnySchema,
    free: definedNonNullAnySchema,
    layout: z.array(MemoryLayoutSchema()).nullish(),
    max: definedNonNullAnySchema,
    swapfree: definedNonNullAnySchema,
    swaptotal: definedNonNullAnySchema,
    swapused: definedNonNullAnySchema,
    total: definedNonNullAnySchema,
    used: definedNonNullAnySchema
  })
}

export function KeyFileSchema(): z.ZodObject<Properties<KeyFile>> {
  return z.object({
    __typename: z.literal('KeyFile').optional(),
    contents: definedNonNullAnySchema.nullish(),
    location: definedNonNullAnySchema.nullish()
  })
}

export function MeSchema(): z.ZodObject<Properties<Me>> {
  return z.object({
    __typename: z.literal('Me').optional(),
    description: definedNonNullAnySchema,
    id: definedNonNullAnySchema,
    name: definedNonNullAnySchema,
    permissions: definedNonNullAnySchema.nullish(),
    role: definedNonNullAnySchema
  })
}

export function MemoryLayoutSchema(): z.ZodObject<Properties<MemoryLayout>> {
  return z.object({
    __typename: z.literal('MemoryLayout').optional(),
    bank: definedNonNullAnySchema.nullish(),
    clockSpeed: definedNonNullAnySchema.nullish(),
    formFactor: MemoryFormFactorSchema.nullish(),
    manufacturer: definedNonNullAnySchema.nullish(),
    partNum: definedNonNullAnySchema.nullish(),
    serialNum: definedNonNullAnySchema.nullish(),
    size: definedNonNullAnySchema,
    type: MemoryTypeSchema.nullish(),
    voltageConfigured: definedNonNullAnySchema.nullish(),
    voltageMax: definedNonNullAnySchema.nullish(),
    voltageMin: definedNonNullAnySchema.nullish()
  })
}

export function MinigraphqlResponseSchema(): z.ZodObject<Properties<MinigraphqlResponse>> {
  return z.object({
    __typename: z.literal('MinigraphqlResponse').optional(),
    error: definedNonNullAnySchema.nullish(),
    status: MinigraphStatusSchema,
    timeout: definedNonNullAnySchema.nullish()
  })
}

export function MountSchema(): z.ZodObject<Properties<Mount>> {
  return z.object({
    __typename: z.literal('Mount').optional(),
    directory: definedNonNullAnySchema.nullish(),
    name: definedNonNullAnySchema.nullish(),
    permissions: definedNonNullAnySchema.nullish(),
    type: definedNonNullAnySchema.nullish()
  })
}

export function NetworkSchema(): z.ZodObject<Properties<Network>> {
  return z.object({
    __typename: z.literal('Network').optional(),
    carrierChanges: definedNonNullAnySchema.nullish(),
    duplex: definedNonNullAnySchema.nullish(),
    iface: definedNonNullAnySchema.nullish(),
    ifaceName: definedNonNullAnySchema.nullish(),
    internal: definedNonNullAnySchema.nullish(),
    ipv4: definedNonNullAnySchema.nullish(),
    ipv6: definedNonNullAnySchema.nullish(),
    mac: definedNonNullAnySchema.nullish(),
    mtu: definedNonNullAnySchema.nullish(),
    operstate: definedNonNullAnySchema.nullish(),
    speed: definedNonNullAnySchema.nullish(),
    type: definedNonNullAnySchema.nullish()
  })
}

export function NotificationSchema(): z.ZodObject<Properties<Notification>> {
  return z.object({
    __typename: z.literal('Notification').optional(),
    description: definedNonNullAnySchema,
    id: definedNonNullAnySchema,
    importance: ImportanceSchema,
    link: definedNonNullAnySchema.nullish(),
    subject: definedNonNullAnySchema,
    timestamp: definedNonNullAnySchema.nullish(),
    title: definedNonNullAnySchema,
    type: NotificationTypeSchema
  })
}

export function NotificationFilterSchema(): z.ZodObject<Properties<NotificationFilter>> {
  return z.object({
    importance: ImportanceSchema.nullish(),
    limit: definedNonNullAnySchema,
    offset: definedNonNullAnySchema,
    type: NotificationTypeSchema.nullish()
  })
}

export function NotificationInputSchema(): z.ZodObject<Properties<NotificationInput>> {
  return z.object({
    description: definedNonNullAnySchema.nullish(),
    id: definedNonNullAnySchema,
    importance: ImportanceSchema,
    link: definedNonNullAnySchema.nullish(),
    subject: definedNonNullAnySchema,
    timestamp: definedNonNullAnySchema.nullish(),
    title: definedNonNullAnySchema,
    type: NotificationTypeSchema
  })
}

export function OsSchema(): z.ZodObject<Properties<Os>> {
  return z.object({
    __typename: z.literal('Os').optional(),
    arch: definedNonNullAnySchema.nullish(),
    build: definedNonNullAnySchema.nullish(),
    codename: definedNonNullAnySchema.nullish(),
    codepage: definedNonNullAnySchema.nullish(),
    distro: definedNonNullAnySchema.nullish(),
    hostname: definedNonNullAnySchema.nullish(),
    kernel: definedNonNullAnySchema.nullish(),
    logofile: definedNonNullAnySchema.nullish(),
    platform: definedNonNullAnySchema.nullish(),
    release: definedNonNullAnySchema.nullish(),
    serial: definedNonNullAnySchema.nullish(),
    uptime: definedNonNullAnySchema.nullish()
  })
}

export function OwnerSchema(): z.ZodObject<Properties<Owner>> {
  return z.object({
    __typename: z.literal('Owner').optional(),
    avatar: definedNonNullAnySchema.nullish(),
    url: definedNonNullAnySchema.nullish(),
    username: definedNonNullAnySchema.nullish()
  })
}

export function ParityCheckSchema(): z.ZodObject<Properties<ParityCheck>> {
  return z.object({
    __typename: z.literal('ParityCheck').optional(),
    date: definedNonNullAnySchema,
    duration: definedNonNullAnySchema,
    errors: definedNonNullAnySchema,
    speed: definedNonNullAnySchema,
    status: definedNonNullAnySchema
  })
}

export function PartitionSchema(): z.ZodObject<Properties<Partition>> {
  return z.object({
    __typename: z.literal('Partition').optional(),
    devlinks: definedNonNullAnySchema.nullish(),
    devname: definedNonNullAnySchema.nullish(),
    devpath: definedNonNullAnySchema.nullish(),
    devtype: definedNonNullAnySchema.nullish(),
    idAta: definedNonNullAnySchema.nullish(),
    idAtaDownloadMicrocode: definedNonNullAnySchema.nullish(),
    idAtaFeatureSetAam: definedNonNullAnySchema.nullish(),
    idAtaFeatureSetAamCurrentValue: definedNonNullAnySchema.nullish(),
    idAtaFeatureSetAamEnabled: definedNonNullAnySchema.nullish(),
    idAtaFeatureSetAamVendorRecommendedValue: definedNonNullAnySchema.nullish(),
    idAtaFeatureSetApm: definedNonNullAnySchema.nullish(),
    idAtaFeatureSetApmCurrentValue: definedNonNullAnySchema.nullish(),
    idAtaFeatureSetApmEnabled: definedNonNullAnySchema.nullish(),
    idAtaFeatureSetHpa: definedNonNullAnySchema.nullish(),
    idAtaFeatureSetHpaEnabled: definedNonNullAnySchema.nullish(),
    idAtaFeatureSetPm: definedNonNullAnySchema.nullish(),
    idAtaFeatureSetPmEnabled: definedNonNullAnySchema.nullish(),
    idAtaFeatureSetPuis: definedNonNullAnySchema.nullish(),
    idAtaFeatureSetPuisEnabled: definedNonNullAnySchema.nullish(),
    idAtaFeatureSetSecurity: definedNonNullAnySchema.nullish(),
    idAtaFeatureSetSecurityEnabled: definedNonNullAnySchema.nullish(),
    idAtaFeatureSetSecurityEnhancedEraseUnitMin: definedNonNullAnySchema.nullish(),
    idAtaFeatureSetSecurityEraseUnitMin: definedNonNullAnySchema.nullish(),
    idAtaFeatureSetSmart: definedNonNullAnySchema.nullish(),
    idAtaFeatureSetSmartEnabled: definedNonNullAnySchema.nullish(),
    idAtaRotationRateRpm: definedNonNullAnySchema.nullish(),
    idAtaSata: definedNonNullAnySchema.nullish(),
    idAtaSataSignalRateGen1: definedNonNullAnySchema.nullish(),
    idAtaSataSignalRateGen2: definedNonNullAnySchema.nullish(),
    idAtaWriteCache: definedNonNullAnySchema.nullish(),
    idAtaWriteCacheEnabled: definedNonNullAnySchema.nullish(),
    idBus: definedNonNullAnySchema.nullish(),
    idFsType: definedNonNullAnySchema.nullish(),
    idFsUsage: definedNonNullAnySchema.nullish(),
    idFsUuid: definedNonNullAnySchema.nullish(),
    idFsUuidEnc: definedNonNullAnySchema.nullish(),
    idModel: definedNonNullAnySchema.nullish(),
    idModelEnc: definedNonNullAnySchema.nullish(),
    idPartEntryDisk: definedNonNullAnySchema.nullish(),
    idPartEntryNumber: definedNonNullAnySchema.nullish(),
    idPartEntryOffset: definedNonNullAnySchema.nullish(),
    idPartEntryScheme: definedNonNullAnySchema.nullish(),
    idPartEntrySize: definedNonNullAnySchema.nullish(),
    idPartEntryType: definedNonNullAnySchema.nullish(),
    idPartTableType: definedNonNullAnySchema.nullish(),
    idPath: definedNonNullAnySchema.nullish(),
    idPathTag: definedNonNullAnySchema.nullish(),
    idRevision: definedNonNullAnySchema.nullish(),
    idSerial: definedNonNullAnySchema.nullish(),
    idSerialShort: definedNonNullAnySchema.nullish(),
    idType: definedNonNullAnySchema.nullish(),
    idWwn: definedNonNullAnySchema.nullish(),
    idWwnWithExtension: definedNonNullAnySchema.nullish(),
    major: definedNonNullAnySchema.nullish(),
    minor: definedNonNullAnySchema.nullish(),
    partn: definedNonNullAnySchema.nullish(),
    subsystem: definedNonNullAnySchema.nullish(),
    usecInitialized: definedNonNullAnySchema.nullish()
  })
}

export function PciSchema(): z.ZodObject<Properties<Pci>> {
  return z.object({
    __typename: z.literal('Pci').optional(),
    blacklisted: definedNonNullAnySchema.nullish(),
    class: definedNonNullAnySchema.nullish(),
    id: definedNonNullAnySchema,
    productid: definedNonNullAnySchema.nullish(),
    productname: definedNonNullAnySchema.nullish(),
    type: definedNonNullAnySchema.nullish(),
    typeid: definedNonNullAnySchema.nullish(),
    vendorid: definedNonNullAnySchema.nullish(),
    vendorname: definedNonNullAnySchema.nullish()
  })
}

export function PermissionsSchema(): z.ZodObject<Properties<Permissions>> {
  return z.object({
    __typename: z.literal('Permissions').optional(),
    grants: definedNonNullAnySchema.nullish(),
    scopes: definedNonNullAnySchema.nullish()
  })
}

export function ProfileModelSchema(): z.ZodObject<Properties<ProfileModel>> {
  return z.object({
    __typename: z.literal('ProfileModel').optional(),
    avatar: definedNonNullAnySchema.nullish(),
    url: definedNonNullAnySchema.nullish(),
    userId: definedNonNullAnySchema.nullish(),
    username: definedNonNullAnySchema.nullish()
  })
}

export function RegistrationSchema(): z.ZodObject<Properties<Registration>> {
  return z.object({
    __typename: z.literal('Registration').optional(),
    expiration: definedNonNullAnySchema.nullish(),
    guid: definedNonNullAnySchema.nullish(),
    keyFile: KeyFileSchema().nullish(),
    state: RegistrationStateSchema.nullish(),
    type: registrationTypeSchema.nullish()
  })
}

export function RelayResponseSchema(): z.ZodObject<Properties<RelayResponse>> {
  return z.object({
    __typename: z.literal('RelayResponse').optional(),
    error: definedNonNullAnySchema.nullish(),
    status: definedNonNullAnySchema,
    timeout: definedNonNullAnySchema.nullish()
  })
}

export function ScopeSchema(): z.ZodObject<Properties<Scope>> {
  return z.object({
    __typename: z.literal('Scope').optional(),
    description: definedNonNullAnySchema.nullish(),
    name: definedNonNullAnySchema.nullish()
  })
}

export function ServerSchema(): z.ZodObject<Properties<Server>> {
  return z.object({
    __typename: z.literal('Server').optional(),
    apikey: definedNonNullAnySchema,
    guid: definedNonNullAnySchema,
    lanip: definedNonNullAnySchema,
    localurl: definedNonNullAnySchema,
    name: definedNonNullAnySchema,
    owner: ProfileModelSchema(),
    remoteurl: definedNonNullAnySchema,
    status: ServerStatusSchema,
    wanip: definedNonNullAnySchema
  })
}

export function ServiceSchema(): z.ZodObject<Properties<Service>> {
  return z.object({
    __typename: z.literal('Service').optional(),
    name: definedNonNullAnySchema.nullish(),
    online: definedNonNullAnySchema.nullish(),
    uptime: UptimeSchema().nullish(),
    version: definedNonNullAnySchema.nullish()
  })
}

export function SetupRemoteAccessInputSchema(): z.ZodObject<Properties<SetupRemoteAccessInput>> {
  return z.object({
    accessType: WAN_ACCESS_TYPESchema,
    forwardType: WAN_FORWARD_TYPESchema.nullish(),
    port: definedNonNullAnySchema.nullish()
  })
}

export function ShareSchema(): z.ZodObject<Properties<Share>> {
  return z.object({
    __typename: z.literal('Share').optional(),
    allocator: definedNonNullAnySchema.nullish(),
    cache: definedNonNullAnySchema.nullish(),
    color: definedNonNullAnySchema.nullish(),
    comment: definedNonNullAnySchema.nullish(),
    cow: definedNonNullAnySchema.nullish(),
    exclude: z.array(definedNonNullAnySchema.nullable()).nullish(),
    floor: definedNonNullAnySchema.nullish(),
    free: definedNonNullAnySchema.nullish(),
    include: z.array(definedNonNullAnySchema.nullable()).nullish(),
    luksStatus: definedNonNullAnySchema.nullish(),
    name: definedNonNullAnySchema.nullish(),
    nameOrig: definedNonNullAnySchema.nullish(),
    size: definedNonNullAnySchema.nullish(),
    splitLevel: definedNonNullAnySchema.nullish(),
    used: definedNonNullAnySchema.nullish()
  })
}

export function SystemSchema(): z.ZodObject<Properties<System>> {
  return z.object({
    __typename: z.literal('System').optional(),
    manufacturer: definedNonNullAnySchema.nullish(),
    model: definedNonNullAnySchema.nullish(),
    serial: definedNonNullAnySchema.nullish(),
    sku: definedNonNullAnySchema.nullish(),
    uuid: definedNonNullAnySchema.nullish(),
    version: definedNonNullAnySchema.nullish()
  })
}

export function TwoFactorLocalSchema(): z.ZodObject<Properties<TwoFactorLocal>> {
  return z.object({
    __typename: z.literal('TwoFactorLocal').optional(),
    enabled: definedNonNullAnySchema.nullish()
  })
}

export function TwoFactorRemoteSchema(): z.ZodObject<Properties<TwoFactorRemote>> {
  return z.object({
    __typename: z.literal('TwoFactorRemote').optional(),
    enabled: definedNonNullAnySchema.nullish()
  })
}

export function TwoFactorWithTokenSchema(): z.ZodObject<Properties<TwoFactorWithToken>> {
  return z.object({
    __typename: z.literal('TwoFactorWithToken').optional(),
    local: TwoFactorLocalSchema().nullish(),
    remote: TwoFactorRemoteSchema().nullish(),
    token: definedNonNullAnySchema.nullish()
  })
}

export function TwoFactorWithoutTokenSchema(): z.ZodObject<Properties<TwoFactorWithoutToken>> {
  return z.object({
    __typename: z.literal('TwoFactorWithoutToken').optional(),
    local: TwoFactorLocalSchema().nullish(),
    remote: TwoFactorRemoteSchema().nullish()
  })
}

export function UnassignedDeviceSchema(): z.ZodObject<Properties<UnassignedDevice>> {
  return z.object({
    __typename: z.literal('UnassignedDevice').optional(),
    devlinks: definedNonNullAnySchema.nullish(),
    devname: definedNonNullAnySchema.nullish(),
    devpath: definedNonNullAnySchema.nullish(),
    devtype: definedNonNullAnySchema.nullish(),
    idAta: definedNonNullAnySchema.nullish(),
    idAtaDownloadMicrocode: definedNonNullAnySchema.nullish(),
    idAtaFeatureSetAam: definedNonNullAnySchema.nullish(),
    idAtaFeatureSetAamCurrentValue: definedNonNullAnySchema.nullish(),
    idAtaFeatureSetAamEnabled: definedNonNullAnySchema.nullish(),
    idAtaFeatureSetAamVendorRecommendedValue: definedNonNullAnySchema.nullish(),
    idAtaFeatureSetApm: definedNonNullAnySchema.nullish(),
    idAtaFeatureSetApmCurrentValue: definedNonNullAnySchema.nullish(),
    idAtaFeatureSetApmEnabled: definedNonNullAnySchema.nullish(),
    idAtaFeatureSetHpa: definedNonNullAnySchema.nullish(),
    idAtaFeatureSetHpaEnabled: definedNonNullAnySchema.nullish(),
    idAtaFeatureSetPm: definedNonNullAnySchema.nullish(),
    idAtaFeatureSetPmEnabled: definedNonNullAnySchema.nullish(),
    idAtaFeatureSetPuis: definedNonNullAnySchema.nullish(),
    idAtaFeatureSetPuisEnabled: definedNonNullAnySchema.nullish(),
    idAtaFeatureSetSecurity: definedNonNullAnySchema.nullish(),
    idAtaFeatureSetSecurityEnabled: definedNonNullAnySchema.nullish(),
    idAtaFeatureSetSecurityEnhancedEraseUnitMin: definedNonNullAnySchema.nullish(),
    idAtaFeatureSetSecurityEraseUnitMin: definedNonNullAnySchema.nullish(),
    idAtaFeatureSetSmart: definedNonNullAnySchema.nullish(),
    idAtaFeatureSetSmartEnabled: definedNonNullAnySchema.nullish(),
    idAtaRotationRateRpm: definedNonNullAnySchema.nullish(),
    idAtaSata: definedNonNullAnySchema.nullish(),
    idAtaSataSignalRateGen1: definedNonNullAnySchema.nullish(),
    idAtaSataSignalRateGen2: definedNonNullAnySchema.nullish(),
    idAtaWriteCache: definedNonNullAnySchema.nullish(),
    idAtaWriteCacheEnabled: definedNonNullAnySchema.nullish(),
    idBus: definedNonNullAnySchema.nullish(),
    idModel: definedNonNullAnySchema.nullish(),
    idModelEnc: definedNonNullAnySchema.nullish(),
    idPartTableType: definedNonNullAnySchema.nullish(),
    idPath: definedNonNullAnySchema.nullish(),
    idPathTag: definedNonNullAnySchema.nullish(),
    idRevision: definedNonNullAnySchema.nullish(),
    idSerial: definedNonNullAnySchema.nullish(),
    idSerialShort: definedNonNullAnySchema.nullish(),
    idType: definedNonNullAnySchema.nullish(),
    idWwn: definedNonNullAnySchema.nullish(),
    idWwnWithExtension: definedNonNullAnySchema.nullish(),
    major: definedNonNullAnySchema.nullish(),
    minor: definedNonNullAnySchema.nullish(),
    mount: MountSchema().nullish(),
    mounted: definedNonNullAnySchema.nullish(),
    name: definedNonNullAnySchema.nullish(),
    partitions: z.array(PartitionSchema().nullable()).nullish(),
    subsystem: definedNonNullAnySchema.nullish(),
    temp: definedNonNullAnySchema.nullish(),
    usecInitialized: definedNonNullAnySchema.nullish()
  })
}

export function UptimeSchema(): z.ZodObject<Properties<Uptime>> {
  return z.object({
    __typename: z.literal('Uptime').optional(),
    timestamp: definedNonNullAnySchema.nullish()
  })
}

export function UsbSchema(): z.ZodObject<Properties<Usb>> {
  return z.object({
    __typename: z.literal('Usb').optional(),
    id: definedNonNullAnySchema,
    name: definedNonNullAnySchema.nullish()
  })
}

export function UserSchema(): z.ZodObject<Properties<User>> {
  return z.object({
    __typename: z.literal('User').optional(),
    description: definedNonNullAnySchema,
    id: definedNonNullAnySchema,
    name: definedNonNullAnySchema,
    password: definedNonNullAnySchema.nullish(),
    role: definedNonNullAnySchema
  })
}

export function VarsSchema(): z.ZodObject<Properties<Vars>> {
  return z.object({
    __typename: z.literal('Vars').optional(),
    bindMgt: definedNonNullAnySchema.nullish(),
    cacheNumDevices: definedNonNullAnySchema.nullish(),
    cacheSbNumDisks: definedNonNullAnySchema.nullish(),
    comment: definedNonNullAnySchema.nullish(),
    configError: ConfigErrorStateSchema.nullish(),
    configValid: definedNonNullAnySchema.nullish(),
    csrfToken: definedNonNullAnySchema.nullish(),
    defaultFormat: definedNonNullAnySchema.nullish(),
    defaultFsType: definedNonNullAnySchema.nullish(),
    deviceCount: definedNonNullAnySchema.nullish(),
    domain: definedNonNullAnySchema.nullish(),
    domainLogin: definedNonNullAnySchema.nullish(),
    domainShort: definedNonNullAnySchema.nullish(),
    enableFruit: definedNonNullAnySchema.nullish(),
    flashGuid: definedNonNullAnySchema.nullish(),
    flashProduct: definedNonNullAnySchema.nullish(),
    flashVendor: definedNonNullAnySchema.nullish(),
    fsCopyPrcnt: definedNonNullAnySchema.nullish(),
    fsNumMounted: definedNonNullAnySchema.nullish(),
    fsNumUnmountable: definedNonNullAnySchema.nullish(),
    fsProgress: definedNonNullAnySchema.nullish(),
    fsState: definedNonNullAnySchema.nullish(),
    fsUnmountableMask: definedNonNullAnySchema.nullish(),
    fuseDirectio: definedNonNullAnySchema.nullish(),
    fuseDirectioDefault: definedNonNullAnySchema.nullish(),
    fuseDirectioStatus: definedNonNullAnySchema.nullish(),
    fuseRemember: definedNonNullAnySchema.nullish(),
    fuseRememberDefault: definedNonNullAnySchema.nullish(),
    fuseRememberStatus: definedNonNullAnySchema.nullish(),
    hideDotFiles: definedNonNullAnySchema.nullish(),
    joinStatus: definedNonNullAnySchema.nullish(),
    localMaster: definedNonNullAnySchema.nullish(),
    localTld: definedNonNullAnySchema.nullish(),
    luksKeyfile: definedNonNullAnySchema.nullish(),
    maxArraysz: definedNonNullAnySchema.nullish(),
    maxCachesz: definedNonNullAnySchema.nullish(),
    mdColor: definedNonNullAnySchema.nullish(),
    mdNumDisabled: definedNonNullAnySchema.nullish(),
    mdNumDisks: definedNonNullAnySchema.nullish(),
    mdNumErased: definedNonNullAnySchema.nullish(),
    mdNumInvalid: definedNonNullAnySchema.nullish(),
    mdNumMissing: definedNonNullAnySchema.nullish(),
    mdNumNew: definedNonNullAnySchema.nullish(),
    mdNumStripes: definedNonNullAnySchema.nullish(),
    mdNumStripesDefault: definedNonNullAnySchema.nullish(),
    mdNumStripesStatus: definedNonNullAnySchema.nullish(),
    mdResync: definedNonNullAnySchema.nullish(),
    mdResyncAction: definedNonNullAnySchema.nullish(),
    mdResyncCorr: definedNonNullAnySchema.nullish(),
    mdResyncDb: definedNonNullAnySchema.nullish(),
    mdResyncDt: definedNonNullAnySchema.nullish(),
    mdResyncPos: definedNonNullAnySchema.nullish(),
    mdResyncSize: definedNonNullAnySchema.nullish(),
    mdState: definedNonNullAnySchema.nullish(),
    mdSyncThresh: definedNonNullAnySchema.nullish(),
    mdSyncThreshDefault: definedNonNullAnySchema.nullish(),
    mdSyncThreshStatus: definedNonNullAnySchema.nullish(),
    mdSyncWindow: definedNonNullAnySchema.nullish(),
    mdSyncWindowDefault: definedNonNullAnySchema.nullish(),
    mdSyncWindowStatus: definedNonNullAnySchema.nullish(),
    mdVersion: definedNonNullAnySchema.nullish(),
    mdWriteMethod: definedNonNullAnySchema.nullish(),
    mdWriteMethodDefault: definedNonNullAnySchema.nullish(),
    mdWriteMethodStatus: definedNonNullAnySchema.nullish(),
    name: definedNonNullAnySchema.nullish(),
    nrRequests: definedNonNullAnySchema.nullish(),
    nrRequestsDefault: definedNonNullAnySchema.nullish(),
    nrRequestsStatus: definedNonNullAnySchema.nullish(),
    ntpServer1: definedNonNullAnySchema.nullish(),
    ntpServer2: definedNonNullAnySchema.nullish(),
    ntpServer3: definedNonNullAnySchema.nullish(),
    ntpServer4: definedNonNullAnySchema.nullish(),
    pollAttributes: definedNonNullAnySchema.nullish(),
    pollAttributesDefault: definedNonNullAnySchema.nullish(),
    pollAttributesStatus: definedNonNullAnySchema.nullish(),
    port: definedNonNullAnySchema.nullish(),
    portssh: definedNonNullAnySchema.nullish(),
    portssl: definedNonNullAnySchema.nullish(),
    porttelnet: definedNonNullAnySchema.nullish(),
    queueDepth: definedNonNullAnySchema.nullish(),
    regCheck: definedNonNullAnySchema.nullish(),
    regFile: definedNonNullAnySchema.nullish(),
    regGen: definedNonNullAnySchema.nullish(),
    regGuid: definedNonNullAnySchema.nullish(),
    regState: RegistrationStateSchema.nullish(),
    regTm: definedNonNullAnySchema.nullish(),
    regTm2: definedNonNullAnySchema.nullish(),
    regTo: definedNonNullAnySchema.nullish(),
    regTy: definedNonNullAnySchema.nullish(),
    safeMode: definedNonNullAnySchema.nullish(),
    sbClean: definedNonNullAnySchema.nullish(),
    sbEvents: definedNonNullAnySchema.nullish(),
    sbName: definedNonNullAnySchema.nullish(),
    sbNumDisks: definedNonNullAnySchema.nullish(),
    sbState: definedNonNullAnySchema.nullish(),
    sbSyncErrs: definedNonNullAnySchema.nullish(),
    sbSyncExit: definedNonNullAnySchema.nullish(),
    sbSynced: definedNonNullAnySchema.nullish(),
    sbSynced2: definedNonNullAnySchema.nullish(),
    sbUpdated: definedNonNullAnySchema.nullish(),
    sbVersion: definedNonNullAnySchema.nullish(),
    security: definedNonNullAnySchema.nullish(),
    shareAfpCount: definedNonNullAnySchema.nullish(),
    shareAfpEnabled: definedNonNullAnySchema.nullish(),
    shareAvahiAfpModel: definedNonNullAnySchema.nullish(),
    shareAvahiAfpName: definedNonNullAnySchema.nullish(),
    shareAvahiEnabled: definedNonNullAnySchema.nullish(),
    shareAvahiSmbModel: definedNonNullAnySchema.nullish(),
    shareAvahiSmbName: definedNonNullAnySchema.nullish(),
    shareCacheEnabled: definedNonNullAnySchema.nullish(),
    shareCacheFloor: definedNonNullAnySchema.nullish(),
    shareCount: definedNonNullAnySchema.nullish(),
    shareDisk: definedNonNullAnySchema.nullish(),
    shareInitialGroup: definedNonNullAnySchema.nullish(),
    shareInitialOwner: definedNonNullAnySchema.nullish(),
    shareMoverActive: definedNonNullAnySchema.nullish(),
    shareMoverLogging: definedNonNullAnySchema.nullish(),
    shareMoverSchedule: definedNonNullAnySchema.nullish(),
    shareNfsCount: definedNonNullAnySchema.nullish(),
    shareNfsEnabled: definedNonNullAnySchema.nullish(),
    shareSmbCount: definedNonNullAnySchema.nullish(),
    shareSmbEnabled: definedNonNullAnySchema.nullish(),
    shareUser: definedNonNullAnySchema.nullish(),
    shareUserExclude: definedNonNullAnySchema.nullish(),
    shareUserInclude: definedNonNullAnySchema.nullish(),
    shutdownTimeout: definedNonNullAnySchema.nullish(),
    spindownDelay: definedNonNullAnySchema.nullish(),
    spinupGroups: definedNonNullAnySchema.nullish(),
    startArray: definedNonNullAnySchema.nullish(),
    startMode: definedNonNullAnySchema.nullish(),
    startPage: definedNonNullAnySchema.nullish(),
    sysArraySlots: definedNonNullAnySchema.nullish(),
    sysCacheSlots: definedNonNullAnySchema.nullish(),
    sysFlashSlots: definedNonNullAnySchema.nullish(),
    sysModel: definedNonNullAnySchema.nullish(),
    timeZone: definedNonNullAnySchema.nullish(),
    useNtp: definedNonNullAnySchema.nullish(),
    useSsh: definedNonNullAnySchema.nullish(),
    useSsl: definedNonNullAnySchema.nullish(),
    useTelnet: definedNonNullAnySchema.nullish(),
    version: definedNonNullAnySchema.nullish(),
    workgroup: definedNonNullAnySchema.nullish()
  })
}

export function VersionsSchema(): z.ZodObject<Properties<Versions>> {
  return z.object({
    __typename: z.literal('Versions').optional(),
    apache: definedNonNullAnySchema.nullish(),
    docker: definedNonNullAnySchema.nullish(),
    gcc: definedNonNullAnySchema.nullish(),
    git: definedNonNullAnySchema.nullish(),
    grunt: definedNonNullAnySchema.nullish(),
    gulp: definedNonNullAnySchema.nullish(),
    kernel: definedNonNullAnySchema.nullish(),
    mongodb: definedNonNullAnySchema.nullish(),
    mysql: definedNonNullAnySchema.nullish(),
    nginx: definedNonNullAnySchema.nullish(),
    node: definedNonNullAnySchema.nullish(),
    npm: definedNonNullAnySchema.nullish(),
    openssl: definedNonNullAnySchema.nullish(),
    perl: definedNonNullAnySchema.nullish(),
    php: definedNonNullAnySchema.nullish(),
    pm2: definedNonNullAnySchema.nullish(),
    postfix: definedNonNullAnySchema.nullish(),
    postgresql: definedNonNullAnySchema.nullish(),
    python: definedNonNullAnySchema.nullish(),
    redis: definedNonNullAnySchema.nullish(),
    systemOpenssl: definedNonNullAnySchema.nullish(),
    systemOpensslLib: definedNonNullAnySchema.nullish(),
    tsc: definedNonNullAnySchema.nullish(),
    unraid: definedNonNullAnySchema.nullish(),
    v8: definedNonNullAnySchema.nullish(),
    yarn: definedNonNullAnySchema.nullish()
  })
}

export function VmDomainSchema(): z.ZodObject<Properties<VmDomain>> {
  return z.object({
    __typename: z.literal('VmDomain').optional(),
    name: definedNonNullAnySchema.nullish(),
    state: VmStateSchema,
    uuid: definedNonNullAnySchema
  })
}

export function VmNetworkSchema(): z.ZodObject<Properties<VmNetwork>> {
  return z.object({
    __typename: z.literal('VmNetwork').optional(),
    _placeholderType: definedNonNullAnySchema.nullish()
  })
}

export function VmsSchema(): z.ZodObject<Properties<Vms>> {
  return z.object({
    __typename: z.literal('Vms').optional(),
    domain: z.array(VmDomainSchema()).nullish()
  })
}

export function WelcomeSchema(): z.ZodObject<Properties<Welcome>> {
  return z.object({
    __typename: z.literal('Welcome').optional(),
    message: definedNonNullAnySchema
  })
}

export function addApiKeyInputSchema(): z.ZodObject<Properties<addApiKeyInput>> {
  return z.object({
    key: definedNonNullAnySchema.nullish(),
    name: definedNonNullAnySchema.nullish(),
    userId: definedNonNullAnySchema.nullish()
  })
}

export function addScopeInputSchema(): z.ZodObject<Properties<addScopeInput>> {
  return z.object({
    description: definedNonNullAnySchema.nullish(),
    name: definedNonNullAnySchema
  })
}

export function addScopeToApiKeyInputSchema(): z.ZodObject<Properties<addScopeToApiKeyInput>> {
  return z.object({
    apiKey: definedNonNullAnySchema,
    name: definedNonNullAnySchema
  })
}

export function addUserInputSchema(): z.ZodObject<Properties<addUserInput>> {
  return z.object({
    description: definedNonNullAnySchema.nullish(),
    name: definedNonNullAnySchema,
    password: definedNonNullAnySchema
  })
}

export function arrayDiskInputSchema(): z.ZodObject<Properties<arrayDiskInput>> {
  return z.object({
    id: definedNonNullAnySchema,
    slot: definedNonNullAnySchema.nullish()
  })
}

export function authenticateInputSchema(): z.ZodObject<Properties<authenticateInput>> {
  return z.object({
    password: definedNonNullAnySchema
  })
}

export function deleteUserInputSchema(): z.ZodObject<Properties<deleteUserInput>> {
  return z.object({
    name: definedNonNullAnySchema
  })
}

export function updateApikeyInputSchema(): z.ZodObject<Properties<updateApikeyInput>> {
  return z.object({
    description: definedNonNullAnySchema.nullish(),
    expiresAt: definedNonNullAnySchema
  })
}

export function usersInputSchema(): z.ZodObject<Properties<usersInput>> {
  return z.object({
    slim: definedNonNullAnySchema.nullish()
  })
}

export type getCloudQueryVariables = Types.Exact<{ [key: string]: never; }>;


export type getCloudQuery = { __typename?: 'Query', cloud?: { __typename?: 'Cloud', error?: string | null, allowedOrigins: Array<string>, apiKey: { __typename?: 'ApiKeyResponse', valid: boolean, error?: string | null }, minigraphql: { __typename?: 'MinigraphqlResponse', status: Types.MinigraphStatus, timeout?: number | null, error?: string | null }, cloud: { __typename?: 'CloudResponse', status: string, error?: string | null, ip?: string | null } } | null };

export type getServersQueryVariables = Types.Exact<{ [key: string]: never; }>;


export type getServersQuery = { __typename?: 'Query', servers: Array<{ __typename?: 'Server', name: string, guid: string, status: Types.ServerStatus, owner: { __typename?: 'ProfileModel', username?: string | null } }> };


export const getCloudDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"getCloud"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"cloud"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"error"}},{"kind":"Field","name":{"kind":"Name","value":"apiKey"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"valid"}},{"kind":"Field","name":{"kind":"Name","value":"error"}}]}},{"kind":"Field","name":{"kind":"Name","value":"minigraphql"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"timeout"}},{"kind":"Field","name":{"kind":"Name","value":"error"}}]}},{"kind":"Field","name":{"kind":"Name","value":"cloud"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"error"}},{"kind":"Field","name":{"kind":"Name","value":"ip"}}]}},{"kind":"Field","name":{"kind":"Name","value":"allowedOrigins"}}]}}]}}]} as unknown as DocumentNode<getCloudQuery, getCloudQueryVariables>;
export const getServersDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"getServers"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"servers"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"guid"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"owner"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"username"}}]}}]}}]}}]} as unknown as DocumentNode<getServersQuery, getServersQueryVariables>;