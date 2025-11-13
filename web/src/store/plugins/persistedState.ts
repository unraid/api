import type { PiniaPlugin, PiniaPluginContext, StateTree } from 'pinia';

type Path = string;

type PersistConfig = {
  key?: string;
  paths?: Path[];
  storage?: Storage;
};

type ResolvedPersistConfig = Required<PersistConfig>;

declare module 'pinia' {
  interface DefineStoreOptionsBase<S extends StateTree, Store> {
    persist?: false | PersistConfig | PersistConfig[];
  }
}

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const deepCloneState = (value: StateTree): StateTree => JSON.parse(JSON.stringify(value)) as StateTree;

const getSegmentValue = (source: unknown, segment: string): unknown => {
  if (!isObject(source)) {
    return undefined;
  }

  if (!Object.prototype.hasOwnProperty.call(source, segment)) {
    return undefined;
  }

  return source[segment];
};

const ensureChildObject = (
  target: Record<string, unknown>,
  segment: string
): Record<string, unknown> => {
  const existing = target[segment];

  if (isObject(existing)) {
    return existing;
  }

  const next: Record<string, unknown> = {};
  target[segment] = next;
  return next;
};

const resolveStorage = (storage?: Storage): Storage | undefined => {
  if (storage) {
    return storage;
  }

  if (typeof window !== 'undefined' && typeof window.localStorage !== 'undefined') {
    return window.localStorage;
  }

  return undefined;
};

const cloneSubset = (state: StateTree, paths: Path[] | undefined): StateTree => {
  if (!paths || paths.length === 0) {
    return deepCloneState(state);
  }

  const subset: Record<string, unknown> = {};

  for (const path of paths) {
    const segments = path.split('.');
    let sourceCursor: unknown = state;
    let targetCursor: Record<string, unknown> | undefined = subset;

    for (let index = 0; index < segments.length; index += 1) {
      const segment = segments[index];

      if (!segment || segment === '__proto__' || targetCursor === undefined) {
        targetCursor = undefined;
        break;
      }

      const nextSource = getSegmentValue(sourceCursor, segment);

      if (nextSource === undefined) {
        targetCursor = undefined;
        break;
      }

      if (index === segments.length - 1) {
        targetCursor[segment] = nextSource;
      } else {
        targetCursor = ensureChildObject(targetCursor, segment);
        sourceCursor = nextSource;
      }
    }
  }

  return subset;
};

const hydrateFromStorage = (
  context: PiniaPluginContext,
  config: ResolvedPersistConfig,
  storeId: string
) => {
  const { storage, key } = config;

  try {
    const raw = storage.getItem(key);
    if (!raw) {
      return;
    }

    const parsed = JSON.parse(raw);
    if (!isObject(parsed)) {
      return;
    }

    context.store.$patch(parsed as StateTree);
  } catch (error) {
    console.warn(`[pinia:persisted-state] Failed to hydrate store "${storeId}"`, error);
  }
};

const persistState = (context: PiniaPluginContext, config: ResolvedPersistConfig, storeId: string) => {
  const { storage, key, paths } = config;

  try {
    const subset = cloneSubset(context.store.$state, paths);
    storage.setItem(key, JSON.stringify(subset));
  } catch (error) {
    console.warn(`[pinia:persisted-state] Failed to persist store "${storeId}"`, error);
  }
};

const normalizeConfigs = (
  context: PiniaPluginContext,
  options: PersistConfig | PersistConfig[] | false | undefined
): ResolvedPersistConfig[] => {
  if (!options) {
    return [];
  }

  const configs = Array.isArray(options) ? options : [options];

  return configs
    .map((config) => {
      const storage = resolveStorage(config?.storage);

      if (!storage) {
        return null;
      }

      return {
        storage,
        key: config?.key ?? context.store.$id,
        paths: config?.paths ?? [],
      } satisfies ResolvedPersistConfig;
    })
    .filter((config): config is ResolvedPersistConfig => Boolean(config));
};

export const persistedStatePlugin: PiniaPlugin = (context) => {
  const storeId = context.store.$id;
  const configs = normalizeConfigs(context, context.options.persist);

  if (!configs.length) {
    return;
  }

  configs.forEach((config) => {
    hydrateFromStorage(context, config, storeId);
  });

  context.store.$subscribe(
    () => {
      configs.forEach((config) => {
        persistState(context, config, storeId);
      });
    },
    { detached: true }
  );
};

export type { PersistConfig as PersistedStateOptions };
