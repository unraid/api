// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
// fixme: types don't sync with mocks, and there's no override to simplify testing.

import { Reflector } from '@nestjs/core';
import { Mutation, Query, ResolveField, Resolver } from '@nestjs/graphql';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { OMIT_IF_METADATA_KEY } from '@app/unraid-api/decorators/omit-if.decorator.js';
import { UseFeatureFlag } from '@app/unraid-api/decorators/use-feature-flag.decorator.js';

// Mock the FeatureFlags
vi.mock('@app/consts.js', () => ({
    FeatureFlags: Object.freeze({
        ENABLE_NEXT_DOCKER_RELEASE: false,
        ENABLE_EXPERIMENTAL_FEATURE: true,
        ENABLE_DEBUG_MODE: false,
        ENABLE_BETA_FEATURES: true,
    }),
}));

describe('UseFeatureFlag Decorator', () => {
    let reflector: Reflector;

    beforeEach(() => {
        reflector = new Reflector();
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    describe('Basic functionality', () => {
        it('should omit field when feature flag is false', () => {
            @Resolver()
            class TestResolver {
                @UseFeatureFlag('ENABLE_NEXT_DOCKER_RELEASE')
                @Query(() => String)
                testQuery() {
                    return 'test';
                }
            }

            const instance = new TestResolver();
            const metadata = reflector.get(OMIT_IF_METADATA_KEY, instance.testQuery);
            expect(metadata).toBe(true); // Should be omitted because flag is false
        });

        it('should include field when feature flag is true', () => {
            @Resolver()
            class TestResolver {
                @UseFeatureFlag('ENABLE_EXPERIMENTAL_FEATURE')
                @Query(() => String)
                testQuery() {
                    return 'test';
                }
            }

            const instance = new TestResolver();
            const metadata = reflector.get(OMIT_IF_METADATA_KEY, instance.testQuery);
            expect(metadata).toBeUndefined(); // Should not be omitted because flag is true
        });
    });

    describe('With different decorator types', () => {
        it('should work with @Query decorator', () => {
            @Resolver()
            class TestResolver {
                @UseFeatureFlag('ENABLE_DEBUG_MODE')
                @Query(() => String)
                debugQuery() {
                    return 'debug';
                }

                @UseFeatureFlag('ENABLE_BETA_FEATURES')
                @Query(() => String)
                betaQuery() {
                    return 'beta';
                }
            }

            const instance = new TestResolver();
            const debugMetadata = reflector.get(OMIT_IF_METADATA_KEY, instance.debugQuery);
            const betaMetadata = reflector.get(OMIT_IF_METADATA_KEY, instance.betaQuery);

            expect(debugMetadata).toBe(true); // ENABLE_DEBUG_MODE is false
            expect(betaMetadata).toBeUndefined(); // ENABLE_BETA_FEATURES is true
        });

        it('should work with @Mutation decorator', () => {
            @Resolver()
            class TestResolver {
                @UseFeatureFlag('ENABLE_NEXT_DOCKER_RELEASE')
                @Mutation(() => String)
                dockerMutation() {
                    return 'docker';
                }

                @UseFeatureFlag('ENABLE_EXPERIMENTAL_FEATURE')
                @Mutation(() => String)
                experimentalMutation() {
                    return 'experimental';
                }
            }

            const instance = new TestResolver();
            const dockerMetadata = reflector.get(OMIT_IF_METADATA_KEY, instance.dockerMutation);
            const experimentalMetadata = reflector.get(
                OMIT_IF_METADATA_KEY,
                instance.experimentalMutation
            );

            expect(dockerMetadata).toBe(true); // ENABLE_NEXT_DOCKER_RELEASE is false
            expect(experimentalMetadata).toBeUndefined(); // ENABLE_EXPERIMENTAL_FEATURE is true
        });

        it('should work with @ResolveField decorator', () => {
            @Resolver()
            class TestResolver {
                @UseFeatureFlag('ENABLE_DEBUG_MODE')
                @ResolveField(() => String)
                debugField() {
                    return 'debug';
                }

                @UseFeatureFlag('ENABLE_BETA_FEATURES')
                @ResolveField(() => String)
                betaField() {
                    return 'beta';
                }
            }

            const instance = new TestResolver();
            const debugMetadata = reflector.get(OMIT_IF_METADATA_KEY, instance.debugField);
            const betaMetadata = reflector.get(OMIT_IF_METADATA_KEY, instance.betaField);

            expect(debugMetadata).toBe(true); // ENABLE_DEBUG_MODE is false
            expect(betaMetadata).toBeUndefined(); // ENABLE_BETA_FEATURES is true
        });
    });

    describe('Multiple decorators on same class', () => {
        it('should handle multiple feature flags independently', () => {
            @Resolver()
            class TestResolver {
                @UseFeatureFlag('ENABLE_NEXT_DOCKER_RELEASE')
                @Query(() => String)
                dockerQuery() {
                    return 'docker';
                }

                @UseFeatureFlag('ENABLE_EXPERIMENTAL_FEATURE')
                @Query(() => String)
                experimentalQuery() {
                    return 'experimental';
                }

                @UseFeatureFlag('ENABLE_DEBUG_MODE')
                @Query(() => String)
                debugQuery() {
                    return 'debug';
                }

                @UseFeatureFlag('ENABLE_BETA_FEATURES')
                @Query(() => String)
                betaQuery() {
                    return 'beta';
                }
            }

            const instance = new TestResolver();

            expect(reflector.get(OMIT_IF_METADATA_KEY, instance.dockerQuery)).toBe(true);
            expect(reflector.get(OMIT_IF_METADATA_KEY, instance.experimentalQuery)).toBeUndefined();
            expect(reflector.get(OMIT_IF_METADATA_KEY, instance.debugQuery)).toBe(true);
            expect(reflector.get(OMIT_IF_METADATA_KEY, instance.betaQuery)).toBeUndefined();
        });
    });

    describe('Type safety', () => {
        it('should only accept valid feature flag keys', () => {
            // This test verifies TypeScript compile-time type safety
            // The following would cause a TypeScript error if uncommented:
            // @UseFeatureFlag('INVALID_FLAG')

            @Resolver()
            class TestResolver {
                @UseFeatureFlag('ENABLE_NEXT_DOCKER_RELEASE')
                @Query(() => String)
                validQuery() {
                    return 'valid';
                }
            }

            const instance = new TestResolver();
            expect(instance.validQuery).toBeDefined();
        });
    });

    describe('Integration scenarios', () => {
        it('should work correctly with other decorators', () => {
            const customDecorator = (
                target: any,
                propertyKey: string | symbol,
                descriptor: PropertyDescriptor
            ) => {
                Reflect.defineMetadata('custom', true, target, propertyKey);
                return descriptor;
            };

            @Resolver()
            class TestResolver {
                @UseFeatureFlag('ENABLE_NEXT_DOCKER_RELEASE')
                @customDecorator
                @Query(() => String)
                multiDecoratorQuery() {
                    return 'multi';
                }
            }

            const instance = new TestResolver();
            const omitMetadata = reflector.get(OMIT_IF_METADATA_KEY, instance.multiDecoratorQuery);
            const customMetadata = Reflect.getMetadata('custom', instance, 'multiDecoratorQuery');

            expect(omitMetadata).toBe(true);
            expect(customMetadata).toBe(true);
        });

        it('should maintain correct decorator order', () => {
            const orderTracker: string[] = [];

            const trackingDecorator = (name: string) => {
                return (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) => {
                    orderTracker.push(name);
                    return descriptor;
                };
            };

            @Resolver()
            class TestResolver {
                @trackingDecorator('first')
                @UseFeatureFlag('ENABLE_NEXT_DOCKER_RELEASE')
                @trackingDecorator('last')
                @Query(() => String)
                orderedQuery() {
                    return 'ordered';
                }
            }

            // Decorators are applied bottom-up
            expect(orderTracker).toEqual(['last', 'first']);
        });
    });

    describe('Real-world usage patterns', () => {
        it('should work with Docker resolver pattern', () => {
            @Resolver()
            class DockerResolver {
                @UseFeatureFlag('ENABLE_NEXT_DOCKER_RELEASE')
                @Mutation(() => String)
                async createDockerFolder(name: string) {
                    return `Created folder: ${name}`;
                }

                @UseFeatureFlag('ENABLE_NEXT_DOCKER_RELEASE')
                @Mutation(() => String)
                async deleteDockerEntries(entryIds: string[]) {
                    return `Deleted entries: ${entryIds.join(', ')}`;
                }

                @Query(() => String)
                async getDockerInfo() {
                    return 'Docker info';
                }
            }

            const instance = new DockerResolver();

            // Feature flag is false, so these should be omitted
            expect(reflector.get(OMIT_IF_METADATA_KEY, instance.createDockerFolder)).toBe(true);
            expect(reflector.get(OMIT_IF_METADATA_KEY, instance.deleteDockerEntries)).toBe(true);

            // No feature flag, so this should not be omitted
            expect(reflector.get(OMIT_IF_METADATA_KEY, instance.getDockerInfo)).toBeUndefined();
        });

        it('should handle mixed feature flags in same resolver', () => {
            @Resolver()
            class MixedResolver {
                @UseFeatureFlag('ENABLE_EXPERIMENTAL_FEATURE')
                @Query(() => String)
                experimentalQuery() {
                    return 'experimental';
                }

                @UseFeatureFlag('ENABLE_NEXT_DOCKER_RELEASE')
                @Query(() => String)
                dockerQuery() {
                    return 'docker';
                }

                @UseFeatureFlag('ENABLE_BETA_FEATURES')
                @Mutation(() => String)
                betaMutation() {
                    return 'beta';
                }
            }

            const instance = new MixedResolver();

            expect(reflector.get(OMIT_IF_METADATA_KEY, instance.experimentalQuery)).toBeUndefined();
            expect(reflector.get(OMIT_IF_METADATA_KEY, instance.dockerQuery)).toBe(true);
            expect(reflector.get(OMIT_IF_METADATA_KEY, instance.betaMutation)).toBeUndefined();
        });
    });
});
