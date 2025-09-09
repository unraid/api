import { Reflector } from '@nestjs/core';
import { Field, Mutation, ObjectType, Query, ResolveField, Resolver } from '@nestjs/graphql';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { OMIT_IF_METADATA_KEY, OmitIf } from '@app/unraid-api/decorators/omit-if.decorator.js';

describe('OmitIf Decorator', () => {
    let reflector: Reflector;

    beforeEach(() => {
        reflector = new Reflector();
    });

    describe('OmitIf', () => {
        it('should set metadata when condition is true', () => {
            class TestResolver {
                @OmitIf(true)
                testMethod() {
                    return 'test';
                }
            }

            const instance = new TestResolver();
            const metadata = reflector.get(OMIT_IF_METADATA_KEY, instance.testMethod);
            expect(metadata).toBe(true);
        });

        it('should not set metadata when condition is false', () => {
            class TestResolver {
                @OmitIf(false)
                testMethod() {
                    return 'test';
                }
            }

            const instance = new TestResolver();
            const metadata = reflector.get(OMIT_IF_METADATA_KEY, instance.testMethod);
            expect(metadata).toBeUndefined();
        });

        it('should evaluate function conditions', () => {
            const mockCondition = vi.fn(() => true);

            class TestResolver {
                @OmitIf(mockCondition)
                testMethod() {
                    return 'test';
                }
            }

            expect(mockCondition).toHaveBeenCalledOnce();
            const instance = new TestResolver();
            const metadata = reflector.get(OMIT_IF_METADATA_KEY, instance.testMethod);
            expect(metadata).toBe(true);
        });

        it('should evaluate function conditions that return false', () => {
            const mockCondition = vi.fn(() => false);

            class TestResolver {
                @OmitIf(mockCondition)
                testMethod() {
                    return 'test';
                }
            }

            expect(mockCondition).toHaveBeenCalledOnce();
            const instance = new TestResolver();
            const metadata = reflector.get(OMIT_IF_METADATA_KEY, instance.testMethod);
            expect(metadata).toBeUndefined();
        });

        it('should work with environment variables', () => {
            const originalEnv = process.env.NODE_ENV;
            process.env.NODE_ENV = 'production';

            class TestResolver {
                @OmitIf(process.env.NODE_ENV === 'production')
                testMethod() {
                    return 'test';
                }
            }

            const instance = new TestResolver();
            const metadata = reflector.get(OMIT_IF_METADATA_KEY, instance.testMethod);
            expect(metadata).toBe(true);

            process.env.NODE_ENV = originalEnv;
        });
    });

    describe('Integration with NestJS GraphQL decorators', () => {
        it('should work with @Query decorator', () => {
            @Resolver()
            class TestResolver {
                @OmitIf(true)
                @Query(() => String)
                omittedQuery() {
                    return 'test';
                }

                @OmitIf(false)
                @Query(() => String)
                includedQuery() {
                    return 'test';
                }
            }

            const instance = new TestResolver();
            const omittedMetadata = reflector.get(OMIT_IF_METADATA_KEY, instance.omittedQuery);
            const includedMetadata = reflector.get(OMIT_IF_METADATA_KEY, instance.includedQuery);

            expect(omittedMetadata).toBe(true);
            expect(includedMetadata).toBeUndefined();
        });

        it('should work with @Mutation decorator', () => {
            @Resolver()
            class TestResolver {
                @OmitIf(true)
                @Mutation(() => String)
                omittedMutation() {
                    return 'test';
                }

                @OmitIf(false)
                @Mutation(() => String)
                includedMutation() {
                    return 'test';
                }
            }

            const instance = new TestResolver();
            const omittedMetadata = reflector.get(OMIT_IF_METADATA_KEY, instance.omittedMutation);
            const includedMetadata = reflector.get(OMIT_IF_METADATA_KEY, instance.includedMutation);

            expect(omittedMetadata).toBe(true);
            expect(includedMetadata).toBeUndefined();
        });

        it('should work with @ResolveField decorator', () => {
            @ObjectType()
            class TestType {
                @Field()
                id: string = '';
            }

            @Resolver(() => TestType)
            class TestResolver {
                @OmitIf(true)
                @ResolveField(() => String)
                omittedField() {
                    return 'test';
                }

                @OmitIf(false)
                @ResolveField(() => String)
                includedField() {
                    return 'test';
                }
            }

            const instance = new TestResolver();
            const omittedMetadata = reflector.get(OMIT_IF_METADATA_KEY, instance.omittedField);
            const includedMetadata = reflector.get(OMIT_IF_METADATA_KEY, instance.includedField);

            expect(omittedMetadata).toBe(true);
            expect(includedMetadata).toBeUndefined();
        });
    });
});
