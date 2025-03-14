/* eslint-disable */
import * as Types from '@app/graphql/generated/api/types.js';

import { z } from 'zod'
import { AccessUrl, AccessUrlInput, AddPermissionInput, AddRoleForApiKeyInput, AddRoleForUserInput, AllowedOriginInput, ApiKey, ApiKeyResponse, ApiKeyWithSecret, ApiSettingsInput, ArrayType, ArrayCapacity, ArrayDisk, ArrayDiskFsColor, ArrayDiskStatus, ArrayDiskType, ArrayPendingState, ArrayState, Baseboard, Capacity, Case, Cloud, CloudResponse, Config, ConfigErrorState, Connect, ConnectSettings, ConnectSettingsValues, ConnectSignInInput, ConnectUserInfoInput, ContainerHostConfig, ContainerMount, ContainerPort, ContainerPortType, ContainerState, CreateApiKeyInput, Devices, Disk, DiskFsType, DiskInterfaceType, DiskPartition, DiskSmartStatus, Display, Docker, DockerContainer, DockerNetwork, DynamicRemoteAccessStatus, DynamicRemoteAccessType, EnableDynamicRemoteAccessInput, Flash, Gpu, Importance, Info, InfoApps, InfoCpu, InfoMemory, KeyFile, Me, MemoryFormFactor, MemoryLayout, MemoryType, MinigraphStatus, MinigraphqlResponse, Mount, Network, Node, Notification, NotificationCounts, NotificationData, NotificationFilter, NotificationOverview, NotificationType, Notifications, NotificationslistArgs, Os, Owner, ParityCheck, Partition, Pci, Permission, ProfileModel, Registration, RegistrationState, RelayResponse, RemoteAccess, RemoveRoleFromApiKeyInput, Resource, Role, Server, ServerStatus, Service, SetupRemoteAccessInput, Share, System, Temperature, Theme, URL_TYPE, UnassignedDevice, Uptime, Usb, User, UserAccount, Vars, Versions, VmDomain, VmState, Vms, WAN_ACCESS_TYPE, WAN_FORWARD_TYPE, Welcome, addUserInput, arrayDiskInput, deleteUserInput, mdState, registrationType, usersInput } from '@app/graphql/generated/api/types.js'
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

export const DynamicRemoteAccessTypeSchema = z.nativeEnum(DynamicRemoteAccessType);

export const ImportanceSchema = z.nativeEnum(Importance);

export const MemoryFormFactorSchema = z.nativeEnum(MemoryFormFactor);

export const MemoryTypeSchema = z.nativeEnum(MemoryType);

export const MinigraphStatusSchema = z.nativeEnum(MinigraphStatus);

export const NotificationTypeSchema = z.nativeEnum(NotificationType);

export const RegistrationStateSchema = z.nativeEnum(RegistrationState);

export const ResourceSchema = z.nativeEnum(Resource);

export const RoleSchema = z.nativeEnum(Role);

export const ServerStatusSchema = z.nativeEnum(ServerStatus);

export const TemperatureSchema = z.nativeEnum(Temperature);

export const ThemeSchema = z.nativeEnum(Theme);

export const URL_TYPESchema = z.nativeEnum(URL_TYPE);

export const VmStateSchema = z.nativeEnum(VmState);

export const WAN_ACCESS_TYPESchema = z.nativeEnum(WAN_ACCESS_TYPE);

export const WAN_FORWARD_TYPESchema = z.nativeEnum(WAN_FORWARD_TYPE);

export const mdStateSchema = z.nativeEnum(mdState);

export const registrationTypeSchema = z.nativeEnum(registrationType);

export function AccessUrlSchema(): z.ZodObject<Properties<AccessUrl>> {
  return z.object({
    __typename: z.literal('AccessUrl').optional(),
    ipv4: z.instanceof(URL).nullish(),
    ipv6: z.instanceof(URL).nullish(),
    name: z.string().nullish(),
    type: URL_TYPESchema
  })
}

export function AccessUrlInputSchema(): z.ZodObject<Properties<AccessUrlInput>> {
  return z.object({
    ipv4: z.instanceof(URL).nullish(),
    ipv6: z.instanceof(URL).nullish(),
    name: z.string().nullish(),
    type: URL_TYPESchema
  })
}

export function AddPermissionInputSchema(): z.ZodObject<Properties<AddPermissionInput>> {
  return z.object({
    actions: z.array(z.string()),
    resource: ResourceSchema
  })
}

export function AddRoleForApiKeyInputSchema(): z.ZodObject<Properties<AddRoleForApiKeyInput>> {
  return z.object({
    apiKeyId: z.string(),
    role: RoleSchema
  })
}

export function AddRoleForUserInputSchema(): z.ZodObject<Properties<AddRoleForUserInput>> {
  return z.object({
    role: RoleSchema,
    userId: z.string()
  })
}

export function AllowedOriginInputSchema(): z.ZodObject<Properties<AllowedOriginInput>> {
  return z.object({
    origins: z.array(z.string())
  })
}

export function ApiKeySchema(): z.ZodObject<Properties<ApiKey>> {
  return z.object({
    __typename: z.literal('ApiKey').optional(),
    createdAt: z.string(),
    description: z.string().nullish(),
    id: z.string(),
    name: z.string(),
    permissions: z.array(PermissionSchema()),
    roles: z.array(RoleSchema)
  })
}

export function ApiKeyResponseSchema(): z.ZodObject<Properties<ApiKeyResponse>> {
  return z.object({
    __typename: z.literal('ApiKeyResponse').optional(),
    error: z.string().nullish(),
    valid: z.boolean()
  })
}

export function ApiKeyWithSecretSchema(): z.ZodObject<Properties<ApiKeyWithSecret>> {
  return z.object({
    __typename: z.literal('ApiKeyWithSecret').optional(),
    createdAt: z.string(),
    description: z.string().nullish(),
    id: z.string(),
    key: z.string(),
    name: z.string(),
    permissions: z.array(PermissionSchema()),
    roles: z.array(RoleSchema)
  })
}

