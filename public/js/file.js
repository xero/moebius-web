import { State, $ } from './state.js';
import { enforceMaxBytes } from './ui.js';

// Load module implementation
function loadModule() {

	class File {
		constructor(bytes) {
			let pos, commentCount;

			const SAUCE_ID = new Uint8Array([0x53, 0x41, 0x55, 0x43, 0x45]);
			const COMNT_ID = new Uint8Array([0x43, 0x4F, 0x4D, 0x4E, 0x54]);

			this.get = function() {
				if (pos >= bytes.length) {
					throw "Unexpected end of file reached.";
				}
				pos += 1;
				return bytes[pos - 1];
			};

			this.get16 = function() {
				const v = this.get();
				return v + (this.get() << 8);
			};

			this.get32 = function() {
				let v;
				v = this.get();
				v += this.get() << 8;
				v += this.get() << 16;
				return v + (this.get() << 24);
			};

			this.getC = function() {
				return String.fromCharCode(this.get());
			};

			this.getS = function(num) {
				let string;
				string = "";
				while (num > 0) {
					string += this.getC();
					num -= 1;
				}
				return string.replace(/\s+$/, "");
			};

			this.lookahead = function(match) {
				let i;
				for (i = 0; i < match.length; i += 1) {
					if ((pos + i === bytes.length) || (bytes[pos + i] !== match[i])) {
						break;
					}
				}
				return i === match.length;
			};

			this.read = function(num) {
				const t = pos;

				num = num || this.size - pos;
				while ((pos += 1) < this.size) {
					num -= 1;
					if (num === 0) {
						break;
					}
				}
				return bytes.subarray(t, pos);
			};

			this.seek = function(newPos) {
				pos = newPos;
			};

			this.peek = function(num) {
				num = num || 0;
				return bytes[pos + num];
			};

			this.getPos = function() {
				return pos;
			};

			this.eof = function() {
				return pos === this.size;
			};

			pos = bytes.length - 128;

			if (this.lookahead(SAUCE_ID)) {
				this.sauce = {};
				this.getS(5);
				this.sauce.version = this.getS(2);
				this.sauce.title = this.getS(35);
				this.sauce.author = this.getS(20);
				this.sauce.group = this.getS(20); // String, maximum of 20 characters
				this.sauce.date = this.getS(8); // String, maximum of 8 characters
				this.sauce.fileSize = this.get32(); // unsigned 32-bit
				this.sauce.dataType = this.get();
				this.sauce.fileType = this.get(); // unsigned 8-bit
				this.sauce.tInfo1 = this.get16(); // unsigned 16-bit
				this.sauce.tInfo2 = this.get16();
				this.sauce.tInfo3 = this.get16();
				this.sauce.tInfo4 = this.get16();

				this.sauce.comments = [];
				commentCount = this.get();
				this.sauce.flags = this.get();
				if (commentCount > 0) {

					pos = bytes.length - 128 - (commentCount * 64) - 5;

					if (this.lookahead(COMNT_ID)) {

						this.getS(5);

						while (commentCount > 0) {
							this.sauce.comments.push(this.getS(64));
							commentCount -= 1;
						}
					}
				}
			}

			pos = 0;
			if (this.sauce) {
				if (this.sauce.fileSize > 0 && this.sauce.fileSize < bytes.length) {
					this.size = this.sauce.fileSize;
				} else {
					this.size = bytes.length - 128;
				}
			} else {
				this.size = bytes.length;
			}
		}
	}

	class ScreenData {
		constructor(width) {
			let imageData, maxY, pos;

			function binColor(ansiColor) {
				switch (ansiColor) {
					case 4:
						return 1;
					case 6:
						return 3;
					case 1:
						return 4;
					case 3:
						return 6;
					case 12:
						return 9;
					case 14:
						return 11;
					case 9:
						return 12;
					case 11:
						return 14;
					default:
						return ansiColor;
				}
			}

			this.reset = function() {
				imageData = new Uint8Array(width * 100 * 3);
				maxY = 0;
				pos = 0;
			};

			this.reset();

			this.raw = function(bytes) {
				let i, j;
				maxY = Math.ceil(bytes.length / 2 / width);
				imageData = new Uint8Array(width * maxY * 3);
				for (i = 0, j = 0; j < bytes.length; i += 3, j += 2) {
					imageData[i] = bytes[j];
					imageData[i + 1] = bytes[j + 1] & 15;
					imageData[i + 2] = bytes[j + 1] >> 4;
				}
			};

			function extendImageData(y) {
				const newImageData = new Uint8Array(width * (y + 100) * 3 + imageData.length);
				newImageData.set(imageData, 0);
				imageData = newImageData;
			}

			this.set = function(x, y, charCode, fg, bg) {
				pos = (y * width + x) * 3;
				if (pos >= imageData.length) {
					extendImageData(y);
				}
				imageData[pos] = charCode;
				imageData[pos + 1] = binColor(fg);
				imageData[pos + 2] = binColor(bg);
				if (y > maxY) {
					maxY = y;
				}
			};

			this.getData = function() {
				return imageData.subarray(0, width * (maxY + 1) * 3);
			};

			this.getHeight = function() {
				return maxY + 1;
			};

			this.rowLength = width * 3;

			this.stripBlinking = function() {
				let i;
				for (i = 2; i < imageData.length; i += 3) {
					if (imageData[i] >= 8) {
						imageData[i] -= 8;
					}
				}
			};
		}
	}

	function loadAnsi(bytes, encoding = "ansi") {
		let escaped, escapeCode, j, code, values, topOfScreen, x, y, savedX, savedY, foreground, background, bold, blink, inverse;

		function decodeUtf8(bytes, startIndex) {
			let charCode = bytes[startIndex];
			if ((charCode & 0x80) === 0) {
				// 1-byte sequence (ASCII)
				return { charCode, bytesConsumed: 1 };
			} else if ((charCode & 0xE0) === 0xC0) {
				// 2-byte sequence
				const secondByte = bytes[startIndex + 1];
				charCode = ((charCode & 0x1F) << 6) | (secondByte & 0x3F);
				return { charCode, bytesConsumed: 2 };
			} else if ((charCode & 0xF0) === 0xE0) {
				// 3-byte sequence
				const secondByte = bytes[startIndex + 1];
				const thirdByte = bytes[startIndex + 2];
				charCode = ((charCode & 0x0F) << 12) | ((secondByte & 0x3F) << 6) | (thirdByte & 0x3F);
				return { charCode, bytesConsumed: 3 };
			}
			throw new Error("Invalid UTF-8 byte sequence");
		}

		// Parse SAUCE metadata
		const sauceData = getSauce(bytes, 80);
		x = 1;
		y = 1;
		topOfScreen = 0;
		escapeCode = "";
		escaped = false;
		const columns = sauceData.columns;
		const imageData = new ScreenData(columns);
		const file = new File(bytes);

		function resetAttributes() {
			foreground = 7;
			background = 0;
			bold = false;
			blink = false;
			inverse = false;
		}
		resetAttributes();

		function newLine() {
			x = 1;
			if (y === 26 - 1) {
				topOfScreen += 1;
			} else {
				y += 1;
			}
		}

		function setPos(newX, newY) {
			x = Math.min(columns, Math.max(1, newX));
			y = Math.min(26, Math.max(1, newY));
		}

		function getValues() {
			return escapeCode.substr(1, escapeCode.length - 2).split(";").map((value) => {
				const parsedValue = parseInt(value, 10);
				return isNaN(parsedValue) ? 1 : parsedValue;
			});
		}

		while (!file.eof()) {
			code = file.get();
			let bytesConsumed = 1;
			if (encoding === "utf8") {
				const decoded = decodeUtf8(bytes, file.getPos() - 1);
				code = decoded.charCode;
				bytesConsumed = decoded.bytesConsumed;
				code = Object.keys(getUnicode).find(key => getUnicode(key) === code) || code;
			}

			if (escaped) {
				escapeCode += String.fromCharCode(code);
				if ((code >= 65 && code <= 90) || (code >= 97 && code <= 122)) {
					escaped = false;
					values = getValues();
					if (escapeCode.charAt(0) === "[") {
						switch (escapeCode.charAt(escapeCode.length - 1)) {
							case "A":
								y = Math.max(1, y - values[0]);
								break;
							case "B":
								y = Math.min(26 - 1, y + values[0]);
								break;
							case "C":
								if (x === columns) {
									newLine();
								}
								x = Math.min(columns, x + values[0]);
								break;
							case "D":
								x = Math.max(1, x - values[0]);
								break;
							case "H":
								if (values.length === 1) {
									setPos(1, values[0]);
								} else {
									setPos(values[1], values[0]);
								}
								break;
							case "J":
								if (values[0] === 2) {
									x = 1;
									y = 1;
									imageData.reset();
								}
								break;
							case "K":
								for (j = x - 1; j < columns; j += 1) {
									imageData.set(j, y - 1 + topOfScreen, 0, 0);
								}
								break;
							case "m":
								for (j = 0; j < values.length; j += 1) {
									if (values[j] >= 30 && values[j] <= 37) {
										foreground = values[j] - 30;
									} else if (values[j] >= 40 && values[j] <= 47) {
										background = values[j] - 40;
									} else {
										switch (values[j]) {
											case 0: // Reset attributes
												resetAttributes();
												break;
											case 1: // Bold
												bold = true;
												break;
											case 5: // Blink
												blink = true;
												break;
											case 7: // Inverse
												inverse = true;
												break;
											case 22: // Bold off
												bold = false;
												break;
											case 25: // Blink off
												blink = false;
												break;
											case 27: // Inverse off
												inverse = false;
												break;
										}
									}
								}
								break;
							case "s":
								savedX = x;
								savedY = y;
								break;
							case "u":
								x = savedX;
								y = savedY;
								break;
						}
					}
					escapeCode = "";
				}
			} else {
				switch (code) {
					case 10: // Lone linefeed (LF).
						newLine();
						break;
					case 13: // Carriage Return, and Linefeed (CRLF)
						if (file.peek() === 0x0A) {
							file.read(1);
							newLine();
						}
						break;
					case 26: // Ignore eof characters until the actual end-of-file, or sauce record
						break;
					default:
						if (code === 27 && file.peek() === 0x5B) {
							escaped = true;
						} else {
							if (!inverse) {
								imageData.set(
									x - 1,
									y - 1 + topOfScreen,
									code,
									bold ? foreground + 8 : foreground,
									blink ? background + 8 : background
								);
							} else {
								imageData.set(
									x - 1,
									y - 1 + topOfScreen,
									code,
									bold ? background + 8 : background,
									blink ? foreground + 8 : foreground
								);
							}
							x += 1;
							if (x === columns + 1) {
								newLine();
							}
						}
				}
			}

			// Advance file position for UTF-8 multi-byte sequences
			file.seek(file.getPos() + bytesConsumed - 1);
		}

		return {
			width: columns,
			height: imageData.getHeight(),
			data: imageData.getData(),
			noblink: sauceData.iceColors,
			title: sauceData.title,
			author: sauceData.author,
			group: sauceData.group,
			comments: sauceData.comments,
			fontName: sauceData.fontName,
			letterSpacing: sauceData.letterSpacing,
		};
	}

	function convertData(data) {
		const output = new Uint16Array(data.length / 3);
		for (let i = 0, j = 0; i < data.length; i += 1, j += 3) {
			output[i] = (data[j] << 8) + (data[j + 2] << 4) + data[j + 1];
		}
		return output;
	}

	function bytesToString(bytes, offset, size) {
		let text = "", i;
		for (i = 0; i < size; i++) {
			const charCode = bytes[offset + i];
			if (charCode === 0) { break; } // Stop at null terminator
			text += String.fromCharCode(charCode);
		}
		return text;
	}

	function sauceToAppFont(sauceFontName) {
		if (!sauceFontName) { return null; }

		// Map SAUCE font names to application font names
		switch (sauceFontName) {
			case "IBM VGA":
				return "CP437 8x16";
			case "IBM VGA50":
				return "CP437 8x8";
			case "IBM VGA25G":
				return "CP437 8x19";
			case "IBM EGA":
				return "CP437 8x14";
			case "IBM EGA43":
				return "CP437 8x8";

			// Code page variants
			case "IBM VGA 437":
				return "CP437 8x16";
			case "IBM VGA50 437":
				return "CP437 8x8";
			case "IBM VGA25G 437":
				return "CP437 8x19";
			case "IBM EGA 437":
				return "CP437 8x14";
			case "IBM EGA43 437":
				return "CP437 8x8";

			case "IBM VGA 850":
				return "CP850 8x16";
			case "IBM VGA50 850":
				return "CP850 8x8";
			case "IBM VGA25G 850":
				return "CP850 8x19";
			case "IBM EGA 850":
				return "CP850 8x14";
			case "IBM EGA43 850":
				return "CP850 8x8";

			case "IBM VGA 852":
				return "CP852 8x16";
			case "IBM VGA50 852":
				return "CP852 8x8";
			case "IBM VGA25G 852":
				return "CP852 8x19";
			case "IBM EGA 852":
				return "CP852 8x14";
			case "IBM EGA43 852":
				return "CP852 8x8";

			// Amiga fonts
			case "Amiga Topaz 1":
				return "Topaz 500 8x16";
			case "Amiga Topaz 1+":
				return "Topaz+ 500 8x16";
			case "Amiga Topaz 2":
				return "Topaz 1200 8x16";
			case "Amiga Topaz 2+":
				return "Topaz+ 1200 8x16";
			case "Amiga MicroKnight":
				return "MicroKnight 8x16";
			case "Amiga MicroKnight+":
				return "MicroKnight+ 8x16";
			case "Amiga P0T-NOoDLE":
				return "P0t-NOoDLE 8x16";
			case "Amiga mOsOul":
				return "mO'sOul 8x16";

			// C64 fonts
			case "C64 PETSCII unshifted":
				return "C64_PETSCII_unshifted";
			case "C64 PETSCII shifted":
				return "C64_PETSCII_shifted";

			// XBin embedded font
			case "XBIN":
				return "XBIN";

			default:
				return null;
		}
	}

	function appToSauceFont(appFontName) {
		if (!appFontName) { return "IBM VGA"; }

		// Map application font names to SAUCE font names
		switch (appFontName) {
			case "CP437 8x16":
				return "IBM VGA";
			case "CP437 8x8":
				return "IBM VGA50";
			case "CP437 8x19":
				return "IBM VGA25G";
			case "CP437 8x14":
				return "IBM EGA";

			case "CP850 8x16":
				return "IBM VGA 850";
			case "CP850 8x8":
				return "IBM VGA50 850";
			case "CP850 8x19":
				return "IBM VGA25G 850";
			case "CP850 8x14":
				return "IBM EGA 850";

			case "CP852 8x16":
				return "IBM VGA 852";
			case "CP852 8x8":
				return "IBM VGA50 852";
			case "CP852 8x19":
				return "IBM VGA25G 852";
			case "CP852 8x14":
				return "IBM EGA 852";

			// Amiga fonts
			case "Topaz 500 8x16":
				return "Amiga Topaz 1";
			case "Topaz+ 500 8x16":
				return "Amiga Topaz 1+";
			case "Topaz 1200 8x16":
				return "Amiga Topaz 2";
			case "Topaz+ 1200 8x16":
				return "Amiga Topaz 2+";
			case "MicroKnight 8x16":
				return "Amiga MicroKnight";
			case "MicroKnight+ 8x16":
				return "Amiga MicroKnight+";
			case "P0t-NOoDLE 8x16":
				return "Amiga P0T-NOoDLE";
			case "mO'sOul 8x16":
				return "Amiga mOsOul";

			// C64 fonts
			case "C64_PETSCII_unshifted":
				return "C64 PETSCII unshifted";
			case "C64_PETSCII_shifted":
				return "C64 PETSCII shifted";

			// XBin embedded font
			case "XBIN":
				return "XBIN";

			default:
				return "IBM VGA";
		}
	}

	function getSauce(bytes, defaultColumnValue) {
		let sauce, fileSize, dataType, columns, rows, flags, commentsCount, comments;

		function removeTrailingWhitespace(text) {
			return text.replace(/\s+$/, "");
		}

		function readLE16(data, offset) {
			return data[offset] | (data[offset + 1] << 8);
		}

		function readLE32(data, offset) {
			return data[offset] | (data[offset + 1] << 8) | (data[offset + 2] << 16) | (data[offset + 3] << 24);
		}
		if (defaultColumnValue) {
			let maxColumns = 0;
			let currentColumns = 0;
			for (let i = 0; i < bytes.length; i++) {
				const byte = bytes[i];
				if (byte === 10) {
					rows += 1;
					maxColumns = Math.max(maxColumns, currentColumns);
					currentColumns = 0;
				} else {
					currentColumns += 1;
				}
			}
			if (currentColumns > 0) {
				rows += 1;
				maxColumns = Math.max(maxColumns, currentColumns);
			}
			columns = maxColumns;
			if (defaultColumnValue > 0) {
				columns = defaultColumnValue;
			}
		}

		if (bytes.length >= 128) {
			sauce = bytes.slice(-128);
			if (bytesToString(sauce, 0, 5) === "SAUCE" && bytesToString(sauce, 5, 2) === "00") {
				fileSize = readLE32(sauce, 90);
				dataType = sauce[94];
				commentsCount = sauce[104]; // Comments field at byte 104

				if (dataType === 5) {
					columns = sauce[95] * 2;
					rows = fileSize / columns / 2;
				} else {
					columns = readLE16(sauce, 96);
					rows = readLE16(sauce, 98);
				}
				flags = sauce[105];
				const letterSpacingBits = (flags >> 1) & 0x03; // Extract bits 1-2

				// Parse comments if present
				comments = "";
				if (commentsCount > 0) {
					const commentBlockSize = 5 + (commentsCount * 64); // "COMNT" + comment lines
					const totalSauceSize = commentBlockSize + 128; // Comment block + SAUCE record

					if (bytes.length >= totalSauceSize) {
						const commentBlockStart = bytes.length - totalSauceSize;
						const commentId = bytesToString(bytes, commentBlockStart, 5);

						if (commentId === "COMNT") {
							const commentLines = [];
							for (let i = 0; i < commentsCount; i++) {
								const lineOffset = commentBlockStart + 5 + (i * 64);
								const line = removeTrailingWhitespace(bytesToString(bytes, lineOffset, 64));
								commentLines.push(line);
							}
							comments = commentLines.join("\n");
						}
					}
				}

				return {
					"title": removeTrailingWhitespace(bytesToString(sauce, 7, 35)),
					"author": removeTrailingWhitespace(bytesToString(sauce, 42, 20)),
					"group": removeTrailingWhitespace(bytesToString(sauce, 62, 20)),
					"fileSize": fileSize,
					"columns": columns,
					"rows": rows,
					"iceColors": (flags & 0x01) === 1,
					"letterSpacing": letterSpacingBits === 2, // true for 9-pixel fonts
					"fontName": removeTrailingWhitespace(bytesToString(sauce, 106, 22)),
					"comments": comments
				};
			}
		}
		return {
			"title": "",
			"author": "",
			"group": "",
			"fileSize": bytes.length,
			"columns": columns,
			"rows": rows,
			"iceColors": false,
			"letterSpacing": false,
			"fontName": "",
			"comments": ""
		};
	}

	function convertUInt8ToUint16(uint8Array, start, size) {
		let i, j;
		const uint16Array = new Uint16Array(size / 2);
		for (i = 0, j = 0; i < size; i += 2, j += 1) {
			uint16Array[j] = (uint8Array[start + i] << 8) + uint8Array[start + i + 1];
		}
		return uint16Array;
	}

	function loadBin(bytes) {
		const sauce = getSauce(bytes, 160);
		if (sauce.rows === undefined) {
			sauce.rows = sauce.fileSize / 160 / 2;
		}
		const data = convertUInt8ToUint16(bytes, 0, sauce.columns * sauce.rows * 2);
		return {
			"columns": sauce.columns,
			"rows": sauce.rows,
			"data": data,
			"iceColors": sauce.iceColors,
			"letterSpacing": sauce.letterSpacing,
			"title": sauce.title,
			"author": sauce.author,
			"group": sauce.group,
			"comments": sauce.comments
		};
	}

	function uncompress(bytes, dataIndex, fileSize, column, rows) {
		const data = new Uint16Array(column * rows);
		let i, value, count, j, k, char, attribute;
		for (i = dataIndex, j = 0; i < fileSize;) {
			value = bytes[i++];
			count = value & 0x3F;
			switch (value >> 6) {
				case 1:
					char = bytes[i++];
					for (k = 0; k <= count; k++) {
						data[j++] = (char << 8) + bytes[i++];
					}
					break;
				case 2:
					attribute = bytes[i++];
					for (k = 0; k <= count; k++) {
						data[j++] = (bytes[i++] << 8) + attribute;
					}
					break;
				case 3:
					char = bytes[i++];
					attribute = bytes[i++];
					for (k = 0; k <= count; k++) {
						data[j++] = (char << 8) + attribute;
					}
					break;
				default:
					for (k = 0; k <= count; k++) {
						data[j++] = (bytes[i++] << 8) + bytes[i++];
					}
					break;
			}
		}
		return data;
	}

	function loadXBin(bytes) {
		const sauce = getSauce(bytes);
		let columns, rows, fontHeight, flags, paletteData, paletteFlag, fontFlag, compressFlag, iceColorsFlag, font512Flag, dataIndex, data, fontData, fontName;
		if (bytesToString(bytes, 0, 4) === "XBIN" && bytes[4] === 0x1A) {
			columns = (bytes[6] << 8) + bytes[5];
			rows = (bytes[8] << 8) + bytes[7];
			fontHeight = bytes[9];
			flags = bytes[10];
			paletteFlag = (flags & 0x01) === 1;
			fontFlag = (flags >> 1 & 0x01) === 1;
			compressFlag = (flags >> 2 & 0x01) === 1;
			iceColorsFlag = (flags >> 3 & 0x01) === 1;
			font512Flag = (flags >> 4 & 0x01) === 1;
			dataIndex = 11;

			// Extract palette data if present
			paletteData = null;
			if (paletteFlag === true) {
				paletteData = new Uint8Array(48);
				for (let i = 0; i < 48; i++) {
					paletteData[i] = bytes[dataIndex + i];
				}
				dataIndex += 48;
			}

			// Extract font data if present
			fontData = null;
			const fontCharCount = font512Flag ? 512 : 256;
			if (fontFlag === true) {
				const fontDataSize = fontCharCount * fontHeight;
				fontData = new Uint8Array(fontDataSize);
				for (let i = 0; i < fontDataSize; i++) {
					fontData[i] = bytes[dataIndex + i];
				}
				dataIndex += fontDataSize;
			}

			if (compressFlag === true) {
				data = uncompress(bytes, dataIndex, sauce.fileSize, columns, rows);
			} else {
				data = convertUInt8ToUint16(bytes, dataIndex, columns * rows * 2);
			}

			// Always use XBIN font name for XB files as requested
			fontName = "XBIN";
		}
		return {
			"columns": columns,
			"rows": rows,
			"data": data,
			"iceColors": iceColorsFlag,
			"letterSpacing": false,
			"title": sauce.title,
			"author": sauce.author,
			"group": sauce.group,
			"comments": sauce.comments,
			"fontName": fontName,
			"paletteData": paletteData,
			"fontData": fontData ? { bytes: fontData, width: 8, height: fontHeight } : null
		};
	}

	function file(file, callback) {
		const reader = new FileReader();
		reader.addEventListener("load", (_e) => {
			const data = new Uint8Array(reader.result);
			let imageData;
			switch (file.name.split(".").pop().toLowerCase()) {
				case "xb":
					imageData = loadXBin(data);
					// Update SAUCE UI fields like ANSI files do
					$("sauce-title").value = imageData.title || "";
					$("sauce-group").value = imageData.group || "";
					$("sauce-author").value = imageData.author || "";
					$("sauce-comments").value = imageData.comments || "";
					enforceMaxBytes();

					// Implement sequential waterfall loading for XB files to eliminate race conditions
					State.textArtCanvas.loadXBFileSequential(imageData, (columns, rows, data, iceColors, letterSpacing, fontName) => {
						callback(columns, rows, data, iceColors, letterSpacing, fontName);
					});
					// Trigger character brush refresh for XB files
					document.dispatchEvent(new CustomEvent("onXBFontLoaded"));
					// Then ensure everything is properly rendered after font loading completes
					State.textArtCanvas.redrawEntireImage();
					break;
				case "bin":
					// Clear any previous XB data to avoid palette persistence
					State.textArtCanvas.clearXBData(() => {
						imageData = loadBin(data);
						callback(imageData.columns, imageData.rows, imageData.data, imageData.iceColors, imageData.letterSpacing);
					});
					break;
				default:
					// Clear any previous XB data to avoid palette persistence
					State.textArtCanvas.clearXBData(() => {
						imageData = loadAnsi(data, file.name.toLowerCase().endsWith(".utf8.ans") ? true : false);
						$("sauce-title").value = imageData.title;
						$("sauce-group").value = imageData.group;
						$("sauce-author").value = imageData.author;
						$("sauce-comments").value = imageData.comments || "";
						enforceMaxBytes();

						callback(imageData.width, imageData.height, convertData(imageData.data), imageData.noblink, imageData.letterSpacing, imageData.fontName);
					});
					break;
			}
		});
		reader.readAsArrayBuffer(file);
	}

	return {
		"file": file,
		"sauceToAppFont": sauceToAppFont,
		"appToSauceFont": appToSauceFont
	};
}

