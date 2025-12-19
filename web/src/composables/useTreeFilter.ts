import { computed, ref } from 'vue';

import type { TreeRow } from '@/composables/useTreeData';
import type { Ref } from 'vue';

type SearchAccessor<T> = (row: TreeRow<T>) => unknown | unknown[];

interface UseTreeFilterOptions<T> {
  data: Ref<TreeRow<T>[]>;
  searchableKeys?: string[];
  searchAccessor?: SearchAccessor<T>;
  includeMetaInSearch?: boolean;
}

export function useTreeFilter<T>({
  data,
  searchableKeys = ['id', 'name', 'type'],
  searchAccessor,
  includeMetaInSearch = true,
}: UseTreeFilterOptions<T>) {
  const globalFilter = ref('');

  const filterTerm = computed(() => globalFilter.value.trim().toLowerCase());

  function collectSearchableStrings(input: unknown, seen = new Set<unknown>()): string[] {
    if (input === null || input === undefined) {
      return [];
    }

    if (typeof input === 'string' || typeof input === 'number') {
      return [String(input)];
    }

    if (typeof input === 'boolean') {
      return [input ? 'true' : 'false'];
    }

    if (seen.has(input)) {
      return [];
    }

    seen.add(input);

    if (Array.isArray(input)) {
      return input.flatMap((value) => collectSearchableStrings(value, seen));
    }

    if (typeof input === 'object') {
      return Object.values(input as Record<string, unknown>).flatMap((value) =>
        collectSearchableStrings(value, seen)
      );
    }

    return [];
  }

  function getValueByKey(row: TreeRow<T>, key: string): unknown {
    const segments = key.split('.');
    let current: unknown = row;

    for (const segment of segments) {
      if (current === null || current === undefined || typeof current !== 'object') {
        return undefined;
      }
      current = (current as Record<string, unknown>)[segment];
    }

    return current;
  }

  function toArray(value: unknown | unknown[]): unknown[] {
    if (Array.isArray(value)) {
      return value;
    }
    return value !== undefined && value !== null ? [value] : [];
  }

  function getRowSearchValues(row: TreeRow<T>): string[] {
    const values: unknown[] = [];

    for (const key of searchableKeys) {
      const resolved = getValueByKey(row, key);
      if (resolved !== undefined && resolved !== null) {
        values.push(resolved);
      }
    }

    if (searchAccessor) {
      try {
        values.push(...toArray(searchAccessor(row)));
      } catch (error) {
        if (import.meta?.env?.DEV) {
          console.warn('TreeFilter searchAccessor error', error);
        }
      }
    }

    if (includeMetaInSearch && row.meta) {
      values.push(row.meta);
    }

    return values
      .flatMap((value) => collectSearchableStrings(value, new Set()))
      .filter((str) => str.trim().length);
  }

  function rowMatchesTerm(row: TreeRow<T>, term: string): boolean {
    if (!term) return true;

    return getRowSearchValues(row)
      .map((value) => value.toLowerCase())
      .some((value) => value.includes(term));
  }

  function filterRowsByTerm(rows: TreeRow<T>[], term: string): TreeRow<T>[] {
    if (!term) {
      return rows;
    }

    return rows
      .map((row) => {
        const filteredChildren = row.children ? filterRowsByTerm(row.children, term) : [];
        const matches = rowMatchesTerm(row, term);

        if (!matches && filteredChildren.length === 0) {
          return null;
        }

        return {
          ...row,
          children: row.children ? filteredChildren : undefined,
        } as TreeRow<T>;
      })
      .filter((row): row is TreeRow<T> => row !== null);
  }

  const filteredData = computed(() => {
    const term = filterTerm.value;
    return term ? filterRowsByTerm(data.value, term) : data.value;
  });

  function setGlobalFilter(value: string) {
    globalFilter.value = value;
  }

  return {
    globalFilter,
    filterTerm,
    filteredData,
    setGlobalFilter,
  };
}