export function ApiSettingsInputSchema(): z.ZodObject<Properties<ApiSettingsInput>> {
  return z.object({
    accessType: WAN_ACCESS_TYPESchema.nullish(),
    extraOrigins: z.array(z.string()).nullish(),
    forwardType: WAN_FORWARD_TYPESchema.nullish(),
    port: z.number().nullish(),
    sandbox: z.boolean().nullish()
  })
}

export function ArrayTypeSchema(): z.ZodObject<Properties<ArrayType>> {
  return z.object({
    __typename: z.literal('Array').optional(),
    boot: ArrayDiskSchema().nullish(),
    caches: z.array(ArrayDiskSchema()),
    capacity: ArrayCapacitySchema(),
    disks: z.array(ArrayDiskSchema()),
    id: z.string(),
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
    comment: z.string().nullish(),
    critical: z.number().nullish(),
    device: z.string().nullish(),
    exportable: z.boolean().nullish(),
    format: z.string().nullish(),
    fsFree: z.number().nullish(),
    fsSize: z.number().nullish(),
    fsType: z.string().nullish(),
    fsUsed: z.number().nullish(),
    id: z.string(),
    idx: z.number(),
    name: z.string().nullish(),
    numErrors: z.number(),
    numReads: z.number(),
    numWrites: z.number(),
    rotational: z.boolean().nullish(),
    size: z.number(),
    status: ArrayDiskStatusSchema.nullish(),
    temp: z.number().nullish(),
    transport: z.string().nullish(),
    type: ArrayDiskTypeSchema,
    warning: z.number().nullish()
  })
}

export function BaseboardSchema(): z.ZodObject<Properties<Baseboard>> {
  return z.object({
    __typename: z.literal('Baseboard').optional(),
    assetTag: z.string().nullish(),
    manufacturer: z.string(),
    model: z.string().nullish(),
    serial: z.string().nullish(),
    version: z.string().nullish()
  })
}

export function CapacitySchema(): z.ZodObject<Properties<Capacity>> {
  return z.object({
    __typename: z.literal('Capacity').optional(),
    free: z.string(),
    total: z.string(),
    used: z.string()
  })
}

export function CaseSchema(): z.ZodObject<Properties<Case>> {
  return z.object({
    __typename: z.literal('Case').optional(),
    base64: z.string().nullish(),
    error: z.string().nullish(),
    icon: z.string().nullish(),
    url: z.string().nullish()
  })
}

export function CloudSchema(): z.ZodObject<Properties<Cloud>> {
  return z.object({
    __typename: z.literal('Cloud').optional(),
    allowedOrigins: z.array(z.string()),
    apiKey: ApiKeyResponseSchema(),
    cloud: CloudResponseSchema(),
    error: z.string().nullish(),
    minigraphql: MinigraphqlResponseSchema(),
    relay: RelayResponseSchema().nullish()
  })
}

export function CloudResponseSchema(): z.ZodObject<Properties<CloudResponse>> {
  return z.object({
    __typename: z.literal('CloudResponse').optional(),
    error: z.string().nullish(),
    ip: z.string().nullish(),
    status: z.string()
  })
}

export function ConfigSchema(): z.ZodObject<Properties<Config>> {
  return z.object({
    __typename: z.literal('Config').optional(),
    error: ConfigErrorStateSchema.nullish(),
    id: z.string(),
    valid: z.boolean().nullish()
  })
}

export function ConnectSchema(): z.ZodObject<Properties<Connect>> {
  return z.object({
    __typename: z.literal('Connect').optional(),
    dynamicRemoteAccess: DynamicRemoteAccessStatusSchema(),
    id: z.string(),
    settings: ConnectSettingsSchema()
  })
}

export function ConnectSettingsSchema(): z.ZodObject<Properties<ConnectSettings>> {
  return z.object({
    __typename: z.literal('ConnectSettings').optional(),
    dataSchema: z.record(z.string(), z.any()),
    id: z.string(),
    uiSchema: z.record(z.string(), z.any()),
    values: ConnectSettingsValuesSchema()
  })
}

export function ConnectSettingsValuesSchema(): z.ZodObject<Properties<ConnectSettingsValues>> {
  return z.object({
    __typename: z.literal('ConnectSettingsValues').optional(),
    accessType: WAN_ACCESS_TYPESchema,
    extraOrigins: z.array(z.string()),
    forwardType: WAN_FORWARD_TYPESchema.nullish(),
    port: z.number().nullish(),
    sandbox: z.boolean()
  })
}

export function ConnectSignInInputSchema(): z.ZodObject<Properties<ConnectSignInInput>> {
  return z.object({
    accessToken: z.string().nullish(),
    apiKey: z.string(),
    idToken: z.string().nullish(),
    refreshToken: z.string().nullish(),
    userInfo: z.lazy(() => ConnectUserInfoInputSchema().nullish())
  })
}

export function ConnectUserInfoInputSchema(): z.ZodObject<Properties<ConnectUserInfoInput>> {
  return z.object({
    avatar: z.string().nullish(),
    email: z.string(),
    preferred_username: z.string()
  })
}

export function ContainerHostConfigSchema(): z.ZodObject<Properties<ContainerHostConfig>> {
  return z.object({
    __typename: z.literal('ContainerHostConfig').optional(),
    networkMode: z.string()
  })
}

export function ContainerMountSchema(): z.ZodObject<Properties<ContainerMount>> {
  return z.object({
    __typename: z.literal('ContainerMount').optional(),
    destination: z.string(),
    driver: z.string(),
    mode: z.string(),
    name: z.string(),
    propagation: z.string(),
    rw: z.boolean(),
    source: z.string(),
    type: z.string()
  })
}

