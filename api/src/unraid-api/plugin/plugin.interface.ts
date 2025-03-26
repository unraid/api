import { Logger, Type } from '@nestjs/common';

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

/** Warning: unstable API. The config mechanism and API may soon change. */
export const apiPluginSchema = z.object({
    _type: z.literal('UnraidApiPlugin'),
    name: z.string(),
    description: z.string(),
    commands: z.array(z.custom<Type<CommandRunner>>()),
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

/** Warning: unstable API. The config mechanism and API may soon change. */
export type ApiPluginDefinition = z.infer<typeof apiPluginSchema>;

// todo: the blocker to publishing this type is the 'ApiStore' type.
// It pulls in a lot of irrelevant types (e.g. graphql types) and triggers js transpilation of everything related to the store.
// If we can isolate the type, we can publish it to npm and developers can use it as a dev dependency.
/**
 * Represents a subclass of UnraidAPIPlugin that can be instantiated.
 */
export type ConstructablePlugin = (options: { store: ApiStore; logger: Logger }) => ApiPluginDefinition;
