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

		it('should successfully load valid XB font data', async() => {
			const fontBytes = new Uint8Array(4096);
			fontBytes.fill(0xaa); // Fill with alternating bits

			const result = await loadFontFromXBData(fontBytes, 8, 16, false, mockPalette);

			expect(result).toBeDefined();
			expect(result.draw).toBeDefined();
			expect(result.drawWithAlpha).toBeDefined();
			expect(result.getWidth).toBeDefined();
			expect(result.getHeight).toBeDefined();
			expect(result.setLetterSpacing).toBeDefined();
			expect(result.getLetterSpacing).toBeDefined();
		});

		it('should handle custom font dimensions', async() => {
			const fontBytes = new Uint8Array((9 * 14 * 256) / 8); // 9x14 font
			fontBytes.fill(0xff);

			const result = await loadFontFromXBData(fontBytes, 9, 14, false, mockPalette);

			expect(result.getWidth()).toBe(9);
			expect(result.getHeight()).toBe(14);
		});

		it('should handle letter spacing configuration', async() => {
			const fontBytes = new Uint8Array(4096);
			fontBytes.fill(0x55);

			const result = await loadFontFromXBData(fontBytes, 8, 16, true, mockPalette);

			expect(result.getLetterSpacing()).toBe(true);
		});

		it('should handle font data smaller than expected', async() => {
			const fontBytes = new Uint8Array(1000); // Smaller than expected 4096
			fontBytes.fill(0x33);

			const result = await loadFontFromXBData(fontBytes, 8, 16, false, mockPalette);

			expect(result).toBeDefined();
			expect(result.getWidth()).toBe(8);
			expect(result.getHeight()).toBe(16);
		});

		it('should generate font glyphs for all color combinations', async() => {
			const fontBytes = new Uint8Array(4096);
			fontBytes.fill(0x81); // Specific bit pattern

			const result = await loadFontFromXBData(fontBytes, 8, 16, false, mockPalette);

			// Test that draw function works for different color combinations
			const mockCtx = { putImageData: vi.fn() };
			result.draw(65, 7, 0, mockCtx, 0, 0);

			expect(mockCtx.putImageData).toHaveBeenCalled();
		});

		it('should generate alpha glyphs for special characters', async() => {
			const fontBytes = new Uint8Array(4096);
			fontBytes.fill(0xff);

			const result = await loadFontFromXBData(fontBytes, 8, 16, false, mockPalette);

			const mockCtx = {
				putImageData: vi.fn(),
				drawImage: vi.fn(),
				globalCompositeOperation: 'source-over',
			};

			// Test alpha rendering for special characters (220, 223, 47, 124, 88)
			result.drawWithAlpha(220, 7, mockCtx, 0, 0);
			expect(mockCtx.drawImage).toHaveBeenCalled();
		});

		it('should handle letter spacing image data generation', async() => {
			const fontBytes = new Uint8Array(4096);
			fontBytes.fill(0x0f);

			const result = await loadFontFromXBData(fontBytes, 8, 16, true, mockPalette);

			const mockCtx = { putImageData: vi.fn() };
			result.draw(65, 7, 0, mockCtx, 0, 0);

			expect(mockCtx.putImageData).toHaveBeenCalled();
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

		it('should handle different font names', () => {
			loadFontFromImage('CP437 8x8', false, mockPalette);
			expect(mockImage.src).toBe('/ui/fonts/CP437 8x8.png');

			loadFontFromImage('Custom Font', false, mockPalette);
			expect(mockImage.src).toBe('/ui/fonts/Custom Font.png');
		});

		it('should handle invalid dimensions rejection', async() => {
			mockImage.width = 100; // Invalid width (not divisible by 16)
			mockImage.height = 200; // Invalid height

			const loadPromise = loadFontFromImage('TestFont', false, mockPalette);
			const loadHandler = mockImage.addEventListener.mock.calls.find(call => call[0] === 'load')[1];

			loadHandler();

			await expect(loadPromise).rejects.toThrow();
		});

		it('should handle valid image dimensions', async() => {
			mockImage.width = 128; // Valid width (128 = 16 * 8)
			mockImage.height = 256; // Valid height (256 = 16 * 16)

			const loadPromise = loadFontFromImage('TestFont', false, mockPalette);
			const loadHandler = mockImage.addEventListener.mock.calls.find(call => call[0] === 'load')[1];

			loadHandler();

			const result = await loadPromise;

			expect(result).toBeDefined();
			expect(result.draw).toBeDefined();
			expect(result.getWidth).toBeDefined();
			expect(result.getHeight).toBeDefined();
		});

		it('should handle letter spacing parameter', async() => {
			mockImage.width = 144; // 9px width for letter spacing
			mockImage.height = 256;

			const loadPromise = loadFontFromImage('TestFont', true, mockPalette);
			const loadHandler = mockImage.addEventListener.mock.calls.find(call => call[0] === 'load')[1];

			loadHandler();

			const result = await loadPromise;
			expect(result.getLetterSpacing()).toBe(true);
		});

		it('should calculate font dimensions from image size', async() => {
			mockImage.width = 128; // 16 chars * 8px = 128
			mockImage.height = 256; // 16 rows * 16px = 256

			const loadPromise = loadFontFromImage('TestFont', false, mockPalette);
			const loadHandler = mockImage.addEventListener.mock.calls.find(call => call[0] === 'load')[1];

			loadHandler();

			const result = await loadPromise;
			expect(result.getWidth()).toBe(8);
			expect(result.getHeight()).toBe(16);
		});

		it('should handle different font aspect ratios', async() => {
			mockImage.width = 128; // 16 chars * 8px = 128
			mockImage.height = 224; // 16 rows * 14px = 224

			const loadPromise = loadFontFromImage('TestFont', false, mockPalette);
			const loadHandler = mockImage.addEventListener.mock.calls.find(call => call[0] === 'load')[1];

			loadHandler();

			const result = await loadPromise;
			expect(result.getWidth()).toBe(8);
			expect(result.getHeight()).toBe(14);
		});

		it('should reject zero dimensions', async() => {
			mockImage.width = 0;
			mockImage.height = 0;

			const loadPromise = loadFontFromImage('TestFont', false, mockPalette);
			const loadHandler = mockImage.addEventListener.mock.calls.find(call => call[0] === 'load')[1];

			loadHandler();

			await expect(loadPromise).rejects.toThrow();
		});

		it('should process image data correctly', async() => {
			mockImage.width = 128;
			mockImage.height = 256;

			const loadPromise = loadFontFromImage('TestFont', false, mockPalette);
			const loadHandler = mockImage.addEventListener.mock.calls.find(call => call[0] === 'load')[1];

			loadHandler();

			const result = await loadPromise;

			// Test that the font can draw characters
			const mockCtx = { putImageData: vi.fn() };
			result.draw(65, 7, 0, mockCtx, 0, 0);

			expect(mockCtx.putImageData).toHaveBeenCalled();
		});

		it('should handle palette dependencies', async() => {
			mockImage.width = 128;
			mockImage.height = 256;

			const loadPromise = loadFontFromImage('TestFont', false, null);
			const loadHandler = mockImage.addEventListener.mock.calls.find(call => call[0] === 'load')[1];

			loadHandler();

			await expect(loadPromise).rejects.toThrow();
		});

		it('should generate font data for all characters', async() => {
			mockImage.width = 128;
			mockImage.height = 256;

			const loadPromise = loadFontFromImage('TestFont', false, mockPalette);
			const loadHandler = mockImage.addEventListener.mock.calls.find(call => call[0] === 'load')[1];

			loadHandler();

			const result = await loadPromise;

			// Test drawing various characters
			const mockCtx = { putImageData: vi.fn() };

			result.draw(0, 7, 0, mockCtx, 0, 0); // Null character
			result.draw(32, 7, 0, mockCtx, 0, 0); // Space
			result.draw(65, 7, 0, mockCtx, 0, 0); // 'A'
			result.draw(255, 7, 0, mockCtx, 0, 0); // Extended ASCII

			expect(mockCtx.putImageData).toHaveBeenCalledTimes(4);
		});
	});

	describe('Font Object Interface', () => {
		it('should provide consistent interface for XB and image fonts', async() => {
			// Test XB font interface
			const fontBytes = new Uint8Array(4096);
			fontBytes.fill(0xaa);
			const xbFont = await loadFontFromXBData(fontBytes, 8, 16, false, mockPalette);

			// Test image font interface
			const mockImage = {
				addEventListener: vi.fn((event, handler) => {
					if (event === 'load') {
						setTimeout(() => handler(), 0);
					}
				}),
				removeEventListener: vi.fn(),
				src: '',
				width: 128,
				height: 256,
			};
			global.Image = vi.fn(() => mockImage);

			const imageFont = await loadFontFromImage('TestFont', false, mockPalette);

			// Both should have the same interface
			const expectedMethods = [
				'draw',
				'drawWithAlpha',
				'getWidth',
				'getHeight',
				'setLetterSpacing',
				'getLetterSpacing',
			];

			expectedMethods.forEach(method => {
				expect(xbFont[method]).toBeDefined();
				expect(imageFont[method]).toBeDefined();
				expect(typeof xbFont[method]).toBe('function');
				expect(typeof imageFont[method]).toBe('function');
			});
		});

		it('should handle font metrics correctly', async() => {
			const fontBytes = new Uint8Array(4096);
			const font = await loadFontFromXBData(fontBytes, 8, 16, false, mockPalette);

			expect(font.getWidth()).toBe(8);
			expect(font.getHeight()).toBe(16);
			expect(font.getLetterSpacing()).toBe(false);

			font.setLetterSpacing(true);
			expect(font.getLetterSpacing()).toBe(true);
		});

		it('should handle drawing with different contexts', async() => {
			const fontBytes = new Uint8Array(4096);
			const font = await loadFontFromXBData(fontBytes, 8, 16, false, mockPalette);

			const ctx1 = { putImageData: vi.fn() };
			const ctx2 = { putImageData: vi.fn() };

			font.draw(65, 7, 0, ctx1, 0, 0);
			font.draw(66, 7, 0, ctx2, 10, 10);

			expect(ctx1.putImageData).toHaveBeenCalled();
			expect(ctx2.putImageData).toHaveBeenCalled();
		});
	});

	describe('Error Handling', () => {
		it('should handle corrupted XB font data gracefully', async() => {
			const corruptedBytes = new Uint8Array(10); // Too small
			corruptedBytes.fill(0xff);

			await expect(loadFontFromXBData(corruptedBytes, 8, 16, false, mockPalette)).rejects.toThrow();
		});

		it('should handle missing image files gracefully', async() => {
			const mockImage = {
				addEventListener: vi.fn((event, handler) => {
					if (event === 'error') {
						setTimeout(() => handler(new Error('Image not found')), 0);
					}
				}),
				removeEventListener: vi.fn(),
				src: '',
			};
			global.Image = vi.fn(() => mockImage);

			await expect(loadFontFromImage('NonExistentFont', false, mockPalette)).rejects.toThrow();
		});

		it('should validate font parameters', async() => {
			const fontBytes = new Uint8Array(4096);

			// Invalid width/height should use defaults
			const font1 = await loadFontFromXBData(fontBytes, 0, 0, false, mockPalette);
			expect(font1.getWidth()).toBe(8); // Default width
			expect(font1.getHeight()).toBe(16); // Default height

			const font2 = await loadFontFromXBData(fontBytes, -5, -10, false, mockPalette);
			expect(font2.getWidth()).toBe(8); // Default width
			expect(font2.getHeight()).toBe(16); // Default height
		});
	});
});
