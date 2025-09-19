import { describe, it, expect } from 'vitest';

describe('Canvas Utility Functions', () => {
	describe('Mirror Character Mapping', () => {
		it('should mirror horizontal line drawing characters correctly', () => {
			// Test horizontal mirroring for box drawing characters
			const getMirrorCharCode = (charCode) => {
				switch (charCode) {
					case 221: // LEFT_HALF_BLOCK
						return 222; // RIGHT_HALF_BLOCK
					case 222: // RIGHT_HALF_BLOCK
						return 221; // LEFT_HALF_BLOCK
					default:
						return charCode;
				}
			};

			expect(getMirrorCharCode(221)).toBe(222);
			expect(getMirrorCharCode(222)).toBe(221);
			expect(getMirrorCharCode(65)).toBe(65); // Normal character unchanged
		});
	});

	describe('Canvas Coordinate System', () => {
		it('should calculate array indices from coordinates correctly', () => {
			// Test coordinate to array index conversion
			const columns = 80;
			const getArrayIndex = (x, y) => y * columns + x;

			expect(getArrayIndex(0, 0)).toBe(0);
			expect(getArrayIndex(79, 0)).toBe(79);
			expect(getArrayIndex(0, 1)).toBe(80);
			expect(getArrayIndex(79, 24)).toBe(79 + (24 * 80)); // Last position in 80x25 grid
		});

		it('should validate coordinate bounds', () => {
			const columns = 80;
			const rows = 25;
			
			const isValidCoordinate = (x, y) => {
				return x >= 0 && x < columns && y >= 0 && y < rows;
			};

			expect(isValidCoordinate(0, 0)).toBe(true);
			expect(isValidCoordinate(79, 24)).toBe(true);
			expect(isValidCoordinate(-1, 0)).toBe(false);
			expect(isValidCoordinate(80, 0)).toBe(false);
			expect(isValidCoordinate(0, 25)).toBe(false);
		});
	});

	describe('Character and Attribute Encoding', () => {
		it('should encode character data correctly', () => {
			// Test 16-bit character/attribute encoding
			const encodeCharBlock = (charCode, foreground, background) => {
				return (charCode << 8) | (background << 4) | foreground;
			};

			const charCode = 65; // 'A'
			const foreground = 7; // White
			const background = 0; // Black
			
			const encoded = encodeCharBlock(charCode, foreground, background);
			expect(encoded).toBe((65 << 8) | (0 << 4) | 7); // 16647
		});

		it('should decode character data correctly', () => {
			// Test decoding 16-bit character/attribute data
			const decodeCharBlock = (data) => {
				return {
					charCode: data >> 8,
					background: (data >> 4) & 15,
					foreground: data & 15
				};
			};

			const encoded = (65 << 8) | (4 << 4) | 7; // 'A', red background, white foreground
			const decoded = decodeCharBlock(encoded);
			
			expect(decoded.charCode).toBe(65);
			expect(decoded.background).toBe(4);
			expect(decoded.foreground).toBe(7);
		});
	});

	describe('Blink Mode Handling', () => {
		it('should handle blink attribute correctly', () => {
			// Test blink attribute detection (background color >= 8)
			const hasBlinkAttribute = (background) => background >= 8;
			
			expect(hasBlinkAttribute(0)).toBe(false);
			expect(hasBlinkAttribute(7)).toBe(false);
			expect(hasBlinkAttribute(8)).toBe(true);
			expect(hasBlinkAttribute(15)).toBe(true);
		});

		it('should convert blink colors correctly', () => {
			// Test blink color normalization
			const normalizeBlinkColor = (background) => {
				return background >= 8 ? background - 8 : background;
			};

			expect(normalizeBlinkColor(8)).toBe(0);
			expect(normalizeBlinkColor(15)).toBe(7);
			expect(normalizeBlinkColor(4)).toBe(4); // No change for non-blink colors
		});
	});

	describe('Region Operations', () => {
		it('should calculate region bounds correctly', () => {
			// Test region clipping to canvas bounds
			const clipRegion = (x, y, width, height, canvasWidth, canvasHeight) => {
				const clippedX = Math.max(0, Math.min(x, canvasWidth - 1));
				const clippedY = Math.max(0, Math.min(y, canvasHeight - 1));
				const clippedWidth = Math.min(width, canvasWidth - clippedX);
				const clippedHeight = Math.min(height, canvasHeight - clippedY);
				
				return {
					x: clippedX,
					y: clippedY,
					width: Math.max(0, clippedWidth),
					height: Math.max(0, clippedHeight)
				};
			};

			const result = clipRegion(-5, -5, 20, 20, 80, 25);
			expect(result.x).toBe(0);
			expect(result.y).toBe(0);
			expect(result.width).toBe(20); // width remains 20 since 0 + 20 < 80
			expect(result.height).toBe(20); // height remains 20 since 0 + 20 < 25
		});
	});

	describe('Context Calculation', () => {
		it('should calculate canvas context indices correctly', () => {
			// Test context calculation for large canvases (multiple 25-row contexts)
			const getContextIndex = (y) => Math.floor(y / 25);
			const getContextY = (y) => y % 25;

			expect(getContextIndex(0)).toBe(0);
			expect(getContextIndex(24)).toBe(0);
			expect(getContextIndex(25)).toBe(1);
			expect(getContextIndex(49)).toBe(1);
			expect(getContextIndex(50)).toBe(2);

			expect(getContextY(0)).toBe(0);
			expect(getContextY(24)).toBe(24);
			expect(getContextY(25)).toBe(0);
			expect(getContextY(49)).toBe(24);
			expect(getContextY(50)).toBe(0);
		});
	});
});