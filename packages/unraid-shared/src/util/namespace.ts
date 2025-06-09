/**
 * Prefixes only the **top-level** keys of the supplied object with the given namespace.
 *
 * The function does *not* attempt to recursively flatten nested objects or arrays—those
 * structures are preserved intact.  This is sufficient for namespacing independent
 * settings fragments so that their top-level fields do not collide while still keeping
 * each fragment's internal structure untouched.
 *
 * @example
 * const obj = { a: 1, b: { c: 2 } };
 * namespaceObject(obj, 'test');
 * // ➜ { 'test.a': 1, 'test.b': { c: 2 } }
 *
 * @example
 * const obj = { arr: [1, { x: 2 }] };
 * namespaceObject(obj, 'test');
 * // ➜ { 'test.arr': [1, { x: 2 }] }
 *
 * @param obj - The object whose top-level keys should be namespaced
 * @param namespace - The namespace prefix to add to each top-level key
 * @returns A **shallow** object with namespaced keys
 */
export function namespaceObject<T extends object>(
  obj: T,
  namespace: string
): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(obj).map(([key, value]) => [`${namespace}.${key}`, value])
  );
}

/**
 * Removes the namespace prefix from the **top-level** keys of an object.
 *
 * Any key that does not begin with the provided namespace (followed by a dot) is
 * ignored.  Like its counterpart, the function performs no deep transformation—values
 * are copied as-is.
 *
 * @example
 * const flat = { 'test.a': 1, 'test.b': { c: 2 } };
 * denamespaceObject(flat, 'test');
 * // ➜ { a: 1, b: { c: 2 } }
 *
 * @example
 * const flat = { 'test.arr': [1, { x: 2 }] };
 * denamespaceObject(flat, 'test');
 * // ➜ { arr: [1, { x: 2 }] }
 *
 * @param obj - The object from which to remove the namespace prefix
 * @param namespace - The namespace prefix to remove from keys
 * @returns A new object with the namespace prefix removed from keys
 */
export function denamespaceObject(
  obj: Record<string, unknown>,
  namespace: string
): Record<string, unknown> {
  const prefix = `${namespace}.`;
  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(obj)) {
    if (key.startsWith(prefix)) {
      result[key.slice(prefix.length)] = value;
    }
  }

  return result;
}

/**
 * Options for controlling how denamespaceAll processes keys.
 */
export interface DenamespaceOptions {
  /**
   * Optional list of namespaces to extract. If provided, only keys with these namespaces
   * will be extracted into nested objects. Other keys will be handled according to
   * `stripUnmatched`.
   */
  namespaces?: readonly string[];
  /**
   * If true, keys that don't match the allowed namespaces (or have no namespace)
   * will be omitted from the result. Defaults to false.
   */
  stripUnmatched?: boolean;
}

/**
 * Groups a flat object of namespaced keys into an object keyed by namespace.
 *
 * Each key of the input object is inspected:
 *   • If it contains a dot (`.`), the portion before the first dot is treated as the namespace
 *     and the remainder as the inner key.
 *   • If `options.namespaces` is provided **and** the extracted namespace is not in that list,
 *     the key is handled according to `options.stripUnmatched`.
 *   • Keys without a dot (i.e. already "un-namespaced") are handled according to `options.stripUnmatched`.
 *
 * Example:
 * ```ts
 * const input = {
 *   'api.sandbox': true,
 *   'api.debug': false,
 *   'user.name': 'Alice',
 *   version: '1.0',
 * };
 *
 * // Extract all namespaces
 * denamespaceAll(input);
 * // ➜ {
 * //   api: { sandbox: true, debug: false },
 * //   user: { name: 'Alice' },
 * //   version: '1.0'
 * // }
 *
 * // Filter to specific namespaces, keeping others at root
 * denamespaceAll(input, { namespaces: ['api'] });
 * // ➜ {
 * //   api: { sandbox: true, debug: false },
 * //   'user.name': 'Alice',   // kept at root
 * //   version: '1.0'
 * // }
 *
 * // Filter and strip unmatched
 * denamespaceAll(input, { namespaces: ['api'], stripUnmatched: true });
 * // ➜ {
 * //   api: { sandbox: true, debug: false }
 * // }
 * ```
 *
 * @param obj - Flat object whose keys may be prefixed with a namespace.
 * @param options - Optional configuration for how to process the keys.
 * @returns An object where each namespace becomes a nested object containing its stripped keys.
 */
export function denamespaceAll(
  obj: Record<string, unknown>,
  options: DenamespaceOptions = {}
): Record<string, unknown> {
  const { namespaces, stripUnmatched = false } = options;
  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(obj)) {
    const dotIndex = key.indexOf(".");

    // No namespace present
    if (dotIndex === -1) {
      if (!stripUnmatched) {
        result[key] = value;
      }
      continue;
    }

    const ns = key.slice(0, dotIndex);

    if (namespaces && !namespaces.includes(ns)) {
      if (!stripUnmatched) {
        result[key] = value;
      }
      continue;
    }

    const innerKey = key.slice(dotIndex + 1);
    if (innerKey.length === 0) {
      // Edge-case: dangling dot
      if (!stripUnmatched) {
        result[key] = value;
      }
      continue;
    }

    const bucket = (result[ns] ??= {});
    if (
      typeof bucket === "object" &&
      bucket !== null &&
      !Array.isArray(bucket)
    ) {
      (bucket as Record<string, unknown>)[innerKey] = value;
    } else {
      // Root already contains a non-object with the same namespace name.
      if (!stripUnmatched) {
        result[key] = value;
      }
    }
  }

  return result;
}
