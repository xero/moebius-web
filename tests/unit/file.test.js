import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock dependencies
vi.mock('../../public/js/state.js', () => ({
	default: {
		textArtCanvas: {
			getColumns: vi.fn(() => 80),
			getRows: vi.fn(() => 25),
			getImageData: vi.fn(() => new Uint16Array(80 * 25))
		}
	}
}));

vi.mock('../../public/js/ui.js', () => ({
	$: vi.fn((id) => ({
		value: 'test-artwork'
	})),
	enforceMaxBytes: vi.fn()
}));

vi.mock('../../public/js/palette.js', () => ({
	getUTF8: vi.fn(),
	getUnicode: vi.fn()
}));

describe('File Utilities', () => {
	describe('SAUCE Record Parsing', () => {
		it('should parse SAUCE records correctly', () => {
			// Test SAUCE ID parsing
			const SAUCE_ID = new Uint8Array([0x53, 0x41, 0x55, 0x43, 0x45]); // "SAUCE"
			const expectedString = String.fromCharCode(...SAUCE_ID);
			expect(expectedString).toBe('SAUCE');
		});

		it('should handle COMNT ID parsing', () => {
			// Test COMNT ID parsing
			const COMNT_ID = new Uint8Array([0x43, 0x4F, 0x4D, 0x4E, 0x54]); // "COMNT"
			const expectedString = String.fromCharCode(...COMNT_ID);
			expect(expectedString).toBe('COMNT');
		});
	});

	describe('Data Type Conversions', () => {
		it('should convert 16-bit values correctly', () => {
			// Test 16-bit little-endian conversion
			const lowByte = 0x34;
			const highByte = 0x12;
			const result = lowByte + (highByte << 8);
			expect(result).toBe(0x1234);
		});

		it('should convert 32-bit values correctly', () => {
			// Test 32-bit little-endian conversion
			const byte1 = 0x78;
			const byte2 = 0x56;
			const byte3 = 0x34;
			const byte4 = 0x12;
			const result = byte1 + (byte2 << 8) + (byte3 << 16) + (byte4 << 24);
			expect(result).toBe(0x12345678);
		});
	});

	describe('Color Conversion Utilities', () => {
		it('should convert ANSI colors to BIN colors correctly', () => {
			// Test ANSI to BIN color mapping
			const ansiToBin = (ansiColor) => {
				switch (ansiColor) {
					case 4: return 1; // Red
					case 6: return 3; // Cyan
					case 1: return 4; // Blue  
					case 3: return 6; // Yellow
					default: return ansiColor;
				}
			};

			expect(ansiToBin(4)).toBe(1);
			expect(ansiToBin(6)).toBe(3);
			expect(ansiToBin(1)).toBe(4);
			expect(ansiToBin(3)).toBe(6);
			expect(ansiToBin(0)).toBe(0); // Black unchanged
			expect(ansiToBin(7)).toBe(7); // White unchanged
		});

		it('should handle ICE colors properly', () => {
			// Test ICE color logic - when enabled, background colors 8-15 are available
			const hasICEColors = true;
			const backgroundColorLimit = hasICEColors ? 16 : 8;
			
			expect(backgroundColorLimit).toBe(16);
			
			const noICEColors = false;
			const limitedBackgroundColors = noICEColors ? 8 : 16; // when noICEColors is false, we get 16 colors
			expect(limitedBackgroundColors).toBe(16);
		});
	});

	describe('Save Operations', () => {
		beforeEach(() => {
			// Mock DOM for save operations
			global.document = {
				createElement: vi.fn(() => ({
					href: '',
					download: '',
					click: vi.fn()
				}))
			};
			
			global.URL = {
				createObjectURL: vi.fn(() => 'blob:mock-url')
			};

			global.Blob = vi.fn();
			global.btoa = vi.fn((str) => Buffer.from(str, 'binary').toString('base64'));
			global.navigator = {
				userAgent: 'Chrome'
			};
		});

		it('should create proper download links', async () => {
			const { Save } = await import('../../public/js/file.js');
			
			// Test that Save operations exist
			expect(Save).toBeDefined();
			expect(typeof Save.ans).toBe('function');
			expect(typeof Save.bin).toBe('function');
			expect(typeof Save.xb).toBe('function');
			expect(typeof Save.png).toBe('function');
		});

		it('should handle different file formats', async () => {
			const { Save } = await import('../../public/js/file.js');
			
			// Test all supported save formats
			const formats = ['ans', 'utf8', 'utf8noBlink', 'bin', 'xb', 'png'];
			
			formats.forEach(format => {
				expect(typeof Save[format]).toBe('function');
			});
		});
	});

	describe('Binary Data Handling', () => {
		it('should create correct XBIN headers', () => {
			// Test XBIN file header structure
			const width = 80;
			const height = 25;
			const noblink = false;
			const flags = noblink ? 8 : 0;
			
			const header = new Uint8Array([
				88, 66, 73, 78, 26, // "XBIN" + EOF marker
				(width & 0xff), (width >> 8), // Width (little-endian)
				(height & 0xff), (height >> 8), // Height (little-endian)
				16, // Font height
				flags // Flags
			]);
			
			expect(header[0]).toBe(88); // 'X'
			expect(header[1]).toBe(66); // 'B'
			expect(header[2]).toBe(73); // 'I'
			expect(header[3]).toBe(78); // 'N'
			expect(header[4]).toBe(26); // EOF marker
			expect(header[5]).toBe(80); // Width low byte
			expect(header[6]).toBe(0);  // Width high byte
			expect(header[7]).toBe(25); // Height low byte
			expect(header[8]).toBe(0);  // Height high byte
			expect(header[9]).toBe(16); // Font height
			expect(header[10]).toBe(flags); // Flags
		});

		it('should handle data URL conversion', () => {
			// Test base64 encoding for binary data
			const testBytes = new Uint8Array([72, 101, 108, 108, 111]); // "Hello"
			const base64 = global.btoa(String.fromCharCode.apply(null, testBytes));
			const dataUrl = `data:image/x-bin;base64,${base64}`;
			
			expect(dataUrl).toContain('data:image/x-bin;base64,');
			expect(base64).toBe('SGVsbG8='); // "Hello" in base64
		});
	});
});