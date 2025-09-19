import { defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		environment: 'jsdom',
		setupFiles: ['./tests/setupTests.js'],
		globals: true,
		exclude: [
			'*.config.js',
			'banner',
			'dist',
			'docs',
			'examples',
			'node_modules',
			'tests/e2e/**',
		],
		coverage: {
			enabled: true,
			reporter: ['text', 'html'],
			reportsDirectory: 'tests/results/coverage',
			exclude: [
				'*.config.js',
				'banner',
				'dist',
				'docs',
				'examples',
				'node_modules',
				/* for now */
				'server.cjs',
				'src/',
			],
		},
	},
});
