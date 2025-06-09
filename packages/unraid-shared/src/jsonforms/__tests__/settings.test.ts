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

describe('mergeSettingSlices with as option', () => {
  test('wraps merged properties in the specified key', () => {
    const slice1: SettingSlice = {
      properties: { foo: { type: 'string' } },
      elements: [{ type: 'Control', scope: '#/properties/foo' }],
    };
    const slice2: SettingSlice = {
      properties: { bar: { type: 'number' } },
      elements: [{ type: 'Control', scope: '#/properties/bar' }],
    };
    const merged = mergeSettingSlices([slice1, slice2], { as: 'api' });
    expect(Object.keys(merged.properties)).toEqual(['api']);
    expect(merged.properties.api).toHaveProperty('type', 'object');
    expect(merged.properties.api).toHaveProperty('properties');
    expect(merged.properties.api.properties).toHaveProperty('foo');
    expect(merged.properties.api.properties).toHaveProperty('bar');
    expect(merged.elements.length).toBe(2);
  });

  test('returns merged properties at root if as is not provided', () => {
    const slice1: SettingSlice = {
      properties: { foo: { type: 'string' } },
      elements: [],
    };
    const merged = mergeSettingSlices([slice1]);
    expect(merged.properties).toHaveProperty('foo');
    expect(merged.properties).not.toHaveProperty('api');
  });
});
