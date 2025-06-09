import { expect, test, describe } from "bun:test";
import { mergeSettingSlices, type SettingSlice } from "../settings.js";

describe("mergeSettingSlices element ordering", () => {
  test("concatenates elements in slice order", () => {
    const slice1: SettingSlice = {
      properties: { one: { type: "string" } },
      elements: [{ type: "Control", scope: "#/properties/one" }],
    };
    const slice2: SettingSlice = {
      properties: { two: { type: "string" } },
      elements: [{ type: "Control", scope: "#/properties/two" }],
    };

    const merged = mergeSettingSlices([slice2, slice1]); // intentionally reversed

    expect(merged.elements[0]).toEqual(slice2.elements[0]);
    expect(merged.elements[1]).toEqual(slice1.elements[0]);
  });
});
