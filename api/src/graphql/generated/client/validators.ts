/* eslint-disable */
import { z } from 'zod'
import { AccessUrlInput, ArrayCapacityBytesInput, ArrayCapacityInput, ClientType, ConfigErrorState, DashboardAppsInput, DashboardArrayInput, DashboardCaseInput, DashboardConfigInput, DashboardDisplayInput, DashboardInput, DashboardOsInput, DashboardServiceInput, DashboardServiceUptimeInput, DashboardTwoFactorInput, DashboardTwoFactorLocalInput, DashboardTwoFactorRemoteInput, DashboardVarsInput, DashboardVersionsInput, DashboardVmsInput, EventType, Importance, NetworkInput, NotificationInput, NotificationStatus, PingEventSource, RegistrationState, RemoteAccessEventActionType, RemoteAccessInput, RemoteGraphQLClientInput, RemoteGraphQLEventType, RemoteGraphQLServerInput, ServerStatus, URL_TYPE, UpdateType } from '@app/graphql/generated/client/graphql.js'

type Properties<T> = Required<{
  [K in keyof T]: z.ZodType<T[K], any, T[K]>;
}>;

type definedNonNullAny = {};

export const isDefinedNonNullAny = (v: any): v is definedNonNullAny => v !== undefined && v !== null;

export const definedNonNullAnySchema = z.any().refine((v) => isDefinedNonNullAny(v));

export const ClientTypeSchema = z.nativeEnum(ClientType);

export const ConfigErrorStateSchema = z.nativeEnum(ConfigErrorState);

export const EventTypeSchema = z.nativeEnum(EventType);

export const ImportanceSchema = z.nativeEnum(Importance);

export const NotificationStatusSchema = z.nativeEnum(NotificationStatus);

export const PingEventSourceSchema = z.nativeEnum(PingEventSource);

export const RegistrationStateSchema = z.nativeEnum(RegistrationState);

export const RemoteAccessEventActionTypeSchema = z.nativeEnum(RemoteAccessEventActionType);

export const RemoteGraphQLEventTypeSchema = z.nativeEnum(RemoteGraphQLEventType);

export const ServerStatusSchema = z.nativeEnum(ServerStatus);

export const URL_TYPESchema = z.nativeEnum(URL_TYPE);

export const UpdateTypeSchema = z.nativeEnum(UpdateType);

export function AccessUrlInputSchema(): z.ZodObject<Properties<AccessUrlInput>> {
  return z.object({
    ipv4: z.instanceof(URL).nullish(),
    ipv6: z.instanceof(URL).nullish(),
    name: z.string().nullish(),
    type: URL_TYPESchema
  })
}

export function ArrayCapacityBytesInputSchema(): z.ZodObject<Properties<ArrayCapacityBytesInput>> {
  return z.object({
    free: z.number().nullish(),
    total: z.number().nullish(),
    used: z.number().nullish()
  })
}

export function ArrayCapacityInputSchema(): z.ZodObject<Properties<ArrayCapacityInput>> {
  return z.object({
    bytes: z.lazy(() => ArrayCapacityBytesInputSchema().nullish())
  })
}

export function DashboardAppsInputSchema(): z.ZodObject<Properties<DashboardAppsInput>> {
  return z.object({
    installed: z.number(),
    started: z.number()
  })
}

export function DashboardArrayInputSchema(): z.ZodObject<Properties<DashboardArrayInput>> {
  return z.object({
    capacity: z.lazy(() => ArrayCapacityInputSchema()),
    state: z.string()
  })
}

export function DashboardCaseInputSchema(): z.ZodObject<Properties<DashboardCaseInput>> {
  return z.object({
    base64: z.string(),
    error: z.string().nullish(),
    icon: z.string(),
    url: z.string()
  })
}

export function DashboardConfigInputSchema(): z.ZodObject<Properties<DashboardConfigInput>> {
  return z.object({
    error: z.string().nullish(),
    valid: z.boolean()
  })
}

export function DashboardDisplayInputSchema(): z.ZodObject<Properties<DashboardDisplayInput>> {
  return z.object({
    case: z.lazy(() => DashboardCaseInputSchema())
  })
}

