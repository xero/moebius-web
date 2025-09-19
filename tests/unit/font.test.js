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
				height: 8
			})),
			putImageData: vi.fn(),
			clearRect: vi.fn(),
			fillRect: vi.fn(),
			createImageData: vi.fn((width, height) => ({
				data: new Uint8ClampedArray(width * height * 4),
				width: width,
				height: height
			}))
		})),
		width: 128,
		height: 256
	}))
}));

describe('Font Module', () => {
	let mockPalette;

	beforeEach(() => {
		// Mock palette object
		mockPalette = {
			getRGBAColor: vi.fn((color) => [
				color * 16, color * 8, color * 4, 255
			]),
			getForegroundColor: vi.fn(() => 7),
			getBackgroundColor: vi.fn(() => 0)
		};

		// Reset global Image mock
		global.Image = vi.fn(() => ({
			addEventListener: vi.fn(),
			removeEventListener: vi.fn(),
			src: '',
			width: 128,
			height: 256
		}));
	});

	describe('loadFontFromXBData', () => {
		it('should reject with invalid font bytes', async () => {
			await expect(loadFontFromXBData(null, 8, 16, false, mockPalette))
				.rejects.toThrow();
		});

		it('should reject with empty font bytes', async () => {
			await expect(loadFontFromXBData(new Uint8Array(0), 8, 16, false, mockPalette))
				.rejects.toThrow();
		});

		it('should handle default font dimensions', async () => {
			const fontBytes = new Uint8Array(4096); // 16 * 256 bytes
			fontBytes.fill(0xFF); // Fill with data

			const result = await loadFontFromXBData(fontBytes, 0, 0, false, mockPalette);
			
			expect(result).toBeDefined();
			expect(result.width).toBe(8); // Default width
			expect(result.height).toBe(16); // Default height
		});

		it('should handle valid XB font data', async () => {
			const fontBytes = new Uint8Array(4096); // 16 * 256 bytes
			// Create some basic font pattern
			for (let i = 0; i < fontBytes.length; i++) {
				fontBytes[i] = i % 256;
			}

			const result = await loadFontFromXBData(fontBytes, 8, 16, false, mockPalette);
			
			expect(result).toBeDefined();
			expect(result.width).toBe(8);
			expect(result.height).toBe(16);
			expect(result.letterSpacing).toBe(false);
			expect(typeof result.draw).toBe('function');
			expect(typeof result.redraw).toBe('function');
		});

		it('should handle letter spacing enabled', async () => {
			const fontBytes = new Uint8Array(4096);
			fontBytes.fill(0x55); // Alternating pattern

			const result = await loadFontFromXBData(fontBytes, 8, 16, true, mockPalette);
			
			expect(result).toBeDefined();
			expect(result.letterSpacing).toBe(true);
		});

		it('should handle custom font dimensions', async () => {
			const fontWidth = 12;
			const fontHeight = 20;
			const expectedDataSize = fontHeight * 256;
			const fontBytes = new Uint8Array(expectedDataSize);
			fontBytes.fill(0xAA);

			const result = await loadFontFromXBData(fontBytes, fontWidth, fontHeight, false, mockPalette);
			
			expect(result).toBeDefined();
			expect(result.width).toBe(fontWidth);
			expect(result.height).toBe(fontHeight);
		});

		it('should warn about insufficient font data', async () => {
			const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
			
			const fontBytes = new Uint8Array(100); // Too small
			const result = await loadFontFromXBData(fontBytes, 8, 16, false, mockPalette);
			
			expect(consoleSpy).toHaveBeenCalledWith(
				expect.stringContaining('XB font data too small'),
				expect.any(Number),
				expect.stringContaining('Got:'),
				100
			);
			
			consoleSpy.mockRestore();
		});

		it('should provide functional draw method', async () => {
			const fontBytes = new Uint8Array(4096);
			fontBytes.fill(0xFF);

			const result = await loadFontFromXBData(fontBytes, 8, 16, false, mockPalette);
			
			// Test draw method exists and can be called
			expect(typeof result.draw).toBe('function');
			
			// Should not throw when calling draw
			expect(() => {
				result.draw(65, 0, 10, 10, 7, 0, 32); // Draw 'A' character
			}).not.toThrow();
		});

		it('should handle character fallback in draw method', async () => {
			const fontBytes = new Uint8Array(4096);
			// Leave most bytes as 0, simulating missing characters
			
			const result = await loadFontFromXBData(fontBytes, 8, 16, false, mockPalette);
			
			// Should handle invalid character codes gracefully
			expect(() => {
				result.draw(500, 0, 10, 10, 7, 0, 32); // Invalid char code
			}).not.toThrow();
		});

		it('should handle letter spacing in draw method', async () => {
			const fontBytes = new Uint8Array(4096);
			fontBytes.fill(0xFF);

			const result = await loadFontFromXBData(fontBytes, 8, 16, true, mockPalette);
			
			// Test letter spacing draw
			expect(() => {
				result.draw(65, 0, 10, 10, 7, 0, 32);
			}).not.toThrow();
			
			// Test special characters with letter spacing (192-223 range)
			expect(() => {
				result.draw(200, 0, 10, 10, 7, 0, 32);
			}).not.toThrow();
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
				height: 256
			};
			
			global.Image = vi.fn(() => mockImage);
			
			// Mock better image data for parsing
			const mockCanvas = {
				getContext: vi.fn(() => ({
					drawImage: vi.fn(),
					getImageData: vi.fn(() => {
						// Create valid font image data (128x256 with proper patterns)
						const data = new Uint8ClampedArray(128 * 256 * 4);
						// Fill with some pattern that will create valid font data
						for (let i = 0; i < data.length; i += 4) {
							data[i] = Math.random() > 0.5 ? 255 : 0;     // R
							data[i + 1] = Math.random() > 0.5 ? 255 : 0; // G
							data[i + 2] = Math.random() > 0.5 ? 255 : 0; // B
							data[i + 3] = 255; // A
						}
						return {
							data: data,
							width: 128,
							height: 256
						};
					}),
					putImageData: vi.fn(),
					clearRect: vi.fn(),
					fillRect: vi.fn(),
					createImageData: vi.fn((width, height) => ({
						data: new Uint8ClampedArray(width * height * 4),
						width: width,
						height: height
					}))
				})),
				width: 128,
				height: 256
			};
			
			// Update the UI module mock for this test
			vi.mocked(vi.importActual('../../public/js/ui.js')).createCanvas = vi.fn(() => mockCanvas);
		});

		it('should load font from image successfully', async () => {
			// Mock successful image load
			const loadPromise = loadFontFromImage('CP437 8x16', false, mockPalette);
			
			// Simulate image load event
			const loadHandler = mockImage.addEventListener.mock.calls.find(call => call[0] === 'load')[1];
			loadHandler();
			
			const result = await loadPromise;
			
			expect(result).toBeDefined();
			expect(typeof result.draw).toBe('function');
			expect(typeof result.redraw).toBe('function');
		});

		it('should reject on image load error', async () => {
			const loadPromise = loadFontFromImage('invalid-font', false, mockPalette);
			
			// Simulate image error event
			const errorHandler = mockImage.addEventListener.mock.calls.find(call => call[0] === 'error')[1];
			errorHandler();
			
			await expect(loadPromise).rejects.toThrow('Failed to load image');
		});

		it('should set correct image source', async () => {
			loadFontFromImage('CP437 8x16', false, mockPalette);
			
			expect(mockImage.src).toBe('ui/fonts/CP437 8x16.png');
		});

		it('should handle letter spacing parameter', async () => {
			const loadPromise = loadFontFromImage('CP437 8x16', true, mockPalette);
			
			// Simulate successful load
			const loadHandler = mockImage.addEventListener.mock.calls.find(call => call[0] === 'load')[1];
			loadHandler();
			
			const result = await loadPromise;
			
			expect(result).toBeDefined();
			expect(result.letterSpacing).toBe(true);
		});

		it('should validate font dimensions from image', async () => {
			// Mock image with invalid dimensions
			mockImage.width = 100; // Not divisible by 16
			mockImage.height = 200;
			
			const loadPromise = loadFontFromImage('invalid-size', false, mockPalette);
			
			// Simulate image load
			const loadHandler = mockImage.addEventListener.mock.calls.find(call => call[0] === 'load')[1];
			loadHandler();
			
			await expect(loadPromise).rejects.toThrow();
		});

		it('should handle valid font dimensions', async () => {
			// Standard 8x16 font (128x256 image)
			mockImage.width = 128;
			mockImage.height = 256;
			
			const loadPromise = loadFontFromImage('CP437 8x16', false, mockPalette);
			
			const loadHandler = mockImage.addEventListener.mock.calls.find(call => call[0] === 'load')[1];
			loadHandler();
			
			const result = await loadPromise;
			
			expect(result).toBeDefined();
			expect(result.width).toBe(8); // 128/16
			expect(result.height).toBe(16); // 256/16
		});

		it('should handle different font sizes', async () => {
			// Larger font size (16x32)
			mockImage.width = 256; // 16 * 16
			mockImage.height = 512; // 32 * 16
			
			const loadPromise = loadFontFromImage('Large Font', false, mockPalette);
			
			const loadHandler = mockImage.addEventListener.mock.calls.find(call => call[0] === 'load')[1];
			loadHandler();
			
			const result = await loadPromise;
			
			expect(result).toBeDefined();
			expect(result.width).toBe(16);
			expect(result.height).toBe(32);
		});

		it('should reject fonts with invalid width', async () => {
			// Width outside valid range (1-16)
			mockImage.width = 272; // 17 * 16 (invalid)
			mockImage.height = 256;
			
			const loadPromise = loadFontFromImage('invalid-width', false, mockPalette);
			
			const loadHandler = mockImage.addEventListener.mock.calls.find(call => call[0] === 'load')[1];
			loadHandler();
			
			await expect(loadPromise).rejects.toThrow();
		});

		it('should reject fonts with invalid height', async () => {
			// Height outside valid range (1-32)
			mockImage.width = 128;
			mockImage.height = 560; // 35 * 16 (invalid)
			
			const loadPromise = loadFontFromImage('invalid-height', false, mockPalette);
			
			const loadHandler = mockImage.addEventListener.mock.calls.find(call => call[0] === 'load')[1];
			loadHandler();
			
			await expect(loadPromise).rejects.toThrow();
		});

		it('should provide functional redraw method', async () => {
			const loadPromise = loadFontFromImage('CP437 8x16', false, mockPalette);
			
			const loadHandler = mockImage.addEventListener.mock.calls.find(call => call[0] === 'load')[1];
			loadHandler();
			
			const result = await loadPromise;
			
			expect(typeof result.redraw).toBe('function');
			expect(() => {
				result.redraw();
			}).not.toThrow();
		});
	});

	describe('Font Data Processing', () => {
		it('should handle bit manipulation correctly', async () => {
			// Create font bytes with specific bit patterns
			const fontBytes = new Uint8Array(4096);
			
			// Set specific patterns for testing
			fontBytes[0] = 0b11110000; // Top half
			fontBytes[1] = 0b00001111; // Bottom half
			fontBytes[2] = 0b10101010; // Alternating
			fontBytes[3] = 0b01010101; // Reverse alternating
			
			const result = await loadFontFromXBData(fontBytes, 8, 16, false, mockPalette);
			
			expect(result).toBeDefined();
			expect(result.width).toBe(8);
			expect(result.height).toBe(16);
		});

		it('should handle palette color mapping', async () => {
			const fontBytes = new Uint8Array(4096);
			fontBytes.fill(0xFF);

			// Test with different palette colors
			mockPalette.getRGBAColor.mockImplementation((color) => [
				color * 30, color * 20, color * 10, 255
			]);

			const result = await loadFontFromXBData(fontBytes, 8, 16, false, mockPalette);
			
			expect(result).toBeDefined();
			expect(mockPalette.getRGBAColor).toHaveBeenCalled();
		});

		it('should handle edge cases in font parsing', async () => {
			const fontBytes = new Uint8Array(100); // Smaller than expected
			
			// Should still work but with warnings
			const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
			
			const result = await loadFontFromXBData(fontBytes, 8, 16, false, mockPalette);
			
			expect(result).toBeDefined();
			expect(consoleSpy).toHaveBeenCalled();
			
			consoleSpy.mockRestore();
		});
	});

	describe('Font Rendering', () => {
		it('should handle different character codes', async () => {
			const fontBytes = new Uint8Array(4096);
			fontBytes.fill(0xFF);

			const result = await loadFontFromXBData(fontBytes, 8, 16, false, mockPalette);
			
			// Test various character ranges
			const testChars = [0, 32, 65, 127, 128, 255];
			
			testChars.forEach(charCode => {
				expect(() => {
					result.draw(charCode, 0, 0, 0, 7, 0, 32);
				}).not.toThrow();
			});
		});

		it('should handle coordinate bounds', async () => {
			const fontBytes = new Uint8Array(4096);
			fontBytes.fill(0xFF);

			const result = await loadFontFromXBData(fontBytes, 8, 16, false, mockPalette);
			
			// Test boundary coordinates
			expect(() => {
				result.draw(65, 0, 0, 0, 7, 0, 32); // Top-left
				result.draw(65, 0, 79, 24, 7, 0, 32); // Bottom-right
			}).not.toThrow();
		});

		it('should handle color variations', async () => {
			const fontBytes = new Uint8Array(4096);
			fontBytes.fill(0xFF);

			const result = await loadFontFromXBData(fontBytes, 8, 16, false, mockPalette);
			
			// Test different color combinations
			for (let fg = 0; fg < 16; fg++) {
				for (let bg = 0; bg < 16; bg++) {
					expect(() => {
						result.draw(65, 0, 0, 0, fg, bg, 32);
					}).not.toThrow();
				}
			}
		});
	});

	describe('Error Handling', () => {
		it('should handle null parameters gracefully', async () => {
			await expect(loadFontFromXBData(null, 8, 16, false, mockPalette))
				.rejects.toThrow();
		});

		it('should handle missing palette parameter', async () => {
			const fontBytes = new Uint8Array(4096);
			
			await expect(loadFontFromXBData(fontBytes, 8, 16, false, null))
				.rejects.toThrow();
		});

		it('should handle invalid font names for image loading', async () => {
			const loadPromise = loadFontFromImage('', false, mockPalette);
			
			const errorHandler = mockImage.addEventListener.mock.calls.find(call => call[0] === 'error')[1];
			errorHandler();
			
			await expect(loadPromise).rejects.toThrow();
		});

		it('should handle image loading network errors', async () => {
			const loadPromise = loadFontFromImage('network-error-font', false, mockPalette);
			
			// Simulate network error
			const errorHandler = mockImage.addEventListener.mock.calls.find(call => call[0] === 'error')[1];
			const mockError = new Error('Network error');
			errorHandler(mockError);
			
			await expect(loadPromise).rejects.toThrow();
		});
	});
});