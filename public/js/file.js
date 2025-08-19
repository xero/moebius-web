"use strict";

// Load module implementation
function loadModule() {

	function File(bytes) {
		let pos, SAUCE_ID, COMNT_ID, commentCount;

		SAUCE_ID = new Uint8Array([0x53, 0x41, 0x55, 0x43, 0x45]);
		COMNT_ID = new Uint8Array([0x43, 0x4F, 0x4D, 0x4E, 0x54]);

		this.get = function() {
			if (pos >= bytes.length) {
				throw "Unexpected end of file reached.";
			}
			pos += 1;
			return bytes[pos - 1];
		};

		this.get16 = function() {
			let v;
			v = this.get();
			return v + (this.get() << 8);
		};

		this.get32 = function() {
			var v;
			v = this.get();
			v += this.get() << 8;
			v += this.get() << 16;
			return v + (this.get() << 24);
		};

		this.getC = function() {
			return String.fromCharCode(this.get());
		};

		this.getS = function(num) {
			var string;
			string = "";
			while (num > 0) {
				string += this.getC();
				num -= 1;
			}
			return string.replace(/\s+$/, "");
		};

		this.lookahead = function(match) {
			var i;
			for (i = 0; i < match.length; i += 1) {
				if ((pos + i === bytes.length) || (bytes[pos + i] !== match[i])) {
					break;
				}
			}
			return i === match.length;
		};

		this.read = function(num) {
			var t;
			t = pos;

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

	function ScreenData(width) {
		var imageData, maxY, pos;

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
			var i, j;
			maxY = Math.ceil(bytes.length / 2 / width);
			imageData = new Uint8Array(width * maxY * 3);
			for (i = 0, j = 0; j < bytes.length; i += 3, j += 2) {
				imageData[i] = bytes[j];
				imageData[i + 1] = bytes[j + 1] & 15;
				imageData[i + 2] = bytes[j + 1] >> 4;
			}
		};

		function extendImageData(y) {
			var newImageData;
			newImageData = new Uint8Array(width * (y + 100) * 3 + imageData.length);
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
			var i;
			for (i = 2; i < imageData.length; i += 3) {
				if (imageData[i] >= 8) {
					imageData[i] -= 8;
				}
			}
		};
	}

	function loadAnsi(bytes) {
		var file, escaped, escapeCode, j, code, values, columns, imageData, topOfScreen, x, y, savedX, savedY, foreground, background, bold, blink, inverse;

		// Parse SAUCE metadata
		var sauceData = getSauce(bytes, 80);

		file = new File(bytes);

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

		x = 1;
		y = 1;
		topOfScreen = 0;

		escapeCode = "";
		escaped = false;

		columns = sauceData.columns;

		imageData = new ScreenData(columns);

		function getValues() {
			return escapeCode.substr(1, escapeCode.length - 2).split(";").map(function(value) {
				var parsedValue;
				parsedValue = parseInt(value, 10);
				return isNaN(parsedValue) ? 1 : parsedValue;
			});
		}

		while (!file.eof()) {
			code = file.get();
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
								imageData.set(x - 1, y - 1 + topOfScreen, code, bold ? (foreground + 8) : foreground, blink ? (background + 8) : background);
							} else {
								imageData.set(x - 1, y - 1 + topOfScreen, code, bold ? (background + 8) : background, blink ? (foreground + 8) : foreground);
							}
							x += 1;
							if (x === columns + 1) {
								newLine();
							}
						}
				}
			}
		}

		return {
			"width": columns,
			"height": imageData.getHeight(),
			"data": imageData.getData(),
			"noblink": sauceData.iceColours,
			"title": sauceData.title,
			"author": sauceData.author,
			"group": sauceData.group,
			"fontName": sauceData.fontName,
			"letterSpacing": sauceData.letterSpacing
		};
	}

	function convertData(data) {
		var output = new Uint16Array(data.length / 3);
		for (var i = 0, j = 0; i < data.length; i += 1, j += 3) {
			output[i] = (data[j] << 8) + (data[j + 2] << 4) + data[j + 1];
		}
		return output;
	}

	function bytesToString(bytes, offset, size) {
		var text = "", i;
		for (i = 0; i < size; i++) {
			var charCode = bytes[offset + i];
			if (charCode === 0) break; // Stop at null terminator
			text += String.fromCharCode(charCode);
		}
		return text;
	}

	function sauceToAppFont(sauceFontName) {
		if (!sauceFontName) return null;

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
		if (!appFontName) return "IBM VGA";

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
		var sauce, fileSize, dataType, columns, rows, flags;

		function removeTrailingWhitespace(text) {
			return text.replace(/\s+$/, "");
		}

		if (bytes.length >= 128) {
			sauce = bytes.slice(-128);
			if (bytesToString(sauce, 0, 5) === "SAUCE" && bytesToString(sauce, 5, 2) === "00") {
				fileSize = (sauce[93] << 24) + (sauce[92] << 16) + (sauce[91] << 8) + sauce[90];
				dataType = sauce[94];
				if (dataType === 5) {
					columns = sauce[95] * 2;
					rows = fileSize / columns / 2;
				} else {
					columns = (sauce[97] << 8) + sauce[96];
					rows = (sauce[99] << 8) + sauce[98];
				}
				flags = sauce[105];
				var letterSpacingBits = (flags >> 1) & 0x03; // Extract bits 1-2
				return {
					"title": removeTrailingWhitespace(bytesToString(sauce, 7, 35)),
					"author": removeTrailingWhitespace(bytesToString(sauce, 42, 20)),
					"group": removeTrailingWhitespace(bytesToString(sauce, 62, 20)),
					"fileSize": (sauce[93] << 24) + (sauce[92] << 16) + (sauce[91] << 8) + sauce[90],
					"columns": columns,
					"rows": rows,
					"iceColours": (flags & 0x01) === 1,
					"letterSpacing": letterSpacingBits === 2, // true for 9-pixel fonts
					"fontName": removeTrailingWhitespace(bytesToString(sauce, 106, 22))
				};
			}
		}
		return {
			"title": "",
			"author": "",
			"group": "",
			"fileSize": bytes.length,
			"columns": defaultColumnValue,
			"rows": undefined,
			"iceColours": false,
			"letterSpacing": false,
			"fontName": ""
		};
	}

	function convertUInt8ToUint16(uint8Array, start, size) {
		var i, j;
		var uint16Array = new Uint16Array(size / 2);
		for (i = 0, j = 0; i < size; i += 2, j += 1) {
			uint16Array[j] = (uint8Array[start + i] << 8) + uint8Array[start + i + 1];
		}
		return uint16Array;
	}

	function loadBin(bytes) {
		var sauce = getSauce(bytes, 160);
		var data;
		if (sauce.rows === undefined) {
			sauce.rows = sauce.fileSize / 160 / 2;
		}
		data = convertUInt8ToUint16(bytes, 0, sauce.columns * sauce.rows * 2);
		return {
			"columns": sauce.columns,
			"rows": sauce.rows,
			"data": data,
			"iceColours": sauce.iceColours,
			"letterSpacing": sauce.letterSpacing,
			"title": sauce.title,
			"author": sauce.author,
			"group": sauce.group
		};
	}

	function uncompress(bytes, dataIndex, fileSize, column, rows) {
		var data = new Uint16Array(column * rows);
		var i, value, count, j, k, char, attribute;
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
		var sauce = getSauce(bytes);
		var columns, rows, fontHeight, flags, paletteFlag, fontFlag, compressFlag, iceColoursFlag, font512Flag, dataIndex, data, fontName;
		if (bytesToString(bytes, 0, 4) === "XBIN" && bytes[4] === 0x1A) {
			columns = (bytes[6] << 8) + bytes[5];
			rows = (bytes[8] << 8) + bytes[7];
			fontHeight = bytes[9];
			flags = bytes[10];
			paletteFlag = (flags & 0x01) === 1;
			fontFlag = (flags >> 1 & 0x01) === 1;
			compressFlag = (flags >> 2 & 0x01) === 1;
			iceColoursFlag = (flags >> 3 & 0x01) === 1;
			font512Flag = (flags >> 4 & 0x01) === 1;
			dataIndex = 11;

			// Extract palette data if present
			var paletteData = null;
			if (paletteFlag === true) {
				paletteData = new Uint8Array(48);
				for (var i = 0; i < 48; i++) {
					paletteData[i] = bytes[dataIndex + i];
				}
				dataIndex += 48;
			}

			// Extract font data if present
			var fontData = null;
			var fontCharCount = font512Flag ? 512 : 256;
			if (fontFlag === true) {
				var fontDataSize = fontCharCount * fontHeight;
				fontData = new Uint8Array(fontDataSize);
				for (var i = 0; i < fontDataSize; i++) {
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
			"iceColours": iceColoursFlag,
			"letterSpacing": false,
			"title": sauce.title,
			"author": sauce.author,
			"group": sauce.group,
			"fontName": fontName,
			"paletteData": paletteData,
			"fontData": fontData ? { bytes: fontData, width: 8, height: fontHeight } : null
		};
	}

	function file(file, callback) {
		var reader = new FileReader();
		reader.addEventListener("load", function(evt) {
			var data = new Uint8Array(reader.result);
			var imageData;
			switch (file.name.split(".").pop().toLowerCase()) {
				case "xb":
					imageData = loadXBin(data);
					// Update SAUCE UI fields like ANSI files do
					$("sauce-title").value = imageData.title || "";
					$("sauce-group").value = imageData.group || "";
					$("sauce-author").value = imageData.author || "";

					// Implement sequential waterfall loading for XB files to eliminate race conditions
					textArtCanvas.loadXBFileSequential(imageData, (columns, rows, data, iceColours, letterSpacing, fontName) => {
						callback(columns, rows, data, iceColours, letterSpacing, fontName);
					});
					// Trigger character brush refresh for XB files
					document.dispatchEvent(new CustomEvent("onXBFontLoaded"));
					// Then ensure everything is properly rendered after font loading completes
					textArtCanvas.redrawEntireImage();
					break;
				case "bin":
					// Clear any previous XB data to avoid palette persistence
					textArtCanvas.clearXBData(() => {
						imageData = loadBin(data);
						callback(imageData.columns, imageData.rows, imageData.data, imageData.iceColours, imageData.letterSpacing);
					});
					break;
				default:
					// Clear any previous XB data to avoid palette persistence
					textArtCanvas.clearXBData(() => {
						imageData = loadAnsi(data);
						$("sauce-title").value = imageData.title;
						$("sauce-group").value = imageData.group;
						$("sauce-author").value = imageData.author;

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
	"use strict";
	function saveFile(bytes, sauce, filename) {
		var outputBytes;
		if (sauce !== undefined) {
			outputBytes = new Uint8Array(bytes.length + sauce.length);
			outputBytes.set(sauce, bytes.length);
		} else {
			outputBytes = new Uint8Array(bytes.length);
		}
		outputBytes.set(bytes, 0);
		var downloadLink = document.createElement("A");
		if ((navigator.userAgent.indexOf("Chrome") === -1) && (navigator.userAgent.indexOf("Safari") !== -1)) {
			var base64String = "";
			for (var i = 0; i < outputBytes.length; i += 1) {
				base64String += String.fromCharCode(outputBytes[i]);
			}
			downloadLink.href = "data:application/octet-stream;base64," + btoa(base64String);
		} else {
			var blob = new Blob([outputBytes], { "type": "application/octet-stream" });
			downloadLink.href = URL.createObjectURL(blob);
		}
		downloadLink.download = filename;
		var clickEvent = document.createEvent("MouseEvent");
		clickEvent.initEvent("click", true, true);
		downloadLink.dispatchEvent(clickEvent);
		window.URL.revokeObjectURL(downloadLink.href);
	}

	function createSauce(datatype, filetype, filesize, doFlagsAndTInfoS) {
		function addText(text, maxlength, index) {
			var i;
			for (i = 0; i < maxlength; i += 1) {
				sauce[i + index] = (i < text.length) ? text.charCodeAt(i) : 0x20;
			}
		}
		var sauce = new Uint8Array(129);
		sauce[0] = 0x1A;
		sauce.set(new Uint8Array([0x53, 0x41, 0x55, 0x43, 0x45, 0x30, 0x30]), 1);
		addText($("sauce-title").value, 35, 8);
		addText($("sauce-author").value, 20, 43);
		addText($("sauce-group").value, 20, 63);
		var date = new Date();
		addText(date.getFullYear().toString(10), 4, 83);
		var month = date.getMonth() + 1;
		addText((month < 10) ? ("0" + month.toString(10)) : month.toString(10), 2, 87);
		var day = date.getDate();
		addText((day < 10) ? ("0" + day.toString(10)) : day.toString(10), 2, 89);
		sauce[91] = filesize & 0xFF;
		sauce[92] = (filesize >> 8) & 0xFF;
		sauce[93] = (filesize >> 16) & 0xFF;
		sauce[94] = filesize >> 24;
		sauce[95] = datatype;
		sauce[96] = filetype;
		var columns = textArtCanvas.getColumns();
		sauce[97] = columns & 0xFF;
		sauce[98] = columns >> 8;
		var rows = textArtCanvas.getRows();
		sauce[99] = rows & 0xFF;
		sauce[100] = rows >> 8;
		sauce[105] = 0;
		if (doFlagsAndTInfoS) {
			var flags = 0;
			if (textArtCanvas.getIceColours() === true) {
				flags += 1;
			}
			if (font.getLetterSpacing() === false) {
				flags += (1 << 1);
			} else {
				flags += (1 << 2);
			}
			sauce[106] = flags;
			var currentAppFontName = textArtCanvas.getCurrentFontName();
			var sauceFontName = Load.appToSauceFont(currentAppFontName);
			addText(sauceFontName, sauceFontName.length, 107);
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

	function encodeANSi(useUTF8) {
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
		var imageData = textArtCanvas.getImageData();
		var columns = textArtCanvas.getColumns();
		var rows = textArtCanvas.getRows();
		var output = [27, 91, 48, 109];
		var bold = false;
		var blink = false;
		var currentForeground = 7;
		var currentBackground = 0;
		var currentBold = false;
		var currentBlink = false;
		for (var row = 0; row < rows; row++) {
			var lineOutput = [];
			var lineForeground = currentForeground;
			var lineBackground = currentBackground;
			var lineBold = currentBold;
			var lineBlink = currentBlink;

			for (var col = 0; col < columns; col++) {
				var inputIndex = row * columns + col;
				var attribs = [];
				var charCode = imageData[inputIndex] >> 8;
				var foreground = imageData[inputIndex] & 15;
				var background = imageData[inputIndex] >> 4 & 15;

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
				if (foreground > 7) {
					bold = true;
					foreground = foreground - 8;
				} else {
					bold = false;
				}
				if (background > 7) {
					blink = true;
					background = background - 8;
				} else {
					blink = false;
				}
				if ((lineBold && !bold) || (lineBlink && !blink)) {
					attribs.push([48]);
					lineForeground = 7;
					lineBackground = 0;
					lineBold = false;
					lineBlink = false;
				}
				if (bold && !lineBold) {
					attribs.push([49]);
					lineBold = true;
				}
				if (blink && !lineBlink) {
					attribs.push([53]);
					lineBlink = true;
				}
				if (foreground !== lineForeground) {
					attribs.push([51, 48 + ansiColor(foreground)]);
					lineForeground = foreground;
				}
				if (background !== lineBackground) {
					attribs.push([52, 48 + ansiColor(background)]);
					lineBackground = background;
				}
				if (attribs.length) {
					lineOutput.push(27, 91);
					for (var attribIndex = 0; attribIndex < attribs.length; attribIndex += 1) {
						lineOutput = lineOutput.concat(attribs[attribIndex]);
						if (attribIndex !== attribs.length - 1) {
							lineOutput.push(59);
						} else {
							lineOutput.push(109);
						}
					}
				}
				if (useUTF8 === true) {
					getUTF8(charCode).forEach((utf8Code) => {
						lineOutput.push(utf8Code);
					});
				} else {
					lineOutput.push(charCode);
				}
			}

			if(lineOutput.length > 0){
				output = output.concat(lineOutput);
			}

			currentForeground = lineForeground;
			currentBackground = lineBackground;
			currentBold = lineBold;
			currentBlink = lineBlink;
		}

		// final color reset
		output.push(27, 91, 51, 55, 109);

		var sauce = createSauce(1, 1, output.length, true);
		saveFile(new Uint8Array(output), sauce, (useUTF8 === true) ? title.getName() + ".utf8.ans" : title.getName() + ".ans");
	}

	function ans() {
		encodeANSi(false);
	}

	function utf8() {
		encodeANSi(true);
	}

	function convert16BitArrayTo8BitArray(Uint16s) {
		var Uint8s = new Uint8Array(Uint16s.length * 2);
		for (var i = 0, j = 0; i < Uint16s.length; i++, j += 2) {
			Uint8s[j] = Uint16s[i] >> 8;
			Uint8s[j + 1] = Uint16s[i] & 255;
		}
		return Uint8s;
	}

	function bin() {
		var columns = textArtCanvas.getColumns();
		if (columns % 2 === 0) {
			var imageData = convert16BitArrayTo8BitArray(textArtCanvas.getImageData());
			var sauce = createSauce(5, columns / 2, imageData.length, true);
			saveFile(imageData, sauce, title.getName() + ".bin");
		}
	}

	function xb() {
		var imageData = convert16BitArrayTo8BitArray(textArtCanvas.getImageData());
		var columns = textArtCanvas.getColumns();
		var rows = textArtCanvas.getRows();
		var iceColours = textArtCanvas.getIceColours();
		var flags = 0;
		if (iceColours === true) {
			flags += 1 << 3;
		}
		var output = new Uint8Array(11 + imageData.length);
		output.set(new Uint8Array([
			88, 66, 73, 78, 26,
			columns & 255,
			columns >> 8,
			rows & 255,
			rows >> 8,
			font.getHeight(),
			flags
		]), 0);
		output.set(imageData, 11);
		var sauce = createSauce(6, 0, imageData.length, false);
		saveFile(output, sauce, title.getName() + ".xb");
	}

	function dataUrlToBytes(dataURL) {
		var base64Index = dataURL.indexOf(";base64,") + 8;
		var byteChars = atob(dataURL.substr(base64Index, dataURL.length - base64Index));
		var bytes = new Uint8Array(byteChars.length);
		for (var i = 0; i < bytes.length; i++) {
			bytes[i] = byteChars.charCodeAt(i);
		}
		return bytes;
	}

	function png() {
		saveFile(dataUrlToBytes(textArtCanvas.getImage().toDataURL()), undefined, title.getName() + ".png");
	}

	return {
		"ans": ans,
		"utf8": utf8,
		"bin": bin,
		"xb": xb,
		"png": png
	};
}

// Create Save module instance
const Save = saveModule();

// ES6 module exports
export { Load, Save };
export default { Load, Save };
