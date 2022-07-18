import { expect, test, vi } from 'vitest';

vi.mock('@app/core/log', () => ({
	logger: {
		info: vi.fn(),
		error: vi.fn(),
		debug: vi.fn(),
	},
}));

test('.switchSource(source: "file" | "nchan") sets the correct source', async () => {
	const { State } = await import('@app/core/states/state');

	// Create a state object
	const state = new State();
	const switchSourceSpy = vi.spyOn(state, 'switchSource');

	// .switchSource should NOT have been called
	expect(switchSourceSpy).toBeCalledTimes(0);
	// The default source is "nchan"
	expect(state._source).toBe('nchan');

	// Switch the source
	state.switchSource('file');

	// .switchSource should have been called once
	expect(switchSourceSpy).toBeCalledTimes(1);
	// The source should now be "file"
	expect(state._source).toBe('file');

	// Switch the source back to "nchan"
	state.switchSource('nchan');

	// .switchSource should have been called twice at this point
	expect(switchSourceSpy).toBeCalledTimes(2);
	// The source should now be "file"
	expect(state._source).toBe('nchan');
});
