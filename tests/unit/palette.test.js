import { describe, it, expect, beforeEach, vi } from 'vitest';
import { 
	getUnicode, 
	getUTF8, 
	createPalette, 
	createDefaultPalette 
} from '../../public/js/palette.js';

// Mock the State module since these are unit tests
vi.mock('../../public/js/state.js', () => ({
	default: {}
}));

describe('Palette Utilities', () => {
	describe('getUnicode', () => {
		it('should return correct Unicode values for ASCII control characters', () => {
			expect(getUnicode(1)).toBe(0x263A); // ☺
			expect(getUnicode(2)).toBe(0x263B); // ☻
			expect(getUnicode(3)).toBe(0x2665); // ♥
			expect(getUnicode(4)).toBe(0x2666); // ♦
		});

		it('should return correct Unicode values for extended ASCII', () => {
			expect(getUnicode(127)).toBe(0x2302); // ⌂
			expect(getUnicode(128)).toBe(0x00C7); // Ç
			expect(getUnicode(255)).toBe(0x00A0); // non-breaking space
		});

		it('should return original char code for standard ASCII characters', () => {
			expect(getUnicode(65)).toBe(65); // A
			expect(getUnicode(48)).toBe(48); // 0
			expect(getUnicode(32)).toBe(32); // space
		});

		it('should handle edge cases', () => {
			expect(getUnicode(0)).toBe(0x00A0); // Character code 0 maps to non-breaking space
			expect(getUnicode(255)).toBe(0x00A0); // Character code 255 also maps to non-breaking space
			expect(getUnicode(256)).toBe(256); // beyond extended ASCII returns original
		});
	});

	describe('getUTF8', () => {
		it('should convert single-byte characters correctly', () => {
			expect(getUTF8(65)).toEqual([65]); // A
			expect(getUTF8(32)).toEqual([32]); // space
		});

		it('should convert multi-byte Unicode characters correctly', () => {
			// Unicode heart symbol (♥) - U+2665
			const heartUTF8 = getUTF8(3); // charCode 3 maps to ♥
			expect(heartUTF8).toHaveLength(3); // Should be 3-byte UTF-8
			expect(heartUTF8[0]).toBe(226); // First byte
			expect(heartUTF8[1]).toBe(153); // Second byte
			expect(heartUTF8[2]).toBe(165); // Third byte
		});

		it('should handle extended ASCII characters', () => {
			const result = getUTF8(128); // Ç
			expect(result).toHaveLength(2); // Should be 2-byte UTF-8
		});
	});

	describe('createPalette', () => {
		let mockPalette;

		beforeEach(() => {
			// Mock document.dispatchEvent for palette tests
			global.document = {
				dispatchEvent: vi.fn()
			};
		});

		it('should create a palette with correct RGBA values from 6-bit RGB', () => {
			const rgb6Bit = [
				[0, 0, 0],    // Black
				[63, 0, 0],   // Red
				[0, 63, 0],   // Green
				[0, 0, 63]    // Blue
			];
			
			mockPalette = createPalette(rgb6Bit);
			
			// Test black color
			const black = mockPalette.getRGBAColor(0);
			expect(black[0]).toBe(0);  // R
			expect(black[1]).toBe(0);  // G
			expect(black[2]).toBe(0);  // B
			expect(black[3]).toBe(255); // A
			
			// Test red color (63 << 2 | 63 >> 4 = 252 | 3 = 255)
			const red = mockPalette.getRGBAColor(1);
			expect(red[0]).toBe(255); // R
			expect(red[1]).toBe(0);   // G
			expect(red[2]).toBe(0);   // B
			expect(red[3]).toBe(255); // A
		});

		it('should have default foreground and background colors', () => {
			mockPalette = createPalette([[0, 0, 0], [63, 63, 63]]);
			
			expect(mockPalette.getForegroundColor()).toBe(7);
			expect(mockPalette.getBackgroundColor()).toBe(0);
		});

		it('should dispatch events when colors change', () => {
			mockPalette = createPalette([[0, 0, 0], [63, 63, 63]]);
			
			mockPalette.setForegroundColor(15);
			expect(global.document.dispatchEvent).toHaveBeenCalledWith(
				expect.objectContaining({
					type: 'onForegroundChange',
					detail: 15
				})
			);

			mockPalette.setBackgroundColor(8);
			expect(global.document.dispatchEvent).toHaveBeenCalledWith(
				expect.objectContaining({
					type: 'onBackgroundChange',
					detail: 8
				})
			);
		});

		it('should update foreground and background colors correctly', () => {
			mockPalette = createPalette([[0, 0, 0], [63, 63, 63]]);
			
			mockPalette.setForegroundColor(12);
			expect(mockPalette.getForegroundColor()).toBe(12);

			mockPalette.setBackgroundColor(3);
			expect(mockPalette.getBackgroundColor()).toBe(3);
		});
	});

	describe('createDefaultPalette', () => {
		it('should create a standard 16-color palette', () => {
			const palette = createDefaultPalette();
			
			// Test that we can get colors for all 16 standard colors
			for (let i = 0; i < 16; i++) {
				const color = palette.getRGBAColor(i);
				expect(color).toBeInstanceOf(Uint8Array);
				expect(color).toHaveLength(4);
				expect(color[3]).toBe(255); // Alpha should be 255
			}
		});

		it('should have correct standard colors', () => {
			const palette = createDefaultPalette();
			
			// Test black (color 0)
			const black = palette.getRGBAColor(0);
			expect(black[0]).toBe(0);
			expect(black[1]).toBe(0);
			expect(black[2]).toBe(0);
			
			// Test bright white (color 15)
			const white = palette.getRGBAColor(15);
			expect(white[0]).toBe(255); // 63 << 2 | 63 >> 4 = 255
			expect(white[1]).toBe(255);
			expect(white[2]).toBe(255);

			// Test red (color 4)
			const red = palette.getRGBAColor(4);
			expect(red[0]).toBe(170); // 42 << 2 | 42 >> 4 = 168 | 2 = 170
			expect(red[1]).toBe(0);
			expect(red[2]).toBe(0);
		});

		it('should have correct default foreground and background', () => {
			const palette = createDefaultPalette();
			expect(palette.getForegroundColor()).toBe(7);
			expect(palette.getBackgroundColor()).toBe(0);
		});
	});
});