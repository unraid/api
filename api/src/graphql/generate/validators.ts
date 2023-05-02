/* eslint-disable */
import { z } from 'zod'
import { AccessUrlInput, ArrayCapacityBytesInput, ArrayCapacityInput, ClientType, ConfigErrorState, DashboardAppsInput, DashboardArrayInput, DashboardCaseInput, DashboardConfigInput, DashboardDisplayInput, DashboardInput, DashboardOsInput, DashboardServiceInput, DashboardServiceUptimeInput, DashboardTwoFactorInput, DashboardTwoFactorLocalInput, DashboardTwoFactorRemoteInput, DashboardVarsInput, DashboardVersionsInput, DashboardVmsInput, EventType, Importance, KeyType, NetworkInput, NotificationInput, NotificationStatus, PingEventSource, RegistrationState, RemoteAccessEventActionType, RemoteAccessInput, RemoteGraphQLClientInput, RemoteGraphQLEventType, RemoteGraphQLServerInput, ServerStatus, URL_TYPE, UpdateType } from '@app/graphql/generated/client/graphql'

type Properties<T> = Required<{
  [K in keyof T]: z.ZodType<T[K], any, T[K]>;
}>;

type definedNonNullAny = {};

export const isDefinedNonNullAny = (v: any): v is definedNonNullAny => v !== undefined && v !== null;

export const definedNonNullAnySchema = z.any().refine((v) => isDefinedNonNullAny(v));

export function AccessUrlInputSchema(): z.ZodObject<Properties<AccessUrlInput>> {
  return z.object<Properties<AccessUrlInput>>({
    ipv4: definedNonNullAnySchema.nullish(),
    ipv6: definedNonNullAnySchema.nullish(),
    name: z.string().nullish(),
    type: definedNonNullAnySchema
  })
}

export function ArrayCapacityBytesInputSchema(): z.ZodObject<Properties<ArrayCapacityBytesInput>> {
  return z.object<Properties<ArrayCapacityBytesInput>>({
    free: z.number().nullish(),
    total: z.number().nullish(),
    used: z.number().nullish()
  })
}

export function ArrayCapacityInputSchema(): z.ZodObject<Properties<ArrayCapacityInput>> {
  return z.object<Properties<ArrayCapacityInput>>({
    bytes: z.lazy(() => definedNonNullAnySchema.nullish())
  })
}

export const ClientTypeSchema = z.nativeEnum(ClientType);

export const ConfigErrorStateSchema = z.nativeEnum(ConfigErrorState);

export function DashboardAppsInputSchema(): z.ZodObject<Properties<DashboardAppsInput>> {
  return z.object<Properties<DashboardAppsInput>>({
    installed: z.number(),
    started: z.number()
  })
}

export function DashboardArrayInputSchema(): z.ZodObject<Properties<DashboardArrayInput>> {
  return z.object<Properties<DashboardArrayInput>>({
    capacity: z.lazy(() => definedNonNullAnySchema),
    state: z.string()
  })
}

export function DashboardCaseInputSchema(): z.ZodObject<Properties<DashboardCaseInput>> {
  return z.object<Properties<DashboardCaseInput>>({
    base64: z.string(),
    error: z.string().nullish(),
    icon: z.string(),
    url: z.string()
  })
}

export function DashboardConfigInputSchema(): z.ZodObject<Properties<DashboardConfigInput>> {
  return z.object<Properties<DashboardConfigInput>>({
    error: z.string().nullish(),
    valid: z.boolean()
  })
}

export function DashboardDisplayInputSchema(): z.ZodObject<Properties<DashboardDisplayInput>> {
  return z.object<Properties<DashboardDisplayInput>>({
    case: z.lazy(() => definedNonNullAnySchema)
  })
}

export function DashboardInputSchema(): z.ZodObject<Properties<DashboardInput>> {
  return z.object<Properties<DashboardInput>>({
    apps: z.lazy(() => definedNonNullAnySchema),
    array: z.lazy(() => definedNonNullAnySchema),
    config: z.lazy(() => definedNonNullAnySchema),
    display: z.lazy(() => definedNonNullAnySchema),
    os: z.lazy(() => definedNonNullAnySchema),
    services: z.array(z.lazy(() => definedNonNullAnySchema)),
    twoFactor: z.lazy(() => definedNonNullAnySchema.nullish()),
    vars: z.lazy(() => definedNonNullAnySchema),
    versions: z.lazy(() => definedNonNullAnySchema),
    vms: z.lazy(() => definedNonNullAnySchema)
  })
}

