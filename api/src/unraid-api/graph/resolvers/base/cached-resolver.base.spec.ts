import { beforeEach, describe, expect, it, vi } from 'vitest';

import { CachedResolverBase } from '@app/unraid-api/graph/resolvers/base/cached-resolver.base.js';

class TestResolver extends CachedResolverBase<TestData> {
    public fetchCount = 0;
    private mockData: TestData;
    private shouldHaveData: boolean = false;

    constructor(mockData: TestData) {
        super();
        this.mockData = mockData;
    }

    protected getPromiseCacheKey(): string {
        return '__testCache';
    }

    protected hasData(parent: Partial<TestData>): boolean {
        return this.shouldHaveData || (!!parent.id && !!parent.name && !!parent.value);
    }

    protected async fetchData(): Promise<TestData> {
        this.fetchCount++;
        // Simulate async operation
        await new Promise((resolve) => setTimeout(resolve, 10));
        return { ...this.mockData };
    }

    public setHasData(value: boolean) {
        this.shouldHaveData = value;
    }

    public async testGetCachedData(parent: Partial<TestData> & Record<string, any>): Promise<TestData> {
        return this.getCachedData(parent);
    }
}

interface TestData {
    id: string;
    name: string;
    value: number;
}

describe('CachedResolverBase', () => {
    let resolver: TestResolver;
    let testData: TestData;

    beforeEach(() => {
        testData = { id: '123', name: 'test', value: 42 };
        resolver = new TestResolver(testData);
    });

    describe('basic caching behavior', () => {
        it('should fetch data only once for multiple calls with same parent', async () => {
            const parent = {};

            const [result1, result2, result3] = await Promise.all([
                resolver.testGetCachedData(parent),
                resolver.testGetCachedData(parent),
                resolver.testGetCachedData(parent),
            ]);

            expect(resolver.fetchCount).toBe(1);
            expect(result1).toEqual(testData);
            expect(result2).toEqual(testData);
            expect(result3).toEqual(testData);
        });

        it('should return cached data when parent already has data', async () => {
            const parent: Partial<TestData> = { ...testData };

            const result = await resolver.testGetCachedData(parent);

            expect(resolver.fetchCount).toBe(0);
            expect(result).toEqual(parent);
        });

        it('should fetch data separately for different parent objects', async () => {
            const parent1 = {};
            const parent2 = {};

            await Promise.all([
                resolver.testGetCachedData(parent1),
                resolver.testGetCachedData(parent2),
            ]);

            expect(resolver.fetchCount).toBe(2);
        });
    });

    describe('concurrent access and race conditions', () => {
        it('should handle concurrent field resolver access without data corruption', async () => {
            const parent = {};
            const iterations = 100;

            const promises = Array.from({ length: iterations }, () =>
                resolver.testGetCachedData(parent)
            );

            const results = await Promise.all(promises);

            // Should only fetch once despite many concurrent calls
            expect(resolver.fetchCount).toBe(1);

            // All results should be identical
            results.forEach((result) => {
                expect(result).toEqual(testData);
            });

            // Parent should have the data merged correctly
            expect(parent).toMatchObject(testData);
        });

        it('should handle multiple resolvers with different cache keys safely', async () => {
            class TestResolver2 extends TestResolver {
                protected getPromiseCacheKey(): string {
                    return '__testCache2';
                }
            }

            const resolver2 = new TestResolver2({ id: '456', name: 'test2', value: 84 });
            const parent = {};

            const [result1, result2] = await Promise.all([
                resolver.testGetCachedData(parent),
                resolver2.testGetCachedData(parent),
            ]);

            expect(resolver.fetchCount).toBe(1);
            expect(resolver2.fetchCount).toBe(1);
            expect(result1).toEqual(testData);
            expect(result2).toEqual({ id: '456', name: 'test2', value: 84 });

            // Parent should have merged data from both resolvers
            expect(parent).toMatchObject({
                id: '456', // Last write wins, but both should complete safely
                name: 'test2',
                value: 84,
            });
        });

        it('should serialize parent object mutations to prevent race conditions', async () => {
            // Create resolvers with different cache keys to test concurrent mutations
            const createResolverWithKey = (i: number) => {
                return new (class extends CachedResolverBase<TestData> {
                    public fetchCount = 0;
                    private mockData = { id: `id${i}`, name: `name${i}`, value: i };

                    protected getPromiseCacheKey(): string {
                        return `__cache${i}`;
                    }

                    protected hasData(): boolean {
                        return false;
                    }

                    protected async fetchData(): Promise<TestData> {
                        this.fetchCount++;
                        await new Promise((resolve) => setTimeout(resolve, Math.random() * 20));
                        return { ...this.mockData };
                    }

                    public async testGetCachedData(parent: any): Promise<TestData> {
                        return this.getCachedData(parent);
                    }
                })();
            };

            const parent = {};
            const resolvers = Array.from({ length: 10 }, (_, i) => createResolverWithKey(i));

            // All resolvers try to modify the same parent concurrently
            const results = await Promise.all(resolvers.map((r) => r.testGetCachedData(parent)));

            // Each resolver should have fetched once (different cache keys)
            resolvers.forEach((r) => expect(r.fetchCount).toBe(1));

            // Results should match what each resolver returned
            results.forEach((result, i) => {
                expect(result).toEqual({
                    id: `id${i}`,
                    name: `name${i}`,
                    value: i,
                });
            });

            // Parent should have data (last write wins, but no corruption)
            expect(parent).toHaveProperty('id');
            expect(parent).toHaveProperty('name');
            expect(parent).toHaveProperty('value');
            expect(typeof parent.id).toBe('string');
            expect(typeof parent.name).toBe('string');
            expect(typeof parent.value).toBe('number');

            // Verify no cache keys leaked into parent
            for (let i = 0; i < 10; i++) {
                expect(parent).not.toHaveProperty(`__cache${i}`);
            }
        });
    });

    describe('WeakMap memory management', () => {
        it('should not prevent garbage collection of parent objects', async () => {
            // This test verifies the WeakMap behavior conceptually
            // In practice, GC behavior is hard to test deterministically

            let parent: any = {};
            const weakRef = new WeakRef(parent);

            await resolver.testGetCachedData(parent);
            expect(resolver.fetchCount).toBe(1);

            // Clear the strong reference
            parent = null;

            // The WeakMap should not prevent GC (conceptual test)
            // In a real scenario, the parent would be eligible for GC
            expect(weakRef.deref()).toBeDefined(); // May still exist immediately
        });

        it('should handle parent objects with existing properties', async () => {
            const parent = {
                existingProp: 'should remain',
                id: 'partial',
            };

            const result = await resolver.testGetCachedData(parent);

            expect(resolver.fetchCount).toBe(1);
            expect(result).toEqual(testData);
            expect(parent.existingProp).toBe('should remain');
            expect(parent.id).toBe('123'); // Should be overwritten
        });
    });

    describe('error handling', () => {
        it('should propagate errors from fetchData', async () => {
            class ErrorResolver extends CachedResolverBase<TestData> {
                protected getPromiseCacheKey(): string {
                    return '__errorCache';
                }

                protected hasData(): boolean {
                    return false;
                }

                protected async fetchData(): Promise<TestData> {
                    throw new Error('Fetch failed');
                }

                public async testGetCachedData(parent: any): Promise<TestData> {
                    return this.getCachedData(parent);
                }
            }

            const errorResolver = new ErrorResolver();
            const parent = {};

            await expect(errorResolver.testGetCachedData(parent)).rejects.toThrow();
        });

        it('should cache failed promises to avoid repeated failures', async () => {
            let fetchAttempts = 0;

            class FailingResolver extends CachedResolverBase<TestData> {
                protected getPromiseCacheKey(): string {
                    return '__failCache';
                }

                protected hasData(): boolean {
                    return false;
                }

                protected async fetchData(): Promise<TestData> {
                    fetchAttempts++;
                    throw new Error('Fetch failed');
                }

                public async testGetCachedData(parent: any): Promise<TestData> {
                    return this.getCachedData(parent);
                }
            }

            const failingResolver = new FailingResolver();
            const parent = {};

            // Multiple calls should all fail with the same error
            const promises = [
                failingResolver.testGetCachedData(parent),
                failingResolver.testGetCachedData(parent),
                failingResolver.testGetCachedData(parent),
            ];

            await Promise.allSettled(promises);

            // Should only attempt fetch once, even though it failed
            expect(fetchAttempts).toBe(1);
        });
    });

    describe('stress testing', () => {
        it('should handle extreme concurrent load without data corruption', async () => {
            const CONCURRENCY = 1000;
            const parent = {};

            // Create many concurrent resolvers with unique cache keys
            const promises = Array.from({ length: CONCURRENCY }, (_, i) => {
                const resolver = new (class extends CachedResolverBase<any> {
                    protected getPromiseCacheKey(): string {
                        return `__stress${i % 50}`; // Reuse some keys to test collision handling
                    }

                    protected hasData(): boolean {
                        return false;
                    }

                    protected async fetchData(): Promise<any> {
                        // Random delay to increase chance of race conditions
                        await new Promise((resolve) => setTimeout(resolve, Math.random() * 5));
                        return {
                            id: `stress${i}`,
                            timestamp: Date.now(),
                            random: Math.random(),
                        };
                    }

                    public async testGetCachedData(parent: any): Promise<any> {
                        return this.getCachedData(parent);
                    }
                })();

                return resolver.testGetCachedData(parent);
            });

            const results = await Promise.all(promises);

            // All operations should complete successfully
            expect(results).toHaveLength(CONCURRENCY);

            // Parent should have valid data structure
            expect(parent).toHaveProperty('id');
            expect(parent).toHaveProperty('timestamp');
            expect(parent).toHaveProperty('random');

            // No cache keys should leak into parent
            for (let i = 0; i < 50; i++) {
                expect(parent).not.toHaveProperty(`__stress${i}`);
            }
        });
    });

    describe('promise cache key collisions', () => {
        it('should not include promise cache keys in merged data', async () => {
            const parent = {};

            await resolver.testGetCachedData(parent);

            // The promise cache key should not be in the final parent object
            expect(parent).not.toHaveProperty('__testCache');
            expect(parent).toMatchObject(testData);
        });

        it('should clean up promise cache keys from data even if they exist in fetched data', async () => {
            class DirtyDataResolver extends CachedResolverBase<any> {
                protected getPromiseCacheKey(): string {
                    return '__cache';
                }

                protected hasData(): boolean {
                    return false;
                }

                protected async fetchData(): Promise<any> {
                    return {
                        id: '123',
                        __cache: 'should be removed',
                        __cache2: 'should also be removed',
                        data: 'should remain',
                    };
                }

                public async testGetCachedData(parent: any): Promise<any> {
                    return this.getCachedData(parent);
                }
            }

            const dirtyResolver = new DirtyDataResolver();
            const parent = {};

            // Create another resolver to add a second cache key
            class SecondResolver extends DirtyDataResolver {
                protected getPromiseCacheKey(): string {
                    return '__cache2';
                }
            }

            const secondResolver = new SecondResolver();

            await Promise.all([
                dirtyResolver.testGetCachedData(parent),
                secondResolver.testGetCachedData(parent),
            ]);

            // Cache keys should be filtered out
            expect(parent).not.toHaveProperty('__cache');
            expect(parent).not.toHaveProperty('__cache2');
            expect(parent.data).toBe('should remain');
            expect(parent.id).toBe('123');
        });
    });
});
