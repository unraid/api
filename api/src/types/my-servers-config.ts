import { z } from 'zod';

import { DynamicRemoteAccessType, MinigraphStatus } from '@app/graphql/generated/api/types';

// Define Zod schemas
const ApiConfigSchema = z.object({
    version: z.string(),
    extraOrigins: z.string(),
});

const NotifierConfigSchema = z.object({
    apikey: z.string(),
});

const RemoteConfigSchema = z.object({
    wanaccess: z.string(),
    wanport: z.string(),
    upnpEnabled: z.string(),
    apikey: z.string(),
    localApiKey: z.string(),
    email: z.string(),
    username: z.string(),
    avatar: z.string(),
    regWizTime: z.string(),
    accesstoken: z.string(),
    idtoken: z.string(),
    refreshtoken: z.string(),
    dynamicRemoteAccessType: z.nativeEnum(DynamicRemoteAccessType),
});

const UpcConfigSchema = z.object({
    apikey: z.string(),
});

// Base config schema
export const MyServersConfigSchema = z.object({
    api: ApiConfigSchema,
    local: z.object({}), // Empty object
    notifier: NotifierConfigSchema,
    remote: RemoteConfigSchema,
    upc: UpcConfigSchema,
});

// Memory config schema
export const ConnectionStatusSchema = z.object({
    minigraph: z.nativeEnum(MinigraphStatus),
    upnpStatus: z.string().nullable().optional(),
});

export const MyServersConfigMemorySchema = MyServersConfigSchema.extend({
    connectionStatus: ConnectionStatusSchema,
    remote: RemoteConfigSchema.extend({
        allowedOrigins: z.string(),
    }),
});

// Memory config with mandatory hidden fields schema
export const MyServersConfigMemoryWithMandatoryHiddenFieldsSchema = MyServersConfigMemorySchema.extend({
    connectionStatus: ConnectionStatusSchema,
});

// Infer and export types from Zod schemas
export type MyServersConfig = z.infer<typeof MyServersConfigSchema>;
export type MyServersConfigMemory = z.infer<typeof MyServersConfigMemorySchema>;
export type MyServersConfigMemoryWithMandatoryHiddenFields = z.infer<
    typeof MyServersConfigMemoryWithMandatoryHiddenFieldsSchema
>;
