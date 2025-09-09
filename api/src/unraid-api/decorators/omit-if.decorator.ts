import { SetMetadata } from '@nestjs/common';
import { Extensions } from '@nestjs/graphql';

import { MapperKind, mapSchema } from '@graphql-tools/utils';
import { GraphQLFieldConfig, GraphQLSchema } from 'graphql';

export const OMIT_IF_METADATA_KEY = 'omitIf';

/**
 * Decorator that conditionally omits a GraphQL field/query/mutation based on a condition.
 * The field will only be omitted from the schema when the condition evaluates to true.
 *
 * @param condition - If the condition evaluates to true, the field will be omitted from the schema
 * @returns A decorator that wraps the target field/query/mutation
 *
 * @example
 * ```typescript
 * @OmitIf(process.env.NODE_ENV === 'production')
 * @Query(() => String)
 * async debugQuery() {
 *     return 'This query is omitted in production';
 * }
 * ```
 */
export function OmitIf(condition: boolean | (() => boolean)): MethodDecorator & PropertyDecorator {
    const shouldOmit = typeof condition === 'function' ? condition() : condition;

    return (target: any, propertyKey?: string | symbol, descriptor?: PropertyDescriptor) => {
        if (shouldOmit) {
            SetMetadata(OMIT_IF_METADATA_KEY, true)(
                target,
                propertyKey as string,
                descriptor as PropertyDescriptor
            );
            Extensions({ omitIf: true })(
                target,
                propertyKey as string,
                descriptor as PropertyDescriptor
            );
        }

        return descriptor;
    };
}

/**
 * Schema transformer that omits fields/queries/mutations based on the OmitIf decorator.
 * @param schema - The GraphQL schema to transform
 * @returns The transformed GraphQL schema
 */
export function omitIfSchemaTransformer(schema: GraphQLSchema): GraphQLSchema {
    return mapSchema(schema, {
        [MapperKind.OBJECT_FIELD]: (
            fieldConfig: GraphQLFieldConfig<any, any>,
            fieldName: string,
            typeName: string
        ) => {
            const extensions = fieldConfig.extensions || {};

            if (extensions.omitIf === true) {
                return null;
            }

            return fieldConfig;
        },
        [MapperKind.ROOT_FIELD]: (
            fieldConfig: GraphQLFieldConfig<any, any>,
            fieldName: string,
            typeName: string
        ) => {
            const extensions = fieldConfig.extensions || {};

            if (extensions.omitIf === true) {
                return null;
            }

            return fieldConfig;
        },
    });
}
