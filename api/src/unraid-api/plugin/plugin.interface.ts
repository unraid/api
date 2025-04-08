import type { Constructor } from 'type-fest';
import { z } from 'zod';

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
