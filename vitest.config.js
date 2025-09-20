import { defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		environment: 'jsdom',
		setupFiles: ['./tests/setupTests.js'],
		globals: true,
		// Optimize for memory usage
		threads: false, // Run tests sequentially to reduce memory pressure
		isolate: true, // Ensure clean state between tests
		maxThreads: 1, // Single thread to avoid memory multiplication
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
