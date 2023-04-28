import { getBannerPathIfPresent, getCasePathIfPresent } from "@app/core/utils/images/image-file-helpers";
import { store } from "@app/store/index";
import { loadDynamixConfigFile } from "@app/store/modules/dynamix";

import { expect, test } from "vitest";

test('get case path returns expected result', () => {
    expect(getCasePathIfPresent()).resolves.toMatchInlineSnapshot('"/app/dev/dynamix/case-model.png"')
})

test('get banner path returns null (state unloaded)', () => {
    expect(getBannerPathIfPresent()).resolves.toMatchInlineSnapshot('null')
})

test('get banner path returns the banner (state loaded)', async() => {
	await store.dispatch(loadDynamixConfigFile()).unwrap();
    expect(getBannerPathIfPresent()).resolves.toMatchInlineSnapshot('"/app/dev/dynamix/banner.png"');
})

test('get banner path returns null when no banner (state loaded)', async () => {
    await store.dispatch(loadDynamixConfigFile()).unwrap();
    expect(getBannerPathIfPresent('notabanner.png')).resolves.toMatchInlineSnapshot('null');
});