export function ContainerPortSchema(): z.ZodObject<Properties<ContainerPort>> {
  return z.object({
    __typename: z.literal('ContainerPort').optional(),
    ip: z.string().nullish(),
    privatePort: z.number().nullish(),
    publicPort: z.number().nullish(),
    type: ContainerPortTypeSchema.nullish()
  })
}

export function CreateApiKeyInputSchema(): z.ZodObject<Properties<CreateApiKeyInput>> {
  return z.object({
    description: z.string().nullish(),
    name: z.string(),
    overwrite: z.boolean().nullish(),
    permissions: z.array(z.lazy(() => AddPermissionInputSchema())).nullish(),
    roles: z.array(RoleSchema).nullish()
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
    bytesPerSector: z.number(),
    device: z.string(),
    firmwareRevision: z.string(),
    id: z.string(),
    interfaceType: DiskInterfaceTypeSchema,
    name: z.string(),
    partitions: z.array(DiskPartitionSchema()).nullish(),
    sectorsPerTrack: z.number(),
    serialNum: z.string(),
    size: z.number(),
    smartStatus: DiskSmartStatusSchema,
    temperature: z.number(),
    totalCylinders: z.number(),
    totalHeads: z.number(),
    totalSectors: z.number(),
    totalTracks: z.number(),
    tracksPerCylinder: z.number(),
    type: z.string(),
    vendor: z.string()
  })
}

export function DiskPartitionSchema(): z.ZodObject<Properties<DiskPartition>> {
  return z.object({
    __typename: z.literal('DiskPartition').optional(),
    fsType: DiskFsTypeSchema,
    name: z.string(),
    size: z.number()
  })
}

export function DisplaySchema(): z.ZodObject<Properties<Display>> {
  return z.object({
    __typename: z.literal('Display').optional(),
    banner: z.string().nullish(),
    case: CaseSchema().nullish(),
    critical: z.number().nullish(),
    dashapps: z.string().nullish(),
    date: z.string().nullish(),
    hot: z.number().nullish(),
    id: z.string(),
    locale: z.string().nullish(),
    max: z.number().nullish(),
    number: z.string().nullish(),
    resize: z.boolean().nullish(),
    scale: z.boolean().nullish(),
    tabs: z.boolean().nullish(),
    text: z.boolean().nullish(),
    theme: ThemeSchema.nullish(),
    total: z.boolean().nullish(),
    unit: TemperatureSchema.nullish(),
    usage: z.boolean().nullish(),
    users: z.string().nullish(),
    warning: z.number().nullish(),
    wwn: z.boolean().nullish()
  })
}

export function DockerSchema(): z.ZodObject<Properties<Docker>> {
  return z.object({
    __typename: z.literal('Docker').optional(),
    containers: z.array(DockerContainerSchema()).nullish(),
    id: z.string(),
    networks: z.array(DockerNetworkSchema()).nullish()
  })
}

export function DockerContainerSchema(): z.ZodObject<Properties<DockerContainer>> {
  return z.object({
    __typename: z.literal('DockerContainer').optional(),
    autoStart: z.boolean(),
    command: z.string(),
    created: z.number(),
    hostConfig: ContainerHostConfigSchema().nullish(),
    id: z.string(),
    image: z.string(),
    imageId: z.string(),
    labels: z.record(z.string(), z.any()).nullish(),
    mounts: z.array(z.record(z.string(), z.any()).nullable()).nullish(),
    names: z.array(z.string()).nullish(),
    networkSettings: z.record(z.string(), z.any()).nullish(),
    ports: z.array(ContainerPortSchema()),
    sizeRootFs: z.number().nullish(),
    state: ContainerStateSchema,
    status: z.string()
  })
}

export function DockerNetworkSchema(): z.ZodObject<Properties<DockerNetwork>> {
  return z.object({
    __typename: z.literal('DockerNetwork').optional(),
    attachable: z.boolean(),
    configFrom: z.record(z.string(), z.any()).nullish(),
    configOnly: z.boolean(),
    containers: z.record(z.string(), z.any()).nullish(),
    created: z.string().nullish(),
    driver: z.string().nullish(),
    enableIPv6: z.boolean(),
    id: z.string().nullish(),
    ingress: z.boolean(),
    internal: z.boolean(),
    ipam: z.record(z.string(), z.any()).nullish(),
    labels: z.record(z.string(), z.any()).nullish(),
    name: z.string().nullish(),
    options: z.record(z.string(), z.any()).nullish(),
    scope: z.string().nullish()
  })
}

export function DynamicRemoteAccessStatusSchema(): z.ZodObject<Properties<DynamicRemoteAccessStatus>> {
  return z.object({
    __typename: z.literal('DynamicRemoteAccessStatus').optional(),
    enabledType: DynamicRemoteAccessTypeSchema,
    error: z.string().nullish(),
    runningType: DynamicRemoteAccessTypeSchema
  })
}

export function EnableDynamicRemoteAccessInputSchema(): z.ZodObject<Properties<EnableDynamicRemoteAccessInput>> {
  return z.object({
    enabled: z.boolean(),
    url: z.lazy(() => AccessUrlInputSchema())
  })
}

export function FlashSchema(): z.ZodObject<Properties<Flash>> {
  return z.object({
    __typename: z.literal('Flash').optional(),
    guid: z.string().nullish(),
    product: z.string().nullish(),
    vendor: z.string().nullish()
  })
}

export function GpuSchema(): z.ZodObject<Properties<Gpu>> {
  return z.object({
    __typename: z.literal('Gpu').optional(),
    blacklisted: z.boolean(),
    class: z.string(),
    id: z.string(),
    productid: z.string(),
    type: z.string(),
    typeid: z.string(),
    vendorname: z.string()
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
    id: z.string(),
    machineId: z.string().nullish(),
    memory: InfoMemorySchema().nullish(),
    os: OsSchema().nullish(),
    system: SystemSchema().nullish(),
    time: z.string(),
    versions: VersionsSchema().nullish()
  })
}

