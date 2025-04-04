import type { Provider } from '@nestjs/common';
import { Logger, Type } from '@nestjs/common';

import type { Constructor } from 'type-fest';
import { CommandRunner } from 'nest-commander';
import { z } from 'zod';

import { ApiStore } from '@app/store/index.js';

export interface PluginMetadata {
    name: string;
    description: string;
}

const asyncArray = () => z.function().returns(z.promise(z.array(z.any())));
const asyncString = () => z.function().returns(z.promise(z.string()));
const asyncVoid = () => z.function().returns(z.promise(z.void()));

// GraphQL resolver type definitions
const resolverFunction = z
    .function()
    .args(
        z.any().optional(), // parent
        z.any().optional(), // args
        z.any().optional(), // context
        z.any().optional() // info
    )
    .returns(z.any());

const resolverFieldMap = z.record(z.string(), resolverFunction);
const resolverTypeMap = z.record(
    z.enum(['Query', 'Mutation', 'Subscription']).or(z.string()),
    resolverFieldMap
);
const asyncResolver = () => z.function().returns(z.promise(resolverTypeMap));

type NestModule = Constructor<unknown>;

const isClass = (value: unknown): value is NestModule => {
    return typeof value === 'function' && value.toString().startsWith('class');
};

/**
 * Convert a NestJS module to a provider.
 * @param module - The NestJS module to convert.
 * @returns A provider that can be used in a NestJS module.
 */
export function nestModuleToProvider(module: NestModule): Provider {
    return {
        provide: module.name,
        useValue: module,
    };
}

/** Warning: unstable API. The config mechanism and API may soon change. */
export const apiPluginSchema = z.object({
    _type: z.literal('UnraidApiPlugin'),
    name: z.string(),
    description: z.string(),
    commands: z.array(z.custom<Type<CommandRunner>>()),
    config: z.function().returns(z.array(z.any())).optional(),
    registerGraphQLResolvers: asyncResolver().optional(),
    registerGraphQLTypeDefs: asyncString().optional(),
    registerRESTControllers: asyncArray().optional(),
    registerRESTRoutes: asyncArray().optional(),
    registerServices: asyncArray().optional(),
    registerCronJobs: asyncArray().optional(),
    // These schema definitions are picked up as nest modules as well.
    onModuleInit: asyncVoid().optional(),
    onModuleDestroy: asyncVoid().optional(),
});

/** format of module exports from a nestjs plugin */
export const apiNestPluginSchema = z
    .object({
        adapter: z.literal('nestjs'),
        ApiModule: z
            .custom<NestModule>(isClass, {
                message: 'Invalid NestJS module: expected a class constructor',
            })
            .optional(),
        CliModule: z
            .custom<NestModule>(isClass, {
                message: 'Invalid NestJS module: expected a class constructor',
            })
            .optional(),
        graphqlSchemaExtension: asyncString().optional(),
    })
    .superRefine((data, ctx) => {
        // Ensure that at least one of ApiModule or CliModule is defined.
        if (!data.ApiModule && !data.CliModule) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: 'At least one of ApiModule or CliModule must be defined',
                path: ['ApiModule', 'CliModule'],
            });
        }
        // If graphqlSchemaExtension is provided, ensure that ApiModule is defined.
        if (data.graphqlSchemaExtension && !data.ApiModule) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: 'If graphqlSchemaExtension is provided, ApiModule must be defined',
                path: ['graphqlSchemaExtension'],
            });
        }
    });

export type ApiNestPluginDefinition = z.infer<typeof apiNestPluginSchema>;

/** Warning: unstable API. The config mechanism and API may soon change. */
export type ApiPluginDefinition = z.infer<typeof apiPluginSchema>;

// todo: the blocker to publishing this type is the 'ApiStore' type.
// It pulls in a lot of irrelevant types (e.g. graphql types) and triggers js transpilation of everything related to the store.
// If we can isolate the type, we can publish it to npm and developers can use it as a dev dependency.
/**
 * Represents a subclass of UnraidAPIPlugin that can be instantiated.
 */
export type ConstructablePlugin = (options: { store: ApiStore; logger: Logger }) => ApiPluginDefinition;
