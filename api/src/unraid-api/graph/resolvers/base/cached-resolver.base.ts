/**
 * Abstract base class for GraphQL resolvers that need to cache data fetching
 * across multiple field resolvers to prevent redundant service calls.
 *
 * This pattern ensures that expensive data fetching operations are only called
 * once per GraphQL request, even when multiple fields are queried.
 */
export abstract class CachedResolverBase<TData> {
    private static readonly promiseCaches = new WeakMap<any, Map<string, Promise<any>>>();
    private static readonly dataLocks = new WeakMap<any, Promise<void>>();

    /**
     * Get the promise cache key for storing the promise on the parent object
     */
    protected abstract getPromiseCacheKey(): string;

    /**
     * Check if the parent already has the data loaded
     */
    protected abstract hasData(parent: Partial<TData>): boolean;

    /**
     * Fetch the data from the service
     */
    protected abstract fetchData(): Promise<TData>;

    /**
     * Get cached data, fetching it if necessary.
     * This method ensures that fetchData() is only called once per request,
     * even when multiple field resolvers need the data.
     *
     * @param parent The parent object passed by GraphQL
     * @returns The fetched data
     */
    protected async getCachedData(parent: Partial<TData> & Record<string, any>): Promise<TData> {
        // If we already have the full data in parent, return it
        if (this.hasData(parent)) {
            return parent as TData;
        }

        const promiseKey = this.getPromiseCacheKey();

        // Get or create promise cache for this parent object
        let parentCache = CachedResolverBase.promiseCaches.get(parent);
        if (!parentCache) {
            parentCache = new Map<string, Promise<any>>();
            CachedResolverBase.promiseCaches.set(parent, parentCache);
        }

        // Check if we already have a promise for this data
        let dataPromise = parentCache.get(promiseKey);

        if (!dataPromise) {
            // Create the data fetch promise with thread-safe parent mutation
            dataPromise = this.fetchData().then(async (data) => {
                // Wait for any existing lock on the parent object
                const existingLock = CachedResolverBase.dataLocks.get(parent);
                if (existingLock) {
                    await existingLock;
                }

                // Create a new lock for this mutation
                let releaseLock: () => void;
                const lockPromise = new Promise<void>((resolve) => {
                    releaseLock = resolve;
                });
                CachedResolverBase.dataLocks.set(parent, lockPromise);

                try {
                    // Safely merge the data into parent
                    const dataCopy = { ...data } as any;
                    // Remove any promise cache keys that might exist in the data
                    for (const [key] of parentCache!.entries()) {
                        delete dataCopy[key];
                    }
                    Object.assign(parent, dataCopy);
                } finally {
                    // Release the lock
                    releaseLock!();
                    // Clean up the lock if it's still the current one
                    if (CachedResolverBase.dataLocks.get(parent) === lockPromise) {
                        CachedResolverBase.dataLocks.delete(parent);
                    }
                }

                return data;
            });

            parentCache.set(promiseKey, dataPromise);
        }

        return dataPromise;
    }
}