export function InfoAppsSchema(): z.ZodObject<Properties<InfoApps>> {
  return z.object({
    __typename: z.literal('InfoApps').optional(),
    installed: z.number().nullish(),
    started: z.number().nullish()
  })
}

export function InfoCpuSchema(): z.ZodObject<Properties<InfoCpu>> {
  return z.object({
    __typename: z.literal('InfoCpu').optional(),
    brand: z.string(),
    cache: z.record(z.string(), z.any()),
    cores: z.number(),
    family: z.string(),
    flags: z.array(z.string()).nullish(),
    manufacturer: z.string(),
    model: z.string(),
    processors: z.number(),
    revision: z.string(),
    socket: z.string(),
    speed: z.number(),
    speedmax: z.number(),
    speedmin: z.number(),
    stepping: z.number(),
    threads: z.number(),
    vendor: z.string(),
    voltage: z.string().nullish()
  })
}

export function InfoMemorySchema(): z.ZodObject<Properties<InfoMemory>> {
  return z.object({
    __typename: z.literal('InfoMemory').optional(),
    active: z.number(),
    available: z.number(),
    buffcache: z.number(),
    free: z.number(),
    layout: z.array(MemoryLayoutSchema()).nullish(),
    max: z.number(),
    swapfree: z.number(),
    swaptotal: z.number(),
    swapused: z.number(),
    total: z.number(),
    used: z.number()
  })
}

export function KeyFileSchema(): z.ZodObject<Properties<KeyFile>> {
  return z.object({
    __typename: z.literal('KeyFile').optional(),
    contents: z.string().nullish(),
    location: z.string().nullish()
  })
}

export function MeSchema(): z.ZodObject<Properties<Me>> {
  return z.object({
    __typename: z.literal('Me').optional(),
    description: z.string(),
    id: z.string(),
    name: z.string(),
    permissions: z.array(PermissionSchema()).nullish(),
    roles: z.array(RoleSchema)
  })
}

export function MemoryLayoutSchema(): z.ZodObject<Properties<MemoryLayout>> {
  return z.object({
    __typename: z.literal('MemoryLayout').optional(),
    bank: z.string().nullish(),
    clockSpeed: z.number().nullish(),
    formFactor: MemoryFormFactorSchema.nullish(),
    manufacturer: z.string().nullish(),
    partNum: z.string().nullish(),
    serialNum: z.string().nullish(),
    size: z.number(),
    type: MemoryTypeSchema.nullish(),
    voltageConfigured: z.number().nullish(),
    voltageMax: z.number().nullish(),
    voltageMin: z.number().nullish()
  })
}

export function MinigraphqlResponseSchema(): z.ZodObject<Properties<MinigraphqlResponse>> {
  return z.object({
    __typename: z.literal('MinigraphqlResponse').optional(),
    error: z.string().nullish(),
    status: MinigraphStatusSchema,
    timeout: z.number().nullish()
  })
}

export function MountSchema(): z.ZodObject<Properties<Mount>> {
  return z.object({
    __typename: z.literal('Mount').optional(),
    directory: z.string().nullish(),
    name: z.string().nullish(),
    permissions: z.string().nullish(),
    type: z.string().nullish()
  })
}

export function NetworkSchema(): z.ZodObject<Properties<Network>> {
  return z.object({
    __typename: z.literal('Network').optional(),
    accessUrls: z.array(AccessUrlSchema()).nullish(),
    carrierChanges: z.string().nullish(),
    duplex: z.string().nullish(),
    id: z.string(),
    iface: z.string().nullish(),
    ifaceName: z.string().nullish(),
    internal: z.string().nullish(),
    ipv4: z.string().nullish(),
    ipv6: z.string().nullish(),
    mac: z.string().nullish(),
    mtu: z.string().nullish(),
    operstate: z.string().nullish(),
    speed: z.string().nullish(),
    type: z.string().nullish()
  })
}

export function NodeSchema(): z.ZodObject<Properties<Node>> {
  return z.object({
    id: z.string()
  })
}

export function NotificationSchema(): z.ZodObject<Properties<Notification>> {
  return z.object({
    __typename: z.literal('Notification').optional(),
    description: z.string(),
    formattedTimestamp: z.string().nullish(),
    id: z.string(),
    importance: ImportanceSchema,
    link: z.string().nullish(),
    subject: z.string(),
    timestamp: z.string().nullish(),
    title: z.string(),
    type: NotificationTypeSchema
  })
}

export function NotificationCountsSchema(): z.ZodObject<Properties<NotificationCounts>> {
  return z.object({
    __typename: z.literal('NotificationCounts').optional(),
    alert: z.number(),
    info: z.number(),
    total: z.number(),
    warning: z.number()
  })
}

export function NotificationDataSchema(): z.ZodObject<Properties<NotificationData>> {
  return z.object({
    description: z.string(),
    importance: ImportanceSchema,
    link: z.string().nullish(),
    subject: z.string(),
    title: z.string()
  })
}

export function NotificationFilterSchema(): z.ZodObject<Properties<NotificationFilter>> {
  return z.object({
    importance: ImportanceSchema.nullish(),
    limit: z.number(),
    offset: z.number(),
    type: NotificationTypeSchema.nullish()
  })
}

export function NotificationOverviewSchema(): z.ZodObject<Properties<NotificationOverview>> {
  return z.object({
    __typename: z.literal('NotificationOverview').optional(),
    archive: NotificationCountsSchema(),
    unread: NotificationCountsSchema()
  })
}

export function NotificationsSchema(): z.ZodObject<Properties<Notifications>> {
  return z.object({
    __typename: z.literal('Notifications').optional(),
    id: z.string(),
    list: z.array(NotificationSchema()),
    overview: NotificationOverviewSchema()
  })
}

export function NotificationslistArgsSchema(): z.ZodObject<Properties<NotificationslistArgs>> {
  return z.object({
    filter: NotificationFilterSchema()
  })
}

