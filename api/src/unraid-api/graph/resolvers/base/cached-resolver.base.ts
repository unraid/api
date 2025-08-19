/**
 * Abstract base class for GraphQL resolvers that need to cache data fetching
 * across multiple field resolvers to prevent redundant service calls.
 *
 * This pattern ensures that expensive data fetching operations are only called
 * once per GraphQL request, even when multiple fields are queried.
 */
export abstract class CachedResolverBase<TData> {
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

        // Store the promise on the parent object itself to share across field resolvers
        if (!(parent as any)[promiseKey]) {
            (parent as any)[promiseKey] = this.fetchData().then((data) => {
                // Merge the data into parent (excluding the promise cache)
                const dataCopy = { ...data } as any;
                delete dataCopy[promiseKey];
                Object.assign(parent, dataCopy);
                return data;
            });
        }

        // Return the same promise to all field resolvers for this request
        return (parent as any)[promiseKey];
    }
}
