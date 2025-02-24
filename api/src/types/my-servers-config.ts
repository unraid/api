import { z } from 'zod';

import { DynamicRemoteAccessType, MinigraphStatus } from '@app/graphql/generated/api/types.js';

// Define Zod schemas
const ApiConfigSchema = z.object({
    version: z.string(),
    extraOrigins: z.string(),
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
    ssoSubIds: z
        .string()
        .transform((val) => {
            // If valid, return as is
            if (val === '' || val.split(',').every((id) => id.trim().match(/^[a-zA-Z0-9-]+$/))) {
                return val;
            }
            // Otherwise, replace with an empty string
            return '';
        })
        .refine(
            (val) => val === '' || val.split(',').every((id) => id.trim().match(/^[a-zA-Z0-9-]+$/)),
            {
                message:
                    'ssoSubIds must be empty or a comma-separated list of alphanumeric strings with dashes',
            }
        ),
});

const LocalConfigSchema = z.object({
    sandbox: z.enum(['yes', 'no']).default('no'),
});

// Base config schema
export const MyServersConfigSchema = z
    .object({
        api: ApiConfigSchema,
        local: LocalConfigSchema,
        remote: RemoteConfigSchema,
    })
    .strip();

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
}).strip();

// Infer and export types from Zod schemas
export type MyServersConfig = z.infer<typeof MyServersConfigSchema>;
export type MyServersConfigMemory = z.infer<typeof MyServersConfigMemorySchema>;