// Create Load module instance
const Load = loadModule();

// Save module implementation
function saveModule() {
	function saveFile(bytes, sauce, filename) {
		let outputBytes;
		if (sauce !== undefined) {
			outputBytes = new Uint8Array(bytes.length + sauce.length);
			outputBytes.set(sauce, bytes.length);
		} else {
			outputBytes = new Uint8Array(bytes.length);
		}
		outputBytes.set(bytes, 0);

		const downloadLink = document.createElement("a");
		if ((navigator.userAgent.indexOf("Chrome") === -1) && (navigator.userAgent.indexOf("Safari") !== -1)) {
			let base64String = "";
			for (let i = 0; i < outputBytes.length; i += 1) {
				base64String += String.fromCharCode(outputBytes[i]);
			}
			downloadLink.href = "data:application/octet-stream;base64," + btoa(base64String);
		} else {
			const blob = new Blob([outputBytes], { "type": "application/octet-stream" });
			downloadLink.href = URL.createObjectURL(blob);
		}

		downloadLink.download = filename;
		const clickEvent = new MouseEvent("click", {
			bubbles: true,
			cancelable: true,
			view: window
		});
		downloadLink.dispatchEvent(clickEvent);
		window.URL.revokeObjectURL(downloadLink.href);
	}

	function createSauce(datatype, filetype, filesize, doFlagsAndTInfoS) {
		function addText(text, maxlength, index) {
			let i;
			for (i = 0; i < maxlength; i += 1) {
				sauce[i + index] = (i < text.length) ? text.charCodeAt(i) : 0x20;
			}
		}

		function addCommentText(text, maxlength, index, commentBlock) {
			let i;
			for (i = 0; i < maxlength; i += 1) {
				commentBlock[i + index] = (i < text.length) ? text.charCodeAt(i) : 0x20;
			}
		}

		const commentsText = $("sauce-comments").value.trim();
		const commentLines = commentsText ? commentsText.split('\n') : [];
		const commentsCount = Math.min(commentLines.length, 255); // Max 255 comment lines per SAUCE spec

		// Create comment block
		let commentBlock = null;
		if (commentsCount > 0) {
			const commentBlockSize = 5 + (commentsCount * 64); // "COMNT" + comment lines
			commentBlock = new Uint8Array(commentBlockSize);

			commentBlock.set(new Uint8Array([0x43, 0x4F, 0x4D, 0x4E, 0x54]), 0); // "COMNT"
			// comment lines (64 bytes each)
			for (let i = 0; i < commentsCount; i++) {
				const line = commentLines[i] || "";
				addCommentText(line, 64, 5 + (i * 64), commentBlock);
			}
		}

		const sauce = new Uint8Array(129);
		sauce[0] = 0x1A;
		sauce.set(new Uint8Array([0x53, 0x41, 0x55, 0x43, 0x45, 0x30, 0x30]), 1);
		addText($("sauce-title").value, 35, 8);
		addText($("sauce-author").value, 20, 43);
		addText($("sauce-group").value, 20, 63);
		const date = new Date();
		addText(date.getFullYear().toString(10), 4, 83);
		const month = date.getMonth() + 1;
		addText((month < 10) ? ("0" + month.toString(10)) : month.toString(10), 2, 87);
		const day = date.getDate();
		addText((day < 10) ? ("0" + day.toString(10)) : day.toString(10), 2, 89);
		sauce[91] = filesize & 0xFF;
		sauce[92] = (filesize >> 8) & 0xFF;
		sauce[93] = (filesize >> 16) & 0xFF;
		sauce[94] = filesize >> 24;
		sauce[95] = datatype;
		sauce[96] = filetype;
		const columns = State.textArtCanvas.getColumns();
		sauce[97] = columns & 0xFF;
		sauce[98] = columns >> 8;
		const rows = State.textArtCanvas.getRows();
		sauce[99] = rows & 0xFF;
		sauce[100] = rows >> 8;
		sauce[104] = commentsCount; // Set comments count
		sauce[105] = 0;
		if (doFlagsAndTInfoS) {
			let flags = 0;
			if (State.textArtCanvas.getIceColors() === true) {
				flags += 1;
			}
			if (State.font.getLetterSpacing() === false) {
				flags += (1 << 1);
			} else {
				flags += (1 << 2);
			}
			sauce[106] = flags;
			const currentAppFontName = State.textArtCanvas.getCurrentFontName();
			const sauceFontName = Load.appToSauceFont(currentAppFontName);
			addText(sauceFontName, sauceFontName.length, 107);
		}

		// Combine comment block and sauce record
		if (commentBlock) {
			const combined = new Uint8Array(commentBlock.length + sauce.length);
			combined.set(commentBlock, 0);
			combined.set(sauce, commentBlock.length);
			return combined;
		}
		return sauce;
	}

	function getUnicode(charCode) {
		switch (charCode) {
			case 1: return 0x263A;
			case 2: return 0x263B;
			case 3: return 0x2665;
			case 4: return 0x2666;
			case 5: return 0x2663;
			case 6: return 0x2660;
			case 7: return 0x2022;
			case 8: return 0x25D8;
			case 9: return 0x25CB;
			case 10: return 0x25D9;
			case 11: return 0x2642;
			case 12: return 0x2640;
			case 13: return 0x266A;
			case 14: return 0x266B;
			case 15: return 0x263C;
			case 16: return 0x25BA;
			case 17: return 0x25C4;
			case 18: return 0x2195;
			case 19: return 0x203C;
			case 20: return 0x00B6;
			case 21: return 0x00A7;
			case 22: return 0x25AC;
			case 23: return 0x21A8;
			case 24: return 0x2191;
			case 25: return 0x2193;
			case 26: return 0x2192;
			case 27: return 0x2190;
			case 28: return 0x221F;
			case 29: return 0x2194;
			case 30: return 0x25B2;
			case 31: return 0x25BC;
			case 127: return 0x2302;
			case 128: return 0x00C7;
			case 129: return 0x00FC;
			case 130: return 0x00E9;
			case 131: return 0x00E2;
			case 132: return 0x00E4;
			case 133: return 0x00E0;
			case 134: return 0x00E5;
			case 135: return 0x00E7;
			case 136: return 0x00EA;
			case 137: return 0x00EB;
			case 138: return 0x00E8;
			case 139: return 0x00EF;
			case 140: return 0x00EE;
			case 141: return 0x00EC;
			case 142: return 0x00C4;
			case 143: return 0x00C5;
			case 144: return 0x00C9;
			case 145: return 0x00E6;
			case 146: return 0x00C6;
			case 147: return 0x00F4;
			case 148: return 0x00F6;
			case 149: return 0x00F2;
			case 150: return 0x00FB;
			case 151: return 0x00F9;
			case 152: return 0x00FF;
			case 153: return 0x00D6;
			case 154: return 0x00DC;
			case 155: return 0x00A2;
			case 156: return 0x00A3;
			case 157: return 0x00A5;
			case 158: return 0x20A7;
			case 159: return 0x0192;
			case 160: return 0x00E1;
			case 161: return 0x00ED;
			case 162: return 0x00F3;
			case 163: return 0x00FA;
			case 164: return 0x00F1;
			case 165: return 0x00D1;
			case 166: return 0x00AA;
			case 167: return 0x00BA;
			case 168: return 0x00BF;
			case 169: return 0x2310;
			case 170: return 0x00AC;
			case 171: return 0x00BD;
			case 172: return 0x00BC;
			case 173: return 0x00A1;
			case 174: return 0x00AB;
			case 175: return 0x00BB;
			case 176: return 0x2591;
			case 177: return 0x2592;
			case 178: return 0x2593;
			case 179: return 0x2502;
			case 180: return 0x2524;
			case 181: return 0x2561;
			case 182: return 0x2562;
			case 183: return 0x2556;
			case 184: return 0x2555;
			case 185: return 0x2563;
			case 186: return 0x2551;
			case 187: return 0x2557;
			case 188: return 0x255D;
			case 189: return 0x255C;
			case 190: return 0x255B;
			case 191: return 0x2510;
			case 192: return 0x2514;
			case 193: return 0x2534;
			case 194: return 0x252C;
			case 195: return 0x251C;
			case 196: return 0x2500;
			case 197: return 0x253C;
			case 198: return 0x255E;
			case 199: return 0x255F;
			case 200: return 0x255A;
			case 201: return 0x2554;
			case 202: return 0x2569;
			case 203: return 0x2566;
			case 204: return 0x2560;
			case 205: return 0x2550;
			case 206: return 0x256C;
			case 207: return 0x2567;
			case 208: return 0x2568;
			case 209: return 0x2564;
			case 210: return 0x2565;
			case 211: return 0x2559;
			case 212: return 0x2558;
			case 213: return 0x2552;
			case 214: return 0x2553;
			case 215: return 0x256B;
			case 216: return 0x256A;
			case 217: return 0x2518;
			case 218: return 0x250C;
			case 219: return 0x2588;
			case 220: return 0x2584;
			case 221: return 0x258C;
			case 222: return 0x2590;
			case 223: return 0x2580;
			case 224: return 0x03B1;
			case 225: return 0x00DF;
			case 226: return 0x0393;
			case 227: return 0x03C0;
			case 228: return 0x03A3;
			case 229: return 0x03C3;
			case 230: return 0x00B5;
			case 231: return 0x03C4;
			case 232: return 0x03A6;
			case 233: return 0x0398;
			case 234: return 0x03A9;
			case 235: return 0x03B4;
			case 236: return 0x221E;
			case 237: return 0x03C6;
			case 238: return 0x03B5;
			case 239: return 0x2229;
			case 240: return 0x2261;
			case 241: return 0x00B1;
			case 242: return 0x2265;
			case 243: return 0x2264;
			case 244: return 0x2320;
			case 245: return 0x2321;
			case 246: return 0x00F7;
			case 247: return 0x2248;
			case 248: return 0x00B0;
			case 249: return 0x2219;
			case 250: return 0x00B7;
			case 251: return 0x221A;
			case 252: return 0x207F;
			case 253: return 0x00B2;
			case 254: return 0x25A0;
			case 0:
			case 255:
				return 0x00A0;
			default:
				return charCode;
		}
	}

	function unicodeToArray(unicode) {
		if (unicode < 0x80) {
			return [unicode];
		} else if (unicode < 0x800) {
			return [(unicode >> 6) | 192, (unicode & 63) | 128];
		}
		return [(unicode >> 12) | 224, ((unicode >> 6) & 63) | 128, (unicode & 63) | 128];
	}

	function getUTF8(charCode) {
		return unicodeToArray(getUnicode(charCode));
	}

	function encodeANSi(useUTF8, blinkers = true) {
		function ansiColor(binColor) {
			switch (binColor) {
				case 1:
					return 4;
				case 3:
					return 6;
				case 4:
					return 1;
				case 6:
					return 3;
				default:
					return binColor;
			}
		}

		const imageData = State.textArtCanvas.getImageData();
		const columns = State.textArtCanvas.getColumns();
		const rows = State.textArtCanvas.getRows();
		let output = [27, 91, 48, 109]; // Start with a full reset (ESC[0m)
		let bold = false;
		let blink = false;
		let currentForeground = 7;
		let currentBackground = 0;
		let currentBold = false;
		let currentBlink = false;

		for (let row = 0; row < rows; row++) {
			let lineOutput = [];
			let lineForeground = currentForeground;
			let lineBackground = currentBackground;
			let lineBold = currentBold;
			let lineBlink = currentBlink;

			for (let col = 0; col < columns; col++) {
				const inputIndex = row * columns + col;
				const attribs = [];
				let charCode = imageData[inputIndex] >> 8;
				let foreground = imageData[inputIndex] & 15;
				let background = imageData[inputIndex] >> 4 & 15;

				// Map special cases for control characters
				switch (charCode) {
					case 10:
						charCode = 9;
						break;
					case 13:
						charCode = 14;
						break;
					case 26:
						charCode = 16;
						break;
					case 27:
						charCode = 17;
						break;
					default:
						break;
				}

				// Handle bold and blink attributes
				if (foreground > 7) {
					bold = true;
					foreground -= 8;
				} else {
					bold = false;
				}
				if (background > 7) {
					blink = true;
					background -= 8;
				} else {
					blink = false;
				}

				// Reset attributes if necessary
				if ((lineBold && !bold) || (lineBlink && !blink)) {
					attribs.push([48]); // Reset attributes (ESC[0m)
					lineForeground = 7;
					lineBackground = 0;
					lineBold = false;
					lineBlink = false;
				}

				// Enable bold or blink if needed
				if (bold && !lineBold) {
					attribs.push([49]); // Bold on (ESC[1m)
					lineBold = true;
				}
				if (blink && !lineBlink) {
					if (!useUTF8 || blinkers) {
						attribs.push([53]); // Blink on (ESC[5m)
					}
					lineBlink = true;
				}

				// Change foreground or background colors if necessary
				if (foreground !== lineForeground) {
					attribs.push([51, 48 + ansiColor(foreground)]); // Set foreground color (ESC[3Xm)
					lineForeground = foreground;
				}
				if (background !== lineBackground) {
					attribs.push([52, 48 + ansiColor(background)]); // Set background color (ESC[4Xm)
					lineBackground = background;
				}

				// Apply attributes if there are changes
				if (attribs.length) {
					lineOutput.push(27, 91); // ESC[
					for (let attribIndex = 0; attribIndex < attribs.length; attribIndex++) {
						lineOutput = lineOutput.concat(attribs[attribIndex]);
						if (attribIndex !== attribs.length - 1) {
							lineOutput.push(59); // ;
						} else {
							lineOutput.push(109); // m
						}
					}
				}

				// Add character to output
				if (useUTF8) {
					getUTF8(charCode).forEach((utf8Code) => {
						lineOutput.push(utf8Code);
					});
				} else {
					lineOutput.push(charCode);
				}
			}

			if (useUTF8) {
				// Fill unused columns with spaces and reset attributes
				for (let col = lineOutput.length / 2; col < columns; col++) {
					lineOutput.push(32); // Space character
					lineOutput.push(27, 91, 49, 109); // Reset background color (ESC[49m)
				}
				// Add newline and reset attributes per row
				lineOutput.push(27, 91, 48, 109); // Full reset (ESC[0m)
				lineOutput.push(10); // Newline (LF)
			}


			// Concatenate the line output to the overall output
			output = output.concat(lineOutput);

			// Update current attributes
			currentForeground = lineForeground;
			currentBackground = lineBackground;
			currentBold = lineBold;
			currentBlink = lineBlink;
		}

		// Final full reset
		output.push(27, 91, 48, 109); // ESC[0m

		const sauce = useUTF8 ? '' : createSauce(1, 1, output.length, true);
		const fname = $('artwork-title').value + (useUTF8 ? ".utf8.ans" : ".ans");
		saveFile(new Uint8Array(output), sauce, fname);
	}
	function ans() {
		encodeANSi(false);
	}

	function utf8() {
		encodeANSi(true);
	}

	function utf8noBlink() {
		encodeANSi(true, false);
	}

	function convert16BitArrayTo8BitArray(Uint16s) {
		const Uint8s = new Uint8Array(Uint16s.length * 2);
		for (let i = 0, j = 0; i < Uint16s.length; i++, j += 2) {
			Uint8s[j] = Uint16s[i] >> 8;
			Uint8s[j + 1] = Uint16s[i] & 255;
		}
		return Uint8s;
	}

	function bin() {
		const columns = State.textArtCanvas.getColumns();
		if (columns % 2 === 0) {
			const imageData = convert16BitArrayTo8BitArray(State.textArtCanvas.getImageData());
			const sauce = createSauce(5, columns / 2, imageData.length, true);
			const fname = $('artwork-title').value;
			saveFile(imageData, sauce, fname + ".bin");
		}
	}

	function xb() {
		const imageData = convert16BitArrayTo8BitArray(State.textArtCanvas.getImageData());
		const columns = State.textArtCanvas.getColumns();
		const rows = State.textArtCanvas.getRows();
		const iceColors = State.textArtCanvas.getIceColors();
		let flags = 0;
		if (iceColors === true) {
			flags += 1 << 3;
		}
		const output = new Uint8Array(11 + imageData.length);
		output.set(new Uint8Array([
			88, 66, 73, 78, 26,
			columns & 255,
			columns >> 8,
			rows & 255,
			rows >> 8,
			State.font.getHeight(),
			flags
		]), 0);
		output.set(imageData, 11);
		const sauce = createSauce(6, 0, imageData.length, false);
		const fname = $('artwork-title').value;
		saveFile(output, sauce, fname + ".xb");
	}

	function dataUrlToBytes(dataURL) {
		const base64Index = dataURL.indexOf(";base64,") + 8;
		const byteChars = atob(dataURL.substr(base64Index, dataURL.length - base64Index));
		const bytes = new Uint8Array(byteChars.length);
		for (let i = 0; i < bytes.length; i++) {
			bytes[i] = byteChars.charCodeAt(i);
		}
		return bytes;
	}

	function png() {
		const fname = $('artwork-title').value;
		saveFile(dataUrlToBytes(State.textArtCanvas.getImage().toDataURL()), undefined, fname + ".png");
	}

	return {
		"ans": ans,
		"utf8": utf8,
		"utf8noBlink": utf8noBlink,
		"bin": bin,
		"xb": xb,
		"png": png
	};
}
const Save = saveModule();

export { Load, Save };
export default { Load, Save };
