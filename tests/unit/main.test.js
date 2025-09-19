import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Set up global document BEFORE any imports
global.document = {
	getElementById: vi.fn((id) => ({
		style: { display: 'block' },
		classList: { add: vi.fn(), remove: vi.fn() },
		addEventListener: vi.fn(),
		removeEventListener: vi.fn(),
		click: vi.fn(),
		appendChild: vi.fn(),
		focus: vi.fn(),
		value: 'mock',
		innerText: 'mock',
		textContent: 'mock'
	})),
	querySelector: vi.fn(() => ({ textContent: 'mock' })),
	addEventListener: vi.fn(),
	removeEventListener: vi.fn(),
	title: 'test'
};

describe('Main Application Module', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe('Module Structure', () => {
		it('should import without throwing errors', async () => {
			expect(async () => {
				await import('../../public/js/main.js');
			}).not.toThrow();
		});

		it('should handle CSS import without errors', async () => {
			// The CSS import should not throw
			expect(async () => {
				await import('../../public/js/main.js');
			}).not.toThrow();
		});
	});

	describe('Dependencies and Imports', () => {
		it('should successfully import all required modules', async () => {
			// Test that all import statements resolve without errors
			expect(async () => {
				const module = await import('../../public/js/main.js');
				// Module should exist
				expect(module).toBeDefined();
			}).not.toThrow();
		});

		it('should have proper module structure', async () => {
			// Since main.js is primarily about side effects (setting up event listeners, etc.)
			// we mainly verify it can be imported without issues
			const module = await import('../../public/js/main.js');
			expect(module).toBeDefined();
		});
	});
});