export function OsSchema(): z.ZodObject<Properties<Os>> {
  return z.object({
    __typename: z.literal('Os').optional(),
    arch: z.string().nullish(),
    build: z.string().nullish(),
    codename: z.string().nullish(),
    codepage: z.string().nullish(),
    distro: z.string().nullish(),
    hostname: z.string().nullish(),
    kernel: z.string().nullish(),
    logofile: z.string().nullish(),
    platform: z.string().nullish(),
    release: z.string().nullish(),
    serial: z.string().nullish(),
    uptime: z.string().nullish()
  })
}

export function OwnerSchema(): z.ZodObject<Properties<Owner>> {
  return z.object({
    __typename: z.literal('Owner').optional(),
    avatar: z.string().nullish(),
    url: z.string().nullish(),
    username: z.string().nullish()
  })
}

export function ParityCheckSchema(): z.ZodObject<Properties<ParityCheck>> {
  return z.object({
    __typename: z.literal('ParityCheck').optional(),
    date: z.string(),
    duration: z.number(),
    errors: z.string(),
    speed: z.string(),
    status: z.string()
  })
}

export function PartitionSchema(): z.ZodObject<Properties<Partition>> {
  return z.object({
    __typename: z.literal('Partition').optional(),
    devlinks: z.string().nullish(),
    devname: z.string().nullish(),
    devpath: z.string().nullish(),
    devtype: z.string().nullish(),
    idAta: z.string().nullish(),
    idAtaDownloadMicrocode: z.string().nullish(),
    idAtaFeatureSetAam: z.string().nullish(),
    idAtaFeatureSetAamCurrentValue: z.string().nullish(),
    idAtaFeatureSetAamEnabled: z.string().nullish(),
    idAtaFeatureSetAamVendorRecommendedValue: z.string().nullish(),
    idAtaFeatureSetApm: z.string().nullish(),
    idAtaFeatureSetApmCurrentValue: z.string().nullish(),
    idAtaFeatureSetApmEnabled: z.string().nullish(),
    idAtaFeatureSetHpa: z.string().nullish(),
    idAtaFeatureSetHpaEnabled: z.string().nullish(),
    idAtaFeatureSetPm: z.string().nullish(),
    idAtaFeatureSetPmEnabled: z.string().nullish(),
    idAtaFeatureSetPuis: z.string().nullish(),
    idAtaFeatureSetPuisEnabled: z.string().nullish(),
    idAtaFeatureSetSecurity: z.string().nullish(),
    idAtaFeatureSetSecurityEnabled: z.string().nullish(),
    idAtaFeatureSetSecurityEnhancedEraseUnitMin: z.string().nullish(),
    idAtaFeatureSetSecurityEraseUnitMin: z.string().nullish(),
    idAtaFeatureSetSmart: z.string().nullish(),
    idAtaFeatureSetSmartEnabled: z.string().nullish(),
    idAtaRotationRateRpm: z.string().nullish(),
    idAtaSata: z.string().nullish(),
    idAtaSataSignalRateGen1: z.string().nullish(),
    idAtaSataSignalRateGen2: z.string().nullish(),
    idAtaWriteCache: z.string().nullish(),
    idAtaWriteCacheEnabled: z.string().nullish(),
    idBus: z.string().nullish(),
    idFsType: z.string().nullish(),
    idFsUsage: z.string().nullish(),
    idFsUuid: z.string().nullish(),
    idFsUuidEnc: z.string().nullish(),
    idModel: z.string().nullish(),
    idModelEnc: z.string().nullish(),
    idPartEntryDisk: z.string().nullish(),
    idPartEntryNumber: z.string().nullish(),
    idPartEntryOffset: z.string().nullish(),
    idPartEntryScheme: z.string().nullish(),
    idPartEntrySize: z.string().nullish(),
    idPartEntryType: z.string().nullish(),
    idPartTableType: z.string().nullish(),
    idPath: z.string().nullish(),
    idPathTag: z.string().nullish(),
    idRevision: z.string().nullish(),
    idSerial: z.string().nullish(),
    idSerialShort: z.string().nullish(),
    idType: z.string().nullish(),
    idWwn: z.string().nullish(),
    idWwnWithExtension: z.string().nullish(),
    major: z.string().nullish(),
    minor: z.string().nullish(),
    partn: z.string().nullish(),
    subsystem: z.string().nullish(),
    usecInitialized: z.string().nullish()
  })
}

export function PciSchema(): z.ZodObject<Properties<Pci>> {
  return z.object({
    __typename: z.literal('Pci').optional(),
    blacklisted: z.string().nullish(),
    class: z.string().nullish(),
    id: z.string(),
    productid: z.string().nullish(),
    productname: z.string().nullish(),
    type: z.string().nullish(),
    typeid: z.string().nullish(),
    vendorid: z.string().nullish(),
    vendorname: z.string().nullish()
  })
}

export function PermissionSchema(): z.ZodObject<Properties<Permission>> {
  return z.object({
    __typename: z.literal('Permission').optional(),
    actions: z.array(z.string()),
    resource: ResourceSchema
  })
}

export function ProfileModelSchema(): z.ZodObject<Properties<ProfileModel>> {
  return z.object({
    __typename: z.literal('ProfileModel').optional(),
    avatar: z.string().nullish(),
    url: z.string().nullish(),
    userId: z.string().nullish(),
    username: z.string().nullish()
  })
}

export function RegistrationSchema(): z.ZodObject<Properties<Registration>> {
  return z.object({
    __typename: z.literal('Registration').optional(),
    expiration: z.string().nullish(),
    guid: z.string().nullish(),
    keyFile: KeyFileSchema().nullish(),
    state: RegistrationStateSchema.nullish(),
    type: registrationTypeSchema.nullish(),
    updateExpiration: z.string().nullish()
  })
}

export function RelayResponseSchema(): z.ZodObject<Properties<RelayResponse>> {
  return z.object({
    __typename: z.literal('RelayResponse').optional(),
    error: z.string().nullish(),
    status: z.string(),
    timeout: z.string().nullish()
  })
}

