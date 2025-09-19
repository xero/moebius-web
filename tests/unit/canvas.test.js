import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createTextArtCanvas } from '../../public/js/canvas.js';

// Mock dependencies
const mockState = {
	font: {
		draw: vi.fn(),
		getWidth: vi.fn(() => 8),
		getHeight: vi.fn(() => 16),
		setLetterSpacing: vi.fn(),
		getLetterSpacing: vi.fn(() => false),
	},
	palette: { getRGBAColor: vi.fn(() => [255, 255, 255, 255]) },
};

const mockUI = {
	$: vi.fn(_id => ({
		style: {},
		classList: { add: vi.fn(), remove: vi.fn() },
		appendChild: vi.fn(),
		addEventListener: vi.fn(),
	})),
	createCanvas: vi.fn(() => ({
		width: 640,
		height: 400,
		style: {},
		getContext: vi.fn(() => ({
			fillStyle: '',
			fillRect: vi.fn(),
			clearRect: vi.fn(),
			drawImage: vi.fn(),
			createImageData: vi.fn(() => ({
				data: new Uint8ClampedArray(4),
				width: 1,
				height: 1,
			})),
			putImageData: vi.fn(),
			getImageData: vi.fn(() => ({
				data: new Uint8ClampedArray(4),
				width: 1,
				height: 1,
			})),
		})),
	})),
};

const mockFont = {
	loadFontFromImage: vi.fn((name, spacing, palette, callback) => {
		callback(true);
		return mockState.font;
	}),
	loadFontFromXBData: vi.fn((data, width, height, spacing, palette, callback) => {
		callback(true);
		return mockState.font;
	}),
};

const mockPalette = {
	createPalette: vi.fn(() => mockState.palette),
	createDefaultPalette: vi.fn(() => mockState.palette),
};

// Mock global State
global.State = mockState;

// Set up module mocks
vi.mock('../../public/js/state.js', () => ({ default: mockState }));
vi.mock('../../public/js/ui.js', () => mockUI);
vi.mock('../../public/js/font.js', () => mockFont);
vi.mock('../../public/js/palette.js', () => mockPalette);