export function DashboardInputSchema(): z.ZodObject<Properties<DashboardInput>> {
  return z.object({
    apps: z.lazy(() => DashboardAppsInputSchema()),
    array: z.lazy(() => DashboardArrayInputSchema()),
    config: z.lazy(() => DashboardConfigInputSchema()),
    display: z.lazy(() => DashboardDisplayInputSchema()),
    os: z.lazy(() => DashboardOsInputSchema()),
    services: z.array(z.lazy(() => DashboardServiceInputSchema())),
    twoFactor: z.lazy(() => DashboardTwoFactorInputSchema().nullish()),
    vars: z.lazy(() => DashboardVarsInputSchema()),
    versions: z.lazy(() => DashboardVersionsInputSchema()),
    vms: z.lazy(() => DashboardVmsInputSchema())
  })
}

export function DashboardOsInputSchema(): z.ZodObject<Properties<DashboardOsInput>> {
  return z.object({
    hostname: z.string(),
    uptime: z.string()
  })
}

export function DashboardServiceInputSchema(): z.ZodObject<Properties<DashboardServiceInput>> {
  return z.object({
    name: z.string(),
    online: z.boolean(),
    uptime: z.lazy(() => DashboardServiceUptimeInputSchema().nullish()),
    version: z.string()
  })
}

export function DashboardServiceUptimeInputSchema(): z.ZodObject<Properties<DashboardServiceUptimeInput>> {
  return z.object({
    timestamp: z.string()
  })
}

export function DashboardTwoFactorInputSchema(): z.ZodObject<Properties<DashboardTwoFactorInput>> {
  return z.object({
    local: z.lazy(() => DashboardTwoFactorLocalInputSchema()),
    remote: z.lazy(() => DashboardTwoFactorRemoteInputSchema())
  })
}

export function DashboardTwoFactorLocalInputSchema(): z.ZodObject<Properties<DashboardTwoFactorLocalInput>> {
  return z.object({
    enabled: z.boolean()
  })
}

export function DashboardTwoFactorRemoteInputSchema(): z.ZodObject<Properties<DashboardTwoFactorRemoteInput>> {
  return z.object({
    enabled: z.boolean()
  })
}

export function DashboardVarsInputSchema(): z.ZodObject<Properties<DashboardVarsInput>> {
  return z.object({
    flashGuid: z.string(),
    regState: z.string(),
    regTy: z.string(),
    serverDescription: z.string().nullish(),
    serverName: z.string().nullish()
  })
}

export function DashboardVersionsInputSchema(): z.ZodObject<Properties<DashboardVersionsInput>> {
  return z.object({
    unraid: z.string()
  })
}

export function DashboardVmsInputSchema(): z.ZodObject<Properties<DashboardVmsInput>> {
  return z.object({
    installed: z.number(),
    started: z.number()
  })
}

export function NetworkInputSchema(): z.ZodObject<Properties<NetworkInput>> {
  return z.object({
    accessUrls: z.array(z.lazy(() => AccessUrlInputSchema()))
  })
}

export function NotificationInputSchema(): z.ZodObject<Properties<NotificationInput>> {
  return z.object({
    description: z.string().nullish(),
    importance: ImportanceSchema,
    link: z.string().nullish(),
    subject: z.string().nullish(),
    title: z.string().nullish()
  })
}

export function RemoteAccessInputSchema(): z.ZodObject<Properties<RemoteAccessInput>> {
  return z.object({
    apiKey: z.string(),
    type: RemoteAccessEventActionTypeSchema,
    url: z.lazy(() => AccessUrlInputSchema().nullish())
  })
}

export function RemoteGraphQLClientInputSchema(): z.ZodObject<Properties<RemoteGraphQLClientInput>> {
  return z.object({
    apiKey: z.string(),
    body: z.string(),
    timeout: z.number().nullish(),
    ttl: z.number().nullish()
  })
}

export function RemoteGraphQLServerInputSchema(): z.ZodObject<Properties<RemoteGraphQLServerInput>> {
  return z.object({
    body: z.string(),
    sha256: z.string(),
    type: RemoteGraphQLEventTypeSchema
  })
}
