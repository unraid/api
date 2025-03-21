import { Logger, OnModuleDestroy, OnModuleInit, Type } from '@nestjs/common';

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

export const apiPluginSchema = z.object({
    _type: z.literal('UnraidApiPlugin'),
    name: z.string(),
    description: z.string(),
    commands: z.array(z.custom<Type<CommandRunner>>()),
    registerGraphQLResolvers: asyncArray().optional(),
    registerGraphQLTypeDefs: asyncString().optional(),
    registerRESTControllers: asyncArray().optional(),
    registerRESTRoutes: asyncArray().optional(),
    registerServices: asyncArray().optional(),
    registerCronJobs: asyncArray().optional(),
    onModuleInit: asyncVoid().optional(),
    onModuleDestroy: asyncVoid().optional(),
});

export type ApiPluginDefinition = z.infer<typeof apiPluginSchema>;

export abstract class UnraidAPIPlugin implements OnModuleInit, OnModuleDestroy {
    /** Warning: unstable API. The config mechanism and API may soon change. */
    constructor(
        protected readonly store: ApiStore,
        protected readonly logger: Logger
    ) {}

    abstract metadata: PluginMetadata;

    // CLI Commands - now a property instead of a method
    abstract commands: Type<CommandRunner>[];

    // GraphQL configuration
    abstract registerGraphQLResolvers?(): Promise<any[]>;
    abstract registerGraphQLTypeDefs?(): Promise<string>;

    // REST configuration
    abstract registerRESTControllers?(): Promise<any[]>;
    abstract registerRESTRoutes?(): Promise<any[]>;

    // Services and background tasks
    abstract registerServices?(): Promise<any[]>;
    abstract registerCronJobs?(): Promise<any[]>;

    // Implement required OnModuleInit and OnModuleDestroy
    abstract onModuleInit(): Promise<void>;
    abstract onModuleDestroy(): Promise<void>;
}

/**
 * Represents a subclass of UnraidAPIPlugin that can be instantiated.
 */
// export type ConstructablePlugin = new (options: { store: ApiStore; logger: Logger }) => UnraidAPIPlugin;
export type ConstructablePlugin = (options: { store: ApiStore; logger: Logger }) => ApiPluginDefinition;
