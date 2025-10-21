import { describe, expect, it, vi } from "vitest";

import { createTtlMemoizedLoader } from "../create-ttl-memoized-loader.js";

describe("createTtlMemoizedLoader", () => {
  it("reuses cached value within ttl window", () => {
    let loadCount = 0;
    const loader = createTtlMemoizedLoader<number, undefined>({
      ttlMs: 500,
      load: () => {
        loadCount += 1;
        return loadCount;
      },
    });

    expect(loader.get(undefined)).toBe(1);
    expect(loader.get(undefined)).toBe(1);
    expect(loadCount).toBe(1);
  });

  it("evicts cache entries once ttl expires", () => {
    vi.useFakeTimers();
    let loadCount = 0;
    const loader = createTtlMemoizedLoader<number, undefined>({
      ttlMs: 100,
      load: () => {
        loadCount += 1;
        return loadCount;
      },
    });

    expect(loader.get(undefined)).toBe(1);
    vi.advanceTimersByTime(150);
    expect(loader.get(undefined)).toBe(2);
    expect(loadCount).toBe(2);
    vi.useRealTimers();
  });

  it("treats different cache keys as independent entries", () => {
    let loadCount = 0;
    const loader = createTtlMemoizedLoader<number, { key: string }>({
      ttlMs: 500,
      getCacheKey: ({ key }) => key,
      load: ({ key }) => {
        loadCount += 1;
        return Number(`${loadCount}${key.length}`);
      },
    });

    expect(loader.get({ key: "a" })).toBe(11);
    expect(loader.get({ key: "a" })).toBe(11);
    expect(loader.get({ key: "ab" })).toBe(22);
    expect(loadCount).toBe(2);
  });

  it("skips caching when predicate returns false", () => {
    let loadCount = 0;
    const loader = createTtlMemoizedLoader<number, undefined>({
      ttlMs: 500,
      load: () => {
        loadCount += 1;
        return loadCount;
      },
      shouldCache: (value) => value % 2 === 0,
    });

    expect(loader.get(undefined)).toBe(1);
    expect(loader.get(undefined)).toBe(2);
    expect(loader.get(undefined)).toBe(2);
    expect(loadCount).toBe(2);
  });
});
