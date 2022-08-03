import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
	plugins: [tsconfigPaths()],
	test: {
		coverage: {
			all: true,
			include: ['src/**/*'],
			reporter: ['text', 'json', 'html'],
		},
		clearMocks: true,
	},
});