export function DashboardOsInputSchema(): z.ZodObject<Properties<DashboardOsInput>> {
  return z.object<Properties<DashboardOsInput>>({
    hostname: z.string(),
    uptime: z.string()
  })
}

export function DashboardServiceInputSchema(): z.ZodObject<Properties<DashboardServiceInput>> {
  return z.object<Properties<DashboardServiceInput>>({
    name: z.string(),
    online: z.boolean(),
    uptime: z.lazy(() => definedNonNullAnySchema.nullish()),
    version: z.string()
  })
}

export function DashboardServiceUptimeInputSchema(): z.ZodObject<Properties<DashboardServiceUptimeInput>> {
  return z.object<Properties<DashboardServiceUptimeInput>>({
    timestamp: z.string()
  })
}

export function DashboardTwoFactorInputSchema(): z.ZodObject<Properties<DashboardTwoFactorInput>> {
  return z.object<Properties<DashboardTwoFactorInput>>({
    local: z.lazy(() => definedNonNullAnySchema),
    remote: z.lazy(() => definedNonNullAnySchema)
  })
}

export function DashboardTwoFactorLocalInputSchema(): z.ZodObject<Properties<DashboardTwoFactorLocalInput>> {
  return z.object<Properties<DashboardTwoFactorLocalInput>>({
    enabled: z.boolean()
  })
}

export function DashboardTwoFactorRemoteInputSchema(): z.ZodObject<Properties<DashboardTwoFactorRemoteInput>> {
  return z.object<Properties<DashboardTwoFactorRemoteInput>>({
    enabled: z.boolean()
  })
}

export function DashboardVarsInputSchema(): z.ZodObject<Properties<DashboardVarsInput>> {
  return z.object<Properties<DashboardVarsInput>>({
    flashGuid: z.string(),
    regState: z.string(),
    regTy: z.string()
  })
}

export function DashboardVersionsInputSchema(): z.ZodObject<Properties<DashboardVersionsInput>> {
  return z.object<Properties<DashboardVersionsInput>>({
    unraid: z.string()
  })
}

export function DashboardVmsInputSchema(): z.ZodObject<Properties<DashboardVmsInput>> {
  return z.object<Properties<DashboardVmsInput>>({
    installed: z.number(),
    started: z.number()
  })
}

export const EventTypeSchema = z.nativeEnum(EventType);

export const ImportanceSchema = z.nativeEnum(Importance);

export const KeyTypeSchema = z.nativeEnum(KeyType);

export function NetworkInputSchema(): z.ZodObject<Properties<NetworkInput>> {
  return z.object<Properties<NetworkInput>>({
    accessUrls: z.array(z.lazy(() => definedNonNullAnySchema))
  })
}

export function NotificationInputSchema(): z.ZodObject<Properties<NotificationInput>> {
  return z.object<Properties<NotificationInput>>({
    description: z.string().nullish(),
    importance: definedNonNullAnySchema,
    link: z.string().nullish(),
    subject: z.string().nullish(),
    title: z.string().nullish()
  })
}

export const NotificationStatusSchema = z.nativeEnum(NotificationStatus);

export const PingEventSourceSchema = z.nativeEnum(PingEventSource);

export const RegistrationStateSchema = z.nativeEnum(RegistrationState);

export const RemoteAccessEventActionTypeSchema = z.nativeEnum(RemoteAccessEventActionType);

export function RemoteAccessInputSchema(): z.ZodObject<Properties<RemoteAccessInput>> {
  return z.object<Properties<RemoteAccessInput>>({
    apiKey: z.string(),
    type: definedNonNullAnySchema,
    url: z.lazy(() => definedNonNullAnySchema.nullish())
  })
}

export function RemoteGraphQLClientInputSchema(): z.ZodObject<Properties<RemoteGraphQLClientInput>> {
  return z.object<Properties<RemoteGraphQLClientInput>>({
    apiKey: z.string(),
    body: z.string()
  })
}

export const RemoteGraphQLEventTypeSchema = z.nativeEnum(RemoteGraphQLEventType);

export function RemoteGraphQLServerInputSchema(): z.ZodObject<Properties<RemoteGraphQLServerInput>> {
  return z.object<Properties<RemoteGraphQLServerInput>>({
    body: z.string(),
    sha256: z.string(),
    type: definedNonNullAnySchema
  })
}

export const ServerStatusSchema = z.nativeEnum(ServerStatus);

export const URL_TYPESchema = z.nativeEnum(URL_TYPE);

export const UpdateTypeSchema = z.nativeEnum(UpdateType);
