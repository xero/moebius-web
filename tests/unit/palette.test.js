import { describe, it, expect, beforeEach, vi } from 'vitest';
import { 
	getUnicode, 
	getUTF8, 
	createPalette, 
	createDefaultPalette,
	createPalettePreview,
	createPalettePicker
} from '../../public/js/palette.js';

// Mock the State module since these are unit tests
vi.mock('../../public/js/state.js', () => ({
	default: {
		palette: {
			getRGBAColor: vi.fn(() => [255, 0, 0, 255]),
			getForegroundColor: vi.fn(() => 7),
			getBackgroundColor: vi.fn(() => 0),
			setForegroundColor: vi.fn(),
			setBackgroundColor: vi.fn()
		}
	}
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

		it('should handle extended ASCII range correctly', () => {
			// Test some additional extended ASCII mappings
			expect(getUnicode(176)).toBe(0x2591); // Light shade
			expect(getUnicode(177)).toBe(0x2592); // Medium shade
			expect(getUnicode(178)).toBe(0x2593); // Dark shade
			expect(getUnicode(219)).toBe(0x2588); // Full block
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

		it('should handle box drawing characters', () => {
			const result = getUTF8(176); // Light shade
			expect(result).toHaveLength(3); // Should be 3-byte UTF-8 for Unicode
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

	describe('createPalettePreview', () => {
		let mockCanvas, mockCtx;

		beforeEach(() => {
			// Mock canvas and context
			mockCtx = {
				clearRect: vi.fn(),
				fillRect: vi.fn(),
				createImageData: vi.fn(() => ({ data: new Uint8ClampedArray(100) }))
			};
			
			mockCanvas = {
				getContext: vi.fn(() => mockCtx),
				width: 100,
				height: 50
			};

			global.document = {
				addEventListener: vi.fn()
			};
		});

		it('should create a palette preview with update function', () => {
			const preview = createPalettePreview(mockCanvas);
			
			expect(preview).toHaveProperty('updatePreview');
			expect(preview).toHaveProperty('setForegroundColor');
			expect(preview).toHaveProperty('setBackgroundColor');
			expect(typeof preview.updatePreview).toBe('function');
		});

		it('should calculate square size correctly', () => {
			createPalettePreview(mockCanvas);
			
			// Should call clearRect and fillRect
			expect(mockCtx.clearRect).toHaveBeenCalledWith(0, 0, 100, 50);
			expect(mockCtx.fillRect).toHaveBeenCalled();
		});

		it('should add event listeners for color changes', () => {
			createPalettePreview(mockCanvas);
			
			expect(global.document.addEventListener).toHaveBeenCalledWith('onForegroundChange', expect.any(Function));
			expect(global.document.addEventListener).toHaveBeenCalledWith('onBackgroundChange', expect.any(Function));
			expect(global.document.addEventListener).toHaveBeenCalledWith('onPaletteChange', expect.any(Function));
		});
	});

	describe('createPalettePicker', () => {
		let mockCanvas, mockCtx;

		beforeEach(() => {
			mockCtx = {
				createImageData: vi.fn(() => ({
					data: { set: vi.fn() },
					width: 10,
					height: 5
				})),
				putImageData: vi.fn()
			};
			
			mockCanvas = {
				getContext: vi.fn(() => mockCtx),
				width: 80,
				height: 64,
				addEventListener: vi.fn(),
				getBoundingClientRect: vi.fn(() => ({ left: 0, top: 0 }))
			};

			global.document = {
				addEventListener: vi.fn()
			};
		});

		it('should create a palette picker with update function', () => {
			const picker = createPalettePicker(mockCanvas);
			
			expect(picker).toHaveProperty('updatePalette');
			expect(typeof picker.updatePalette).toBe('function');
		});

		it('should create image data for all 16 colors', () => {
			createPalettePicker(mockCanvas);
			
			// Should create image data for all 16 colors
			expect(mockCtx.createImageData).toHaveBeenCalledTimes(16);
			expect(mockCtx.createImageData).toHaveBeenCalledWith(40, 8); // width/2, height/8
		});

		it('should add canvas event listeners', () => {
			createPalettePicker(mockCanvas);
			
			expect(mockCanvas.addEventListener).toHaveBeenCalledWith('touchend', expect.any(Function));
			expect(mockCanvas.addEventListener).toHaveBeenCalledWith('touchcancel', expect.any(Function));
			expect(mockCanvas.addEventListener).toHaveBeenCalledWith('mouseup', expect.any(Function));
			expect(mockCanvas.addEventListener).toHaveBeenCalledWith('contextmenu', expect.any(Function));
		});

		it('should add document event listeners', () => {
			createPalettePicker(mockCanvas);
			
			expect(global.document.addEventListener).toHaveBeenCalledWith('keydown', expect.any(Function));
			expect(global.document.addEventListener).toHaveBeenCalledWith('onPaletteChange', expect.any(Function));
		});

		it('should handle touch events for color selection', () => {
			const mockState = {
				palette: {
					getForegroundColor: vi.fn(() => 7),
					setForegroundColor: vi.fn()
				}
			};

			global.State = mockState;

			// Create a mock canvas with proper canvas behavior
			const mockTouchCanvas = {
				...mockCanvas,
				getBoundingClientRect: vi.fn(() => ({
					left: 0,
					top: 0,
					width: 160,
					height: 80
				})),
				addEventListener: vi.fn(),
				querySelector: vi.fn(() => mockTouchCanvas)
			};

			createPalettePicker(mockTouchCanvas);

			// Get the touch event handler from the addEventListener call
			const touchHandlerCall = mockTouchCanvas.addEventListener.mock.calls.find(call => call[0] === 'touchend');
			expect(touchHandlerCall).toBeDefined();
			
			const touchHandler = touchHandlerCall[1];

			// Simulate touch end event
			const touchEvent = {
				touches: [{
					pageX: 80, // x = 1 (right column)
					pageY: 20  // y = 2 (color index 10)
				}]
			};

			touchHandler(touchEvent);

			expect(mockState.palette.setForegroundColor).toHaveBeenCalledWith(10); // 2 + 8 = 10
		});

		it('should handle mouse events for color selection', () => {
			const mockState = {
				palette: {
					getForegroundColor: vi.fn(() => 7),
					getBackgroundColor: vi.fn(() => 0),
					setForegroundColor: vi.fn(),
					setBackgroundColor: vi.fn()
				}
			};

			global.State = mockState;

			// Create a mock canvas with proper behavior
			const mockMouseCanvas = {
				...mockCanvas,
				getBoundingClientRect: vi.fn(() => ({
					left: 0,
					top: 0,
					width: 160,
					height: 80
				})),
				addEventListener: vi.fn()
			};

			createPalettePicker(mockMouseCanvas);

			// Get the mouse event handler
			const mouseHandlerCall = mockMouseCanvas.addEventListener.mock.calls.find(call => call[0] === 'mouseup');
			expect(mouseHandlerCall).toBeDefined();
			
			const mouseHandler = mouseHandlerCall[1];

			// Test normal click (foreground color)
			const clickEvent = {
				clientX: 40, // x = 0 (left column)
				clientY: 30, // y = 3 (color index 3)
				altKey: false,
				ctrlKey: false
			};

			mouseHandler(clickEvent);
			expect(mockState.palette.setForegroundColor).toHaveBeenCalledWith(3);

			// Test Alt+click (background color)
			const altClickEvent = {
				clientX: 120, // x = 1 (right column)
				clientY: 50,  // y = 5 (color index 13)
				altKey: true,
				ctrlKey: false
			};

			mouseHandler(altClickEvent);
			expect(mockState.palette.setBackgroundColor).toHaveBeenCalledWith(13); // 5 + 8 = 13

			// Test Ctrl+click (background color)
			const ctrlClickEvent = {
				clientX: 40, // x = 0 (left column)
				clientY: 10, // y = 1 (color index 1)
				altKey: false,
				ctrlKey: true
			};

			mouseHandler(ctrlClickEvent);
			expect(mockState.palette.setBackgroundColor).toHaveBeenCalledWith(1);
		});

		it('should handle digit key combinations for color selection', () => {
			const mockState = {
				palette: {
					getForegroundColor: vi.fn(() => 7),
					getBackgroundColor: vi.fn(() => 0),
					setForegroundColor: vi.fn(),
					setBackgroundColor: vi.fn()
				}
			};

			global.State = mockState;

			createPalettePicker(mockCanvas);

			// Get the keydown handler from document.addEventListener
			const keyHandlerCall = global.document.addEventListener.mock.calls.find(call => call[0] === 'keydown');
			expect(keyHandlerCall).toBeDefined();
			
			const keyHandler = keyHandlerCall[1];

			// Test Ctrl+number keys for foreground color
			for (let i = 0; i <= 7; i++) {
				const ctrlDigitEvent = {
					keyCode: 48 + i, // ASCII codes for 0-7
					ctrlKey: true,
					preventDefault: vi.fn()
				};

				keyHandler(ctrlDigitEvent);
				expect(ctrlDigitEvent.preventDefault).toHaveBeenCalled();
			}

			expect(mockState.palette.setForegroundColor).toHaveBeenCalled();

			// Test Alt+number keys for background color
			for (let i = 0; i <= 7; i++) {
				const altDigitEvent = {
					keyCode: 48 + i, // ASCII codes for 0-7
					altKey: true,
					preventDefault: vi.fn()
				};

				keyHandler(altDigitEvent);
				expect(altDigitEvent.preventDefault).toHaveBeenCalled();
			}

			expect(mockState.palette.setBackgroundColor).toHaveBeenCalled();
		});

		it('should handle color cycling when same color is selected', () => {
			const mockState = {
				palette: {
					getForegroundColor: vi.fn(() => 3), // Current foreground is 3
					getBackgroundColor: vi.fn(() => 5), // Current background is 5
					setForegroundColor: vi.fn(),
					setBackgroundColor: vi.fn()
				}
			};

			global.State = mockState;

			createPalettePicker(mockCanvas);

			// Get the keydown handler
			const keyHandlerCall = global.document.addEventListener.mock.calls.find(call => call[0] === 'keydown');
			const keyHandler = keyHandlerCall[1];

			// Test Ctrl+3 when foreground is already 3 (should cycle to 11)
			const ctrlThreeEvent = {
				keyCode: 51, // ASCII code for 3
				ctrlKey: true,
				preventDefault: vi.fn()
			};

			keyHandler(ctrlThreeEvent);
			expect(mockState.palette.setForegroundColor).toHaveBeenCalledWith(11); // 3 + 8

			// Test Alt+5 when background is already 5 (should cycle to 13)
			const altFiveEvent = {
				keyCode: 53, // ASCII code for 5
				altKey: true,
				preventDefault: vi.fn()
			};

			keyHandler(altFiveEvent);
			expect(mockState.palette.setBackgroundColor).toHaveBeenCalledWith(13); // 5 + 8
		});

		it('should handle arrow key navigation with wrap-around', () => {
			const mockState = {
				palette: {
					getForegroundColor: vi.fn(),
					getBackgroundColor: vi.fn(),
					setForegroundColor: vi.fn(),
					setBackgroundColor: vi.fn()
				}
			};

			global.State = mockState;

			createPalettePicker(mockCanvas);

			// Get the keydown handler
			const keyHandlerCall = global.document.addEventListener.mock.calls.find(call => call[0] === 'keydown');
			const keyHandler = keyHandlerCall[1];

			// Test wrap-around from 0 to 15
			mockState.palette.getForegroundColor.mockReturnValue(0);
			mockState.palette.getBackgroundColor.mockReturnValue(0);

			const upEvent = { code: 'ArrowUp', ctrlKey: true, preventDefault: vi.fn() };
			const leftEvent = { code: 'ArrowLeft', ctrlKey: true, preventDefault: vi.fn() };

			keyHandler(upEvent);
			expect(mockState.palette.setForegroundColor).toHaveBeenCalledWith(15);

			keyHandler(leftEvent);
			expect(mockState.palette.setBackgroundColor).toHaveBeenCalledWith(15);

			// Test wrap-around from 15 to 0
			mockState.palette.getForegroundColor.mockReturnValue(15);
			mockState.palette.getBackgroundColor.mockReturnValue(15);

			const downEvent = { code: 'ArrowDown', ctrlKey: true, preventDefault: vi.fn() };
			const rightEvent = { code: 'ArrowRight', ctrlKey: true, preventDefault: vi.fn() };

			keyHandler(downEvent);
			expect(mockState.palette.setForegroundColor).toHaveBeenCalledWith(0);

			keyHandler(rightEvent);
			expect(mockState.palette.setBackgroundColor).toHaveBeenCalledWith(0);
		});

		it('should prevent context menu on canvas', () => {
			const mockMenuCanvas = {
				...mockCanvas,
				addEventListener: vi.fn()
			};

			createPalettePicker(mockMenuCanvas);

			// Get the context menu handler
			const menuHandlerCall = mockMenuCanvas.addEventListener.mock.calls.find(call => call[0] === 'contextmenu');
			expect(menuHandlerCall).toBeDefined();
			
			const menuHandler = menuHandlerCall[1];

			const contextMenuEvent = {
				preventDefault: vi.fn()
			};

			menuHandler(contextMenuEvent);
			expect(contextMenuEvent.preventDefault).toHaveBeenCalled();
		});

		it('should ignore non-matching key events', () => {
			const mockState = {
				palette: {
					getForegroundColor: vi.fn(() => 7),
					getBackgroundColor: vi.fn(() => 0),
					setForegroundColor: vi.fn(),
					setBackgroundColor: vi.fn()
				}
			};

			global.State = mockState;

			createPalettePicker(mockCanvas);

			// Get the keydown handler
			const keyHandlerCall = global.document.addEventListener.mock.calls.find(call => call[0] === 'keydown');
			const keyHandler = keyHandlerCall[1];

			// Test key events that should be ignored
			const nonMatchingEvents = [
				{ keyCode: 65, ctrlKey: true }, // Ctrl+A
				{ keyCode: 56, ctrlKey: true }, // Ctrl+8 (out of range)
				{ code: 'Space', ctrlKey: true }, // Ctrl+Space
				{ code: 'ArrowUp', ctrlKey: false }, // Arrow without Ctrl
			];

			const initialForegroundCalls = mockState.palette.setForegroundColor.mock.calls.length;
			const initialBackgroundCalls = mockState.palette.setBackgroundColor.mock.calls.length;

			nonMatchingEvents.forEach(event => {
				keyHandler(event);
			});

			// Should not have made any additional calls
			expect(mockState.palette.setForegroundColor).toHaveBeenCalledTimes(initialForegroundCalls);
			expect(mockState.palette.setBackgroundColor).toHaveBeenCalledTimes(initialBackgroundCalls);
		});
	});
});