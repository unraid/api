import { nextTick, ref, watch } from 'vue';

import type { ComputedRef, Ref } from 'vue';

/**
 * Keeps a table's column visibility in sync with default + saved preferences and emits
 * optimistic updates whenever the user toggles a column.
 *
 * The composable assumes the table exposes a TanStack-style API (like Nuxt UI's `UTable`).
 * Consumers provide the resolved visibility map (defaults merged with stored prefs) and
 * a persistence callback that will be invoked with a normalised visibility record.
 *
 * Example:
 * ```ts
 * const baseTableRef = ref<ColumnVisibilityTableInstance | null>(null);
 * const defaults = computed(() => ({ status: true, version: false }));
 * const resolved = computed(() => ({ ...defaults.value, ...prefs.value }));
 *
 * const { persistCurrentColumnVisibility } = usePersistentColumnVisibility({
 *   tableRef: baseTableRef,
 *   resolvedVisibility: resolved,
 *   fallbackVisibility: defaults,
 *   onPersist: (visibility) => savePrefs(visibility),
 * });
 * ```
 */

export interface ColumnVisibilityTableColumn {
  id: string;
  getCanHide: () => boolean;
  getIsVisible: () => boolean;
  toggleVisibility: (visible: boolean) => void;
}

export interface ColumnVisibilityTableApi {
  getAllColumns: () => ColumnVisibilityTableColumn[];
  setColumnVisibility?: (
    updater: Record<string, boolean> | ((prev: Record<string, boolean>) => Record<string, boolean>)
  ) => void;
  getColumn?: (id: string) => { toggleVisibility: (visible: boolean) => void } | undefined;
}

export interface ColumnVisibilityTableInstance {
  columnVisibility?: { value: Record<string, boolean> };
  tableApi?: ColumnVisibilityTableApi;
}

/**
 * Options for `usePersistentColumnVisibility`.
 */
interface UsePersistentColumnVisibilityOptions {
  /**
   * Reactive ref to the table component instance (must expose `columnVisibility` + `tableApi`).
   */
  tableRef: Ref<ColumnVisibilityTableInstance | null>;
  /**
   * Computed visibility map that reflects the desired visibility (defaults merged with saved prefs).
   */
  resolvedVisibility: ComputedRef<Record<string, boolean>>;
  /**
   * Fallback default visibility used when the table API cannot provide all hideable column ids.
   */
  fallbackVisibility: ComputedRef<Record<string, boolean>>;
  /**
   * Callback invoked with a normalised visibility record whenever the user changes column state.
   */
  onPersist: (visibility: Record<string, boolean>) => void;
  /**
   * Optional guard; return `false` to skip persisting (e.g. compact mode).
   */
  isPersistenceEnabled?: () => boolean;
}

function getEffectiveVisibility(
  visibility: Record<string, boolean> | null | undefined,
  columnId: string
): boolean {
  if (!visibility) return true;
  if (Object.prototype.hasOwnProperty.call(visibility, columnId)) {
    return visibility[columnId];
  }
  return true;
}

function visibilityStatesMatch(
  current: Record<string, boolean> | null | undefined,
  target: Record<string, boolean> | null | undefined,
  columnIds: string[] | undefined
): boolean {
  if (!current || !target) return false;
  const keys =
    columnIds && columnIds.length > 0
      ? new Set(columnIds)
      : new Set([...Object.keys(current), ...Object.keys(target)]);

  for (const key of keys) {
    if (getEffectiveVisibility(current, key) !== getEffectiveVisibility(target, key)) {
      return false;
    }
  }

  return true;
}

/**
 * Returns helpers for syncing a table's column visibility with saved preferences.
 */
export function usePersistentColumnVisibility(options: UsePersistentColumnVisibilityOptions) {
  const lastSavedVisibility = ref<Record<string, boolean> | null>(null);

  function isPersistenceEnabled(): boolean {
    return options.isPersistenceEnabled ? options.isPersistenceEnabled() : true;
  }

  function getHideableColumnIds(): string[] {
    const tableApi = options.tableRef.value?.tableApi;
    if (tableApi) {
      return tableApi
        .getAllColumns()
        .filter((column) => column.getCanHide())
        .map((column) => column.id);
    }
    return Object.keys(options.fallbackVisibility.value);
  }

  function normalizeVisibility(
    raw: Record<string, boolean> | null | undefined
  ): Record<string, boolean> {
    const ids = getHideableColumnIds();
    const normalized: Record<string, boolean> = {};
    for (const id of ids) {
      normalized[id] = getEffectiveVisibility(raw, id);
    }
    return normalized;
  }

  function readCurrentVisibility(): Record<string, boolean> | null {
    const tableApi = options.tableRef.value?.tableApi;
    if (!tableApi) return null;

    const record: Record<string, boolean> = {};
    for (const column of tableApi.getAllColumns()) {
      if (!column.getCanHide()) continue;
      record[column.id] = column.getIsVisible();
    }
    return record;
  }

  function applyColumnVisibility(target: Record<string, boolean>) {
    const tableInstance = options.tableRef.value;
    if (!tableInstance?.columnVisibility) return;

    const visibilityRef = tableInstance.columnVisibility;
    const tableApi = tableInstance.tableApi;
    const current = visibilityRef.value || {};
    const columnIds = tableApi
      ? tableApi
          .getAllColumns()
          .filter((column) => column.getCanHide())
          .map((column) => column.id)
      : [];

    if (visibilityStatesMatch(current, target, columnIds)) {
      return;
    }

    if (tableApi?.setColumnVisibility) {
      tableApi.setColumnVisibility(() => ({ ...target }));
    } else {
      visibilityRef.value = { ...target };
    }
  }

  async function persistCurrentColumnVisibility() {
    if (!isPersistenceEnabled()) return;
    await nextTick();
    const current = readCurrentVisibility();
    if (!current) return;

    const normalized = normalizeVisibility(current);
    if (
      lastSavedVisibility.value &&
      visibilityStatesMatch(normalized, lastSavedVisibility.value, Object.keys(normalized))
    ) {
      return;
    }

    lastSavedVisibility.value = { ...normalized };
    options.onPersist({ ...normalized });
  }

  watch(
    () => options.resolvedVisibility.value,
    (target) => {
      applyColumnVisibility(target);
    },
    { immediate: true, deep: true }
  );

  watch(
    options.tableRef,
    () => {
      applyColumnVisibility(options.resolvedVisibility.value);
    },
    { immediate: true, flush: 'post' }
  );

  watch(
    () => options.tableRef.value?.columnVisibility?.value,
    (columnVisibility) => {
      if (!columnVisibility || !isPersistenceEnabled()) {
        return;
      }

      const columnIds = getHideableColumnIds();
      const normalizedCurrent = normalizeVisibility(columnVisibility);

      if (visibilityStatesMatch(normalizedCurrent, options.resolvedVisibility.value, columnIds)) {
        lastSavedVisibility.value = { ...normalizedCurrent };
        return;
      }

      if (
        lastSavedVisibility.value &&
        visibilityStatesMatch(normalizedCurrent, lastSavedVisibility.value, columnIds)
      ) {
        return;
      }

      lastSavedVisibility.value = { ...normalizedCurrent };
      options.onPersist({ ...normalizedCurrent });
    },
    { deep: true }
  );

  return {
    persistCurrentColumnVisibility,
    readCurrentVisibility,
  };
}