export function RemoteAccessSchema(): z.ZodObject<Properties<RemoteAccess>> {
  return z.object({
    __typename: z.literal('RemoteAccess').optional(),
    accessType: WAN_ACCESS_TYPESchema,
    forwardType: WAN_FORWARD_TYPESchema.nullish(),
    port: z.number().nullish()
  })
}

export function RemoveRoleFromApiKeyInputSchema(): z.ZodObject<Properties<RemoveRoleFromApiKeyInput>> {
  return z.object({
    apiKeyId: z.string(),
    role: RoleSchema
  })
}

export function ServerSchema(): z.ZodObject<Properties<Server>> {
  return z.object({
    __typename: z.literal('Server').optional(),
    apikey: z.string(),
    guid: z.string(),
    lanip: z.string(),
    localurl: z.string(),
    name: z.string(),
    owner: ProfileModelSchema(),
    remoteurl: z.string(),
    status: ServerStatusSchema,
    wanip: z.string()
  })
}

export function ServiceSchema(): z.ZodObject<Properties<Service>> {
  return z.object({
    __typename: z.literal('Service').optional(),
    id: z.string(),
    name: z.string().nullish(),
    online: z.boolean().nullish(),
    uptime: UptimeSchema().nullish(),
    version: z.string().nullish()
  })
}

export function SetupRemoteAccessInputSchema(): z.ZodObject<Properties<SetupRemoteAccessInput>> {
  return z.object({
    accessType: WAN_ACCESS_TYPESchema,
    forwardType: WAN_FORWARD_TYPESchema.nullish(),
    port: z.number().nullish()
  })
}

export function ShareSchema(): z.ZodObject<Properties<Share>> {
  return z.object({
    __typename: z.literal('Share').optional(),
    allocator: z.string().nullish(),
    cache: z.boolean().nullish(),
    color: z.string().nullish(),
    comment: z.string().nullish(),
    cow: z.string().nullish(),
    exclude: z.array(z.string().nullable()).nullish(),
    floor: z.string().nullish(),
    free: z.number().nullish(),
    include: z.array(z.string().nullable()).nullish(),
    luksStatus: z.string().nullish(),
    name: z.string().nullish(),
    nameOrig: z.string().nullish(),
    size: z.number().nullish(),
    splitLevel: z.string().nullish(),
    used: z.number().nullish()
  })
}

export function SystemSchema(): z.ZodObject<Properties<System>> {
  return z.object({
    __typename: z.literal('System').optional(),
    manufacturer: z.string().nullish(),
    model: z.string().nullish(),
    serial: z.string().nullish(),
    sku: z.string().nullish(),
    uuid: z.string().nullish(),
    version: z.string().nullish()
  })
}

export function UnassignedDeviceSchema(): z.ZodObject<Properties<UnassignedDevice>> {
  return z.object({
    __typename: z.literal('UnassignedDevice').optional(),
    devlinks: z.string().nullish(),
    devname: z.string().nullish(),
    devpath: z.string().nullish(),
    devtype: z.string().nullish(),
    idAta: z.string().nullish(),
    idAtaDownloadMicrocode: z.string().nullish(),
    idAtaFeatureSetAam: z.string().nullish(),
    idAtaFeatureSetAamCurrentValue: z.string().nullish(),
    idAtaFeatureSetAamEnabled: z.string().nullish(),
    idAtaFeatureSetAamVendorRecommendedValue: z.string().nullish(),
    idAtaFeatureSetApm: z.string().nullish(),
    idAtaFeatureSetApmCurrentValue: z.string().nullish(),
    idAtaFeatureSetApmEnabled: z.string().nullish(),
    idAtaFeatureSetHpa: z.string().nullish(),
    idAtaFeatureSetHpaEnabled: z.string().nullish(),
    idAtaFeatureSetPm: z.string().nullish(),
    idAtaFeatureSetPmEnabled: z.string().nullish(),
    idAtaFeatureSetPuis: z.string().nullish(),
    idAtaFeatureSetPuisEnabled: z.string().nullish(),
    idAtaFeatureSetSecurity: z.string().nullish(),
    idAtaFeatureSetSecurityEnabled: z.string().nullish(),
    idAtaFeatureSetSecurityEnhancedEraseUnitMin: z.string().nullish(),
    idAtaFeatureSetSecurityEraseUnitMin: z.string().nullish(),
    idAtaFeatureSetSmart: z.string().nullish(),
    idAtaFeatureSetSmartEnabled: z.string().nullish(),
    idAtaRotationRateRpm: z.string().nullish(),
    idAtaSata: z.string().nullish(),
    idAtaSataSignalRateGen1: z.string().nullish(),
    idAtaSataSignalRateGen2: z.string().nullish(),
    idAtaWriteCache: z.string().nullish(),
    idAtaWriteCacheEnabled: z.string().nullish(),
    idBus: z.string().nullish(),
    idModel: z.string().nullish(),
    idModelEnc: z.string().nullish(),
    idPartTableType: z.string().nullish(),
    idPath: z.string().nullish(),
    idPathTag: z.string().nullish(),
    idRevision: z.string().nullish(),
    idSerial: z.string().nullish(),
    idSerialShort: z.string().nullish(),
    idType: z.string().nullish(),
    idWwn: z.string().nullish(),
    idWwnWithExtension: z.string().nullish(),
    major: z.string().nullish(),
    minor: z.string().nullish(),
    mount: MountSchema().nullish(),
    mounted: z.boolean().nullish(),
    name: z.string().nullish(),
    partitions: z.array(PartitionSchema().nullable()).nullish(),
    subsystem: z.string().nullish(),
    temp: z.number().nullish(),
    usecInitialized: z.string().nullish()
  })
}

export function UptimeSchema(): z.ZodObject<Properties<Uptime>> {
  return z.object({
    __typename: z.literal('Uptime').optional(),
    timestamp: z.string().nullish()
  })
}

