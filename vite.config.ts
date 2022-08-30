import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';
import { config } from 'dotenv';

export default defineConfig(() => {
	config({ path: './.env.test' });
	// Manually set NODE_ENV to make sure we always run tests in test mode
	process.env.NODE_ENV = 'test';
	return {

		plugins: [tsconfigPaths()],
		test: {
			coverage: {
				all: true,
				include: ['src/**/*'],
				reporter: ['text', 'json', 'html'],
			},
			clearMocks: true,
		},
	};
});

