import { FeatureFlags } from '@app/consts.js';
import { OmitIf } from '@app/unraid-api/decorators/omit-if.decorator.js';

/**
 * Decorator that conditionally includes a GraphQL field/query/mutation based on a feature flag.
 * The field will only be included in the schema when the feature flag is enabled.
 *
 * @param flagKey - The key of the feature flag in FeatureFlags
 * @returns A decorator that wraps OmitIf
 *
 * @example
 * ```typescript
 * @UseFeatureFlag('ENABLE_NEXT_DOCKER_RELEASE')
 * @Mutation(() => String)
 * async experimentalMutation() {
 *     return 'This mutation is only available when ENABLE_NEXT_DOCKER_RELEASE is true';
 * }
 * ```
 */
export function UseFeatureFlag(flagKey: keyof typeof FeatureFlags): MethodDecorator & PropertyDecorator {
    return OmitIf(!FeatureFlags[flagKey]);
}
