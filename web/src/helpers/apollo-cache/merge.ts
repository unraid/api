export type ApolloCacheItem = { __ref: string };

/**
 * Merge two arrays of items, deduplicating by reference, and return the merged array.
 *
 * This function takes into account the offset in the existing array where the new items should be inserted.
 *
 * It first filters out any items in the `existing` array that have a reference that is also present in
 * the `incoming` array (i.e. it sets them  to `undefined`).
 *
 * Then, it inserts the `incoming` items at the offset in the `existing` array.
 * Finally, it returns the merged array, removing any `undefined` values.
 *
 * @param existing - The existing array of items.
 * @param incoming - The array of items to merge into the existing array.
 * @param getRef - A function that takes an item and returns its reference.
 * @param {offset} - The offset in the existing array where the new items should be inserted. Defaults to 0.
 * @return The merged array of items.
 */
export function mergeAndDedup<T = ApolloCacheItem, Id = string>(
  existing: T[] = [],
  incoming: T[] = [],
  getRef: (item: T) => Id,
  { offset }: { offset: number } = { offset: 0 }
): T[] {
  const incomingRefs = new Set(incoming.map((item) => getRef(item)));
  // Set duplicated items in `existing` to `undefined`
  //   This allows us to keep the incoming insertion/merge logic simple by retaining item positions.
  //   We can easily remove duplicates later by filtering out `undefined` values.
  const merged = existing.map((item) => (incomingRefs.has(getRef(item)) ? undefined : item));

  // Merges incoming data into the correct offset position. Adapted from:
  // [Apollo Docs](https://www.apollographql.com/docs/react/pagination/core-api#improving-the-merge-function).
  for (let i = 0; i < incoming.length; ++i) {
    merged[offset + i] = incoming[i];
  }
  return merged.filter((item) => item !== undefined);
}
