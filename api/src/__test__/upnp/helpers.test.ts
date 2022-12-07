import { test, expect, vi } from 'vitest';
import { getWanPortForUpnp } from '@app/upnp/helpers';
import { type Mapping } from '@runonflux/nat-upnp';

test('it successfully gets a wan port given no exclusions', () => {
	const port = getWanPortForUpnp(null, 36_000, 38_000);
	expect(port).toBeGreaterThan(35_999);
	expect(port).toBeLessThan(38_001);
});

test('it fails to get a wan port given exclusions', () => {
	const port = getWanPortForUpnp([{ public: { port: 36_000 } }] as Mapping[], 36_000, 36_000);
	expect(port).toBeNull();
});

test('it succeeds in getting a wan port given exclusions', () => {
	const port = getWanPortForUpnp([{ public: { port: 36_000 } }] as Mapping[], 30_000, 36_000);
	expect(port).not.toBeNull();
});
