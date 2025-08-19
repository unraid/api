/**
 * Abstract base class for GraphQL resolvers that need to cache data fetching
 * across multiple field resolvers to prevent redundant service calls.
 *
 * This pattern ensures that expensive data fetching operations are only called
 * once per GraphQL request, even when multiple fields are queried.
 */
export abstract class CachedResolverBase<TData> {
    private static readonly promiseCaches = new WeakMap<any, Map<string, Promise<any>>>();

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
            // Create the data fetch promise and cache it immediately
            // The promise itself handles concurrency - multiple awaits on the same promise are safe
            dataPromise = this.fetchData().then((data) => {
                // Merge data into parent, excluding promise cache keys
                Object.keys(data as any).forEach((key) => {
                    if (!parentCache!.has(key)) {
                        (parent as any)[key] = (data as any)[key];
                    }
                });
                return data;
            });

            parentCache.set(promiseKey, dataPromise);
        }

        return dataPromise;
    }
}
