import { expect, test, describe } from "bun:test";

import { getPrefixedSortedKeys } from "../key-order.js";

describe("getPrefixedSortedKeys", () => {
  test("orders prefixed keys first and sorts the rest", () => {
    const map = new Map([
      ["b", 1],
      ["a", 2],
      ["c", 3],
    ] as const);

    const ordered = getPrefixedSortedKeys(map, ["c", "a"] as const);
    expect(ordered).toEqual(["c", "a", "b"]);
  });

  test("ignores unknown keys and deduplicates", () => {
    const map = new Map([
      ["x", 1],
      ["y", 2],
      ["z", 3],
    ] as const);

    const ordered = getPrefixedSortedKeys(map, ["y", "unknown", "y"] as const);
    expect(ordered).toEqual(["y", "x", "z"]);
  });
});

