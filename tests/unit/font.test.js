import { describe, it, expect, beforeEach, vi } from 'vitest';
import { loadFontFromXBData, loadFontFromImage } from '../../public/js/font.js';

// Mock the UI module
vi.mock('../../public/js/ui.js', () => ({
	createCanvas: vi.fn(() => ({
		getContext: vi.fn(() => ({
			drawImage: vi.fn(),
			getImageData: vi.fn(() => ({
				data: new Uint8ClampedArray(64),
				width: 8,
				height: 8,
			})),
			putImageData: vi.fn(),
			clearRect: vi.fn(),
			fillRect: vi.fn(),
			createImageData: vi.fn((width, height) => ({
				data: new Uint8ClampedArray(width * height * 4),
				width: width,
				height: height,
			})),
		})),
		width: 128,
		height: 256,
	})),
}));

describe('Font Module', () => {
	let mockPalette;

	beforeEach(() => {
		// Mock palette object
		mockPalette = {
			getRGBAColor: vi.fn(color => [color * 16, color * 8, color * 4, 255]),
			getForegroundColor: vi.fn(() => 7),
			getBackgroundColor: vi.fn(() => 0),
		};

		// Reset global Image mock
		global.Image = vi.fn(() => ({
			addEventListener: vi.fn(),
			removeEventListener: vi.fn(),
			src: '',
			width: 128,
			height: 256,
		}));
	});

	describe('loadFontFromXBData', () => {
		it('should reject with invalid font bytes', async() => {
			await expect(loadFontFromXBData(null, 8, 16, false, mockPalette)).rejects.toThrow('Failed to load XB font data');
		});

		it('should reject with empty font bytes', async() => {
			await expect(loadFontFromXBData(new Uint8Array(0), 8, 16, false, mockPalette)).rejects.toThrow(
				'Failed to load XB font data',
			);
		});

		it('should reject with missing palette', async() => {
			const fontBytes = new Uint8Array(4096);
			fontBytes.fill(0x01);

			await expect(loadFontFromXBData(fontBytes, 8, 16, false, null)).rejects.toThrow();
		});
	});

	describe('loadFontFromImage', () => {
		let mockImage;

		beforeEach(() => {
			mockImage = {
				addEventListener: vi.fn(),
				removeEventListener: vi.fn(),
				src: '',
				width: 128,
				height: 256,
			};

			global.Image = vi.fn(() => mockImage);
		});

		it('should setup image loading correctly', () => {
			loadFontFromImage('TestFont', false, mockPalette);

			expect(global.Image).toHaveBeenCalled();
			expect(mockImage.addEventListener).toHaveBeenCalledWith('load', expect.any(Function));
			expect(mockImage.addEventListener).toHaveBeenCalledWith('error', expect.any(Function));
		});

		it('should handle image load error', async() => {
			const loadPromise = loadFontFromImage('TestFont', false, mockPalette);

			// Simulate image load error
			const errorHandler = mockImage.addEventListener.mock.calls.find(call => call[0] === 'error')[1];
			errorHandler();

			await expect(loadPromise).rejects.toThrow();
		});

		it('should set image source path correctly', () => {
			loadFontFromImage('CP437 8x16', false, mockPalette);

			expect(mockImage.src).toBe('/ui/fonts/CP437 8x16.png');
		});

		it('should handle invalid dimensions rejection', async() => {
			mockImage.width = 100; // Invalid width (not divisible by 16)
			mockImage.height = 200; // Invalid height

			const loadPromise = loadFontFromImage('TestFont', false, mockPalette);
			const loadHandler = mockImage.addEventListener.mock.calls.find(call => call[0] === 'load')[1];

			loadHandler();

			await expect(loadPromise).rejects.toThrow();
		});
	});
});