export function UsbSchema(): z.ZodObject<Properties<Usb>> {
  return z.object({
    __typename: z.literal('Usb').optional(),
    id: z.string(),
    name: z.string().nullish()
  })
}

export function UserSchema(): z.ZodObject<Properties<User>> {
  return z.object({
    __typename: z.literal('User').optional(),
    description: z.string(),
    id: z.string(),
    name: z.string(),
    password: z.boolean().nullish(),
    permissions: z.array(PermissionSchema()).nullish(),
    roles: z.array(RoleSchema)
  })
}

export function UserAccountSchema(): z.ZodObject<Properties<UserAccount>> {
  return z.object({
    description: z.string(),
    id: z.string(),
    name: z.string(),
    permissions: z.array(PermissionSchema()).nullish(),
    roles: z.array(RoleSchema)
  })
}

export function VarsSchema(): z.ZodObject<Properties<Vars>> {
  return z.object({
    __typename: z.literal('Vars').optional(),
    bindMgt: z.boolean().nullish(),
    cacheNumDevices: z.number().nullish(),
    cacheSbNumDisks: z.number().nullish(),
    comment: z.string().nullish(),
    configError: ConfigErrorStateSchema.nullish(),
    configValid: z.boolean().nullish(),
    csrfToken: z.string().nullish(),
    defaultFormat: z.string().nullish(),
    defaultFsType: z.string().nullish(),
    deviceCount: z.number().nullish(),
    domain: z.string().nullish(),
    domainLogin: z.string().nullish(),
    domainShort: z.string().nullish(),
    enableFruit: z.string().nullish(),
    flashGuid: z.string().nullish(),
    flashProduct: z.string().nullish(),
    flashVendor: z.string().nullish(),
    fsCopyPrcnt: z.number().nullish(),
    fsNumMounted: z.number().nullish(),
    fsNumUnmountable: z.number().nullish(),
    fsProgress: z.string().nullish(),
    fsState: z.string().nullish(),
    fsUnmountableMask: z.string().nullish(),
    fuseDirectio: z.string().nullish(),
    fuseDirectioDefault: z.string().nullish(),
    fuseDirectioStatus: z.string().nullish(),
    fuseRemember: z.string().nullish(),
    fuseRememberDefault: z.string().nullish(),
    fuseRememberStatus: z.string().nullish(),
    hideDotFiles: z.boolean().nullish(),
    id: z.string(),
    joinStatus: z.string().nullish(),
    localMaster: z.boolean().nullish(),
    localTld: z.string().nullish(),
    luksKeyfile: z.string().nullish(),
    maxArraysz: z.number().nullish(),
    maxCachesz: z.number().nullish(),
    mdColor: z.string().nullish(),
    mdNumDisabled: z.number().nullish(),
    mdNumDisks: z.number().nullish(),
    mdNumErased: z.number().nullish(),
    mdNumInvalid: z.number().nullish(),
    mdNumMissing: z.number().nullish(),
    mdNumNew: z.number().nullish(),
    mdNumStripes: z.number().nullish(),
    mdNumStripesDefault: z.number().nullish(),
    mdNumStripesStatus: z.string().nullish(),
    mdResync: z.number().nullish(),
    mdResyncAction: z.string().nullish(),
    mdResyncCorr: z.string().nullish(),
    mdResyncDb: z.string().nullish(),
    mdResyncDt: z.string().nullish(),
    mdResyncPos: z.string().nullish(),
    mdResyncSize: z.number().nullish(),
    mdState: z.string().nullish(),
    mdSyncThresh: z.number().nullish(),
    mdSyncThreshDefault: z.number().nullish(),
    mdSyncThreshStatus: z.string().nullish(),
    mdSyncWindow: z.number().nullish(),
    mdSyncWindowDefault: z.number().nullish(),
    mdSyncWindowStatus: z.string().nullish(),
    mdVersion: z.string().nullish(),
    mdWriteMethod: z.number().nullish(),
    mdWriteMethodDefault: z.string().nullish(),
    mdWriteMethodStatus: z.string().nullish(),
    name: z.string().nullish(),
    nrRequests: z.number().nullish(),
    nrRequestsDefault: z.number().nullish(),
    nrRequestsStatus: z.string().nullish(),
    ntpServer1: z.string().nullish(),
    ntpServer2: z.string().nullish(),
    ntpServer3: z.string().nullish(),
    ntpServer4: z.string().nullish(),
    pollAttributes: z.string().nullish(),
    pollAttributesDefault: z.string().nullish(),
    pollAttributesStatus: z.string().nullish(),
    port: z.number().nullish(),
    portssh: z.number().nullish(),
    portssl: z.number().nullish(),
    porttelnet: z.number().nullish(),
    queueDepth: z.string().nullish(),
    regCheck: z.string().nullish(),
    regFile: z.string().nullish(),
    regGen: z.string().nullish(),
    regGuid: z.string().nullish(),
    regState: RegistrationStateSchema.nullish(),
    regTm: z.string().nullish(),
    regTm2: z.string().nullish(),
    regTo: z.string().nullish(),
    regTy: z.string().nullish(),
    safeMode: z.boolean().nullish(),
    sbClean: z.boolean().nullish(),
    sbEvents: z.number().nullish(),
    sbName: z.string().nullish(),
    sbNumDisks: z.number().nullish(),
    sbState: z.string().nullish(),
    sbSyncErrs: z.number().nullish(),
    sbSyncExit: z.string().nullish(),
    sbSynced: z.number().nullish(),
    sbSynced2: z.number().nullish(),
    sbUpdated: z.string().nullish(),
    sbVersion: z.string().nullish(),
    security: z.string().nullish(),
    shareAfpCount: z.number().nullish(),
    shareAfpEnabled: z.boolean().nullish(),
    shareAvahiAfpModel: z.string().nullish(),
    shareAvahiAfpName: z.string().nullish(),
    shareAvahiEnabled: z.boolean().nullish(),
    shareAvahiSmbModel: z.string().nullish(),
    shareAvahiSmbName: z.string().nullish(),
    shareCacheEnabled: z.boolean().nullish(),
    shareCacheFloor: z.string().nullish(),
    shareCount: z.number().nullish(),
    shareDisk: z.string().nullish(),
    shareInitialGroup: z.string().nullish(),
    shareInitialOwner: z.string().nullish(),
    shareMoverActive: z.boolean().nullish(),
    shareMoverLogging: z.boolean().nullish(),
    shareMoverSchedule: z.string().nullish(),
    shareNfsCount: z.number().nullish(),
    shareNfsEnabled: z.boolean().nullish(),
    shareSmbCount: z.number().nullish(),
    shareSmbEnabled: z.boolean().nullish(),
    shareUser: z.string().nullish(),
    shareUserExclude: z.string().nullish(),
    shareUserInclude: z.string().nullish(),
    shutdownTimeout: z.number().nullish(),
    spindownDelay: z.string().nullish(),
    spinupGroups: z.boolean().nullish(),
    startArray: z.boolean().nullish(),
    startMode: z.string().nullish(),
    startPage: z.string().nullish(),
    sysArraySlots: z.number().nullish(),
    sysCacheSlots: z.number().nullish(),
    sysFlashSlots: z.number().nullish(),
    sysModel: z.string().nullish(),
    timeZone: z.string().nullish(),
    useNtp: z.boolean().nullish(),
    useSsh: z.boolean().nullish(),
    useSsl: z.boolean().nullish(),
    useTelnet: z.boolean().nullish(),
    version: z.string().nullish(),
    workgroup: z.string().nullish()
  })
}

