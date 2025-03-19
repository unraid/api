import { Logger, OnModuleDestroy, OnModuleInit, Type } from '@nestjs/common';

import { CommandRunner } from 'nest-commander';
import { z } from 'zod';

import { ApiStore } from '@app/store/index.js';

export interface PluginMetadata {
    name: string;
    description: string;
}

export const apiPluginSchema = z.object({
    _type: z.literal('UnraidApiPlugin'),
    name: z.string(),
    description: z.string(),
    commands: z.array(z.function()),
    registerGraphQLResolvers: z.function().optional(),
    registerGraphQLTypeDefs: z.function().optional(),
    registerRESTControllers: z.function().optional(),
    registerRESTRoutes: z.function().optional(),
    registerServices: z.function().optional(),
    registerCronJobs: z.function().optional(),
    onModuleInit: z.function().optional(),
    onModuleDestroy: z.function().optional(),
    unrequiredProp: z.string(),
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