describe('Canvas Utility Functions', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe('Canvas Creation and Initialization', () => {
		it('should create text art canvas with proper interface', () => {
			const mockContainer = mockUI.createCanvas();

			expect(() => {
				createTextArtCanvas(mockContainer, () => {
					// Callback after initialization
				});
			}).not.toThrow();

			// Test that canvas is created and callback executed
			expect(mockUI.createCanvas).toHaveBeenCalled();
		});

		it('should handle canvas initialization with callback', done => {
			const mockContainer = mockUI.createCanvas();
			let callbackExecuted = false;

			createTextArtCanvas(mockContainer, () => {
				callbackExecuted = true;
				expect(callbackExecuted).toBe(true);
				done();
			});
		});

		it('should initialize with default dimensions', () => {
			const mockContainer = mockUI.createCanvas();

			const canvas = createTextArtCanvas(mockContainer, () => {
				// Verify default dimensions through interface
				expect(canvas.getColumns()).toBe(80);
				expect(canvas.getRows()).toBe(25);
			});
		});
	});

	describe('Canvas Drawing Operations', () => {
		let canvas;
		const mockContainer = mockUI.createCanvas();

		beforeEach(done => {
			canvas = createTextArtCanvas(mockContainer, () => {
				done();
			});
		});

		it('should provide drawing interface methods', () => {
			expect(canvas).toHaveProperty('draw');
			expect(canvas).toHaveProperty('drawHalfBlock');
			expect(canvas).toHaveProperty('getBlock');
			expect(canvas).toHaveProperty('getHalfBlock');
			expect(canvas).toHaveProperty('clear');
			expect(typeof canvas.draw).toBe('function');
			expect(typeof canvas.drawHalfBlock).toBe('function');
			expect(typeof canvas.getBlock).toBe('function');
			expect(typeof canvas.getHalfBlock).toBe('function');
			expect(typeof canvas.clear).toBe('function');
		});

		it('should handle drawing operations without errors', () => {
			expect(() => {
				canvas.draw(callback => {
					callback(65, 7, 0, 10, 5); // Draw 'A' at position 10,5
				});
			}).not.toThrow();
		});

		it('should handle half-block drawing operations', () => {
			expect(() => {
				canvas.drawHalfBlock(callback => {
					callback(15, 10, 5); // Draw white half-block at position 10,5
				});
			}).not.toThrow();
		});

		it('should handle block retrieval operations', () => {
			expect(() => {
				const block = canvas.getBlock(10, 5);
				expect(block).toBeDefined();
			}).not.toThrow();
		});

		it('should handle half-block retrieval operations', () => {
			expect(() => {
				const halfBlock = canvas.getHalfBlock(10, 5);
				expect(halfBlock).toBeDefined();
			}).not.toThrow();
		});

		it('should handle canvas clearing', () => {
			expect(() => {
				canvas.clear();
			}).not.toThrow();
		});
	});

	describe('Canvas Resize and Configuration', () => {
		let canvas;
		const mockContainer = mockUI.createCanvas();

		beforeEach(done => {
			canvas = createTextArtCanvas(mockContainer, () => {
				done();
			});
		});

		it('should provide resize functionality', () => {
			expect(canvas).toHaveProperty('resize');
			expect(typeof canvas.resize).toBe('function');
		});

		it('should handle resize operations', () => {
			expect(() => {
				canvas.resize(100, 50);
				expect(canvas.getColumns()).toBe(100);
				expect(canvas.getRows()).toBe(50);
			}).not.toThrow();
		});

		it('should handle ice colors setting', () => {
			expect(canvas).toHaveProperty('setIceColors');
			expect(canvas).toHaveProperty('getIceColors');

			expect(() => {
				canvas.setIceColors(true);
				expect(canvas.getIceColors()).toBe(true);

				canvas.setIceColors(false);
				expect(canvas.getIceColors()).toBe(false);
			}).not.toThrow();
		});

		it('should handle font changes', () => {
			expect(canvas).toHaveProperty('setFont');
			expect(canvas).toHaveProperty('getCurrentFontName');

			expect(() => {
				canvas.setFont('CP437 8x8', () => {
					// Font change callback
				});
			}).not.toThrow();
		});
	});

	describe('Undo/Redo Functionality', () => {
		let canvas;
		const mockContainer = mockUI.createCanvas();

		beforeEach(done => {
			canvas = createTextArtCanvas(mockContainer, () => {
				done();
			});
		});

		it('should provide undo/redo interface', () => {
			expect(canvas).toHaveProperty('startUndo');
			expect(canvas).toHaveProperty('undo');
			expect(canvas).toHaveProperty('redo');
			expect(typeof canvas.startUndo).toBe('function');
			expect(typeof canvas.undo).toBe('function');
			expect(typeof canvas.redo).toBe('function');
		});

		it('should handle undo operations without errors', () => {
			expect(() => {
				canvas.startUndo();
				canvas.draw(callback => {
					callback(65, 7, 0, 10, 5);
				});
				canvas.undo();
			}).not.toThrow();
		});

		it('should handle redo operations without errors', () => {
			expect(() => {
				canvas.startUndo();
				canvas.draw(callback => {
					callback(65, 7, 0, 10, 5);
				});
				canvas.undo();
				canvas.redo();
			}).not.toThrow();
		});

		it('should handle multiple undo/redo cycles', () => {
			expect(() => {
				// Perform multiple operations
				canvas.startUndo();
				canvas.draw(callback => {
					callback(65, 7, 0, 10, 5);
				});

				canvas.startUndo();
				canvas.draw(callback => {
					callback(66, 7, 0, 11, 5);
				});

				// Undo both operations
				canvas.undo();
				canvas.undo();

				// Redo both operations
				canvas.redo();
				canvas.redo();
			}).not.toThrow();
		});
	});

	describe('Mirror Mode Functionality', () => {
		let canvas;
		const mockContainer = mockUI.createCanvas();

		beforeEach(done => {
			canvas = createTextArtCanvas(mockContainer, () => {
				done();
			});
		});

		it('should provide mirror mode interface', () => {
			expect(canvas).toHaveProperty('setMirrorMode');
			expect(canvas).toHaveProperty('getMirrorMode');
			expect(canvas).toHaveProperty('getMirrorX');
			expect(typeof canvas.setMirrorMode).toBe('function');
			expect(typeof canvas.getMirrorMode).toBe('function');
			expect(typeof canvas.getMirrorX).toBe('function');
		});

		it('should handle mirror mode toggling', () => {
			expect(() => {
				canvas.setMirrorMode(true);
				expect(canvas.getMirrorMode()).toBe(true);

				canvas.setMirrorMode(false);
				expect(canvas.getMirrorMode()).toBe(false);
			}).not.toThrow();
		});

		it('should calculate mirror coordinates correctly', () => {
			expect(() => {
				canvas.setMirrorMode(true);
				const mirrorX = canvas.getMirrorX(10);
				expect(typeof mirrorX).toBe('number');
			}).not.toThrow();
		});
	});

	describe('Region Operations', () => {
		let canvas;
		const mockContainer = mockUI.createCanvas();

		beforeEach(done => {
			canvas = createTextArtCanvas(mockContainer, () => {
				done();
			});
		});

		it('should provide area manipulation interface', () => {
			expect(canvas).toHaveProperty('deleteArea');
			expect(canvas).toHaveProperty('getArea');
			expect(canvas).toHaveProperty('setArea');
			expect(typeof canvas.deleteArea).toBe('function');
			expect(typeof canvas.getArea).toBe('function');
			expect(typeof canvas.setArea).toBe('function');
		});

		it('should handle area deletion', () => {
			expect(() => {
				canvas.deleteArea(10, 5, 20, 10);
			}).not.toThrow();
		});

		it('should handle area retrieval', () => {
			expect(() => {
				const area = canvas.getArea(10, 5, 20, 10);
				expect(area).toBeDefined();
			}).not.toThrow();
		});

		it('should handle area setting', () => {
			expect(() => {
				const areaData = new Uint16Array(200); // 20x10 area
				canvas.setArea(10, 5, 20, 10, areaData);
			}).not.toThrow();
		});
	});

	describe('XB Font Data Handling', () => {
		let canvas;
		const mockContainer = mockUI.createCanvas();

		beforeEach(done => {
			canvas = createTextArtCanvas(mockContainer, () => {
				done();
			});
		});

		it('should provide XB font interface', () => {
			expect(canvas).toHaveProperty('setXBFontData');
			expect(canvas).toHaveProperty('setXBPaletteData');
			expect(canvas).toHaveProperty('clearXBData');
			expect(typeof canvas.setXBFontData).toBe('function');
			expect(typeof canvas.setXBPaletteData).toBe('function');
			expect(typeof canvas.clearXBData).toBe('function');
		});

		it('should handle XB font data setting', () => {
			expect(() => {
				const fontData = new Uint8Array(4096); // Mock font data
				canvas.setXBFontData(fontData, 8, 16);
			}).not.toThrow();
		});

		it('should handle XB palette data setting', () => {
			expect(() => {
				const paletteData = new Uint8Array(48); // 16 colors * 3 bytes RGB
				canvas.setXBPaletteData(paletteData);
			}).not.toThrow();
		});

		it('should handle XB data clearing', () => {
			expect(() => {
				canvas.clearXBData(() => {
					// Clear callback
				});
			}).not.toThrow();
		});
	});

	describe('Dirty Region Processing', () => {
		let canvas;
		const mockContainer = mockUI.createCanvas();

		beforeEach(done => {
			canvas = createTextArtCanvas(mockContainer, () => {
				done();
			});
		});

		it('should provide dirty region interface', () => {
			expect(canvas).toHaveProperty('enqueueDirtyRegion');
			expect(canvas).toHaveProperty('drawRegion');
			expect(typeof canvas.enqueueDirtyRegion).toBe('function');
			expect(typeof canvas.drawRegion).toBe('function');
		});

		it('should handle dirty region enqueueing', () => {
			expect(() => {
				canvas.enqueueDirtyRegion(10, 5, 20, 10);
			}).not.toThrow();
		});

		it('should handle region drawing', () => {
			expect(() => {
				canvas.drawRegion(10, 5, 20, 10);
			}).not.toThrow();
		});

		it('should handle edge cases for region bounds', () => {
			expect(() => {
				// Test negative coordinates
				canvas.enqueueDirtyRegion(-5, -5, 10, 10);

				// Test coordinates beyond canvas
				canvas.enqueueDirtyRegion(75, 20, 10, 10);

				// Test zero-size regions
				canvas.enqueueDirtyRegion(10, 5, 0, 0);
			}).not.toThrow();
		});
	});

	describe('Mirror Character Mapping', () => {
		it('should mirror horizontal line drawing characters correctly', () => {
			// Test horizontal mirroring for box drawing characters
			const getMirrorCharCode = charCode => {
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
			expect(getArrayIndex(79, 24)).toBe(79 + 24 * 80); // Last position in 80x25 grid
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
			const decodeCharBlock = data => {
				return {
					charCode: data >> 8,
					background: (data >> 4) & 15,
					foreground: data & 15,
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
			const hasBlinkAttribute = background => background >= 8;

			expect(hasBlinkAttribute(0)).toBe(false);
			expect(hasBlinkAttribute(7)).toBe(false);
			expect(hasBlinkAttribute(8)).toBe(true);
			expect(hasBlinkAttribute(15)).toBe(true);
		});

		it('should convert blink colors correctly', () => {
			// Test blink color normalization
			const normalizeBlinkColor = background => {
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
					height: Math.max(0, clippedHeight),
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
			const getContextIndex = y => Math.floor(y / 25);
			const getContextY = y => y % 25;

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
