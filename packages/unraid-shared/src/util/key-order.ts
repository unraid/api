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
