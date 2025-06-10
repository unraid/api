/**
 * Returns Map keys with specified ordering preserved, followed by remaining keys in deterministic ASCII order.
 *
 * Useful for maintaining consistent object property ordering in serialization, UI rendering,
 * or API responses where certain keys should appear first while ensuring deterministic output.
 *
 * @param map - Source Map to extract keys from
 * @param orderedKeys - Keys to prioritize in the specified order (duplicates and non-existent keys ignored)
 * @returns Array of keys with prefixed ordering preserved, remaining keys in ASCII sort
 *
 * @example
 * ```ts
 * const data = new Map([['id', 1], ['name', 'test'], ['created', Date.now()]]);
 * getPrefixedSortedKeys(data, ['name', 'id']);
 * // Returns: ['name', 'id', 'created']
 * ```
 */
export function getPrefixedSortedKeys<K extends keyof any>(
  map: Map<K, unknown>,
  orderedKeys: K[] = []
): K[] {
  const seen = new Set<K>();

  // Keep the provided order for prefixed keys and ignore duplicates / unknowns
  const prefixed: K[] = [];
  for (const key of orderedKeys) {
    if (map.has(key) && !seen.has(key)) {
      seen.add(key);
      prefixed.push(key);
    }
  }

  // Append remaining keys in natural (ASCII) order for determinism
  const remaining = Array.from(map.keys())
    .filter((k) => !seen.has(k))
    .sort((a, b) => String(a).localeCompare(String(b)));

  return [...prefixed, ...remaining];
}