export function VersionsSchema(): z.ZodObject<Properties<Versions>> {
  return z.object({
    __typename: z.literal('Versions').optional(),
    apache: z.string().nullish(),
    docker: z.string().nullish(),
    gcc: z.string().nullish(),
    git: z.string().nullish(),
    grunt: z.string().nullish(),
    gulp: z.string().nullish(),
    kernel: z.string().nullish(),
    mongodb: z.string().nullish(),
    mysql: z.string().nullish(),
    nginx: z.string().nullish(),
    node: z.string().nullish(),
    npm: z.string().nullish(),
    openssl: z.string().nullish(),
    perl: z.string().nullish(),
    php: z.string().nullish(),
    pm2: z.string().nullish(),
    postfix: z.string().nullish(),
    postgresql: z.string().nullish(),
    python: z.string().nullish(),
    redis: z.string().nullish(),
    systemOpenssl: z.string().nullish(),
    systemOpensslLib: z.string().nullish(),
    tsc: z.string().nullish(),
    unraid: z.string().nullish(),
    v8: z.string().nullish(),
    yarn: z.string().nullish()
  })
}

export function VmDomainSchema(): z.ZodObject<Properties<VmDomain>> {
  return z.object({
    __typename: z.literal('VmDomain').optional(),
    name: z.string().nullish(),
    state: VmStateSchema,
    uuid: z.string()
  })
}

export function VmsSchema(): z.ZodObject<Properties<Vms>> {
  return z.object({
    __typename: z.literal('Vms').optional(),
    domain: z.array(VmDomainSchema()).nullish(),
    id: z.string()
  })
}

export function WelcomeSchema(): z.ZodObject<Properties<Welcome>> {
  return z.object({
    __typename: z.literal('Welcome').optional(),
    message: z.string()
  })
}

export function addUserInputSchema(): z.ZodObject<Properties<addUserInput>> {
  return z.object({
    description: z.string().nullish(),
    name: z.string(),
    password: z.string()
  })
}

export function arrayDiskInputSchema(): z.ZodObject<Properties<arrayDiskInput>> {
  return z.object({
    id: z.string(),
    slot: z.number().nullish()
  })
}

export function deleteUserInputSchema(): z.ZodObject<Properties<deleteUserInput>> {
  return z.object({
    name: z.string()
  })
}

export function usersInputSchema(): z.ZodObject<Properties<usersInput>> {
  return z.object({
    slim: z.boolean().nullish()
  })
}

export type getCloudQueryVariables = Types.Exact<{ [key: string]: never; }>;


export type getCloudQuery = { __typename?: 'Query', cloud?: { __typename?: 'Cloud', error?: string | null, allowedOrigins: Array<string>, apiKey: { __typename?: 'ApiKeyResponse', valid: boolean, error?: string | null }, minigraphql: { __typename?: 'MinigraphqlResponse', status: Types.MinigraphStatus, timeout?: number | null, error?: string | null }, cloud: { __typename?: 'CloudResponse', status: string, error?: string | null, ip?: string | null } } | null };

export type getServersQueryVariables = Types.Exact<{ [key: string]: never; }>;


export type getServersQuery = { __typename?: 'Query', servers: Array<{ __typename?: 'Server', name: string, guid: string, status: Types.ServerStatus, owner: { __typename?: 'ProfileModel', username?: string | null } }> };


export const getCloudDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"getCloud"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"cloud"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"error"}},{"kind":"Field","name":{"kind":"Name","value":"apiKey"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"valid"}},{"kind":"Field","name":{"kind":"Name","value":"error"}}]}},{"kind":"Field","name":{"kind":"Name","value":"minigraphql"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"timeout"}},{"kind":"Field","name":{"kind":"Name","value":"error"}}]}},{"kind":"Field","name":{"kind":"Name","value":"cloud"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"error"}},{"kind":"Field","name":{"kind":"Name","value":"ip"}}]}},{"kind":"Field","name":{"kind":"Name","value":"allowedOrigins"}}]}}]}}]} as unknown as DocumentNode<getCloudQuery, getCloudQueryVariables>;
export const getServersDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"getServers"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"servers"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"guid"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"owner"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"username"}}]}}]}}]}}]} as unknown as DocumentNode<getServersQuery, getServersQueryVariables>;