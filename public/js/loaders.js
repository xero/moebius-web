// TODO: Uncomment the following import/export statements and update script tags in index.html to fully activate ES6 modules.
// ES6 module imports (commented out for script-based loading)
/*
import { ElementHelper } from './elementhelper.js';
*/

const Loaders = (function () {
	"use strict";

	const Colors = (function () {
		function rgb2xyz(rgb) {
			const xyz = rgb.map((value) => {
				value = value / 255;
				return (value > 0.04045 ? Math.pow((value + 0.055) / 1.055, 2.4) : value / 12.92) * 100;
			});
			return [
				xyz[0] * 0.4124 + xyz[1] * 0.3576 + xyz[2] * 0.1805,
				xyz[0] * 0.2126 + xyz[1] * 0.7152 + xyz[2] * 0.0722,
				xyz[0] * 0.0193 + xyz[1] * 0.1192 + xyz[2] * 0.9505
			];
		}

		function xyz2lab(xyz) {
			function process(value) {
				return value > 0.008856 ? Math.pow(value, 1 / 3) : 7.787 * value + 16 / 116;
			}
			const labX = process(xyz[0] / 95.047);
			const labY = process(xyz[1] / 100);
			const labZ = process(xyz[2] / 108.883);
			return [116 * labY - 16, 500 * (labX - labY), 200 * (labY - labZ)];
		}

		function rgb2lab(rgb) {
			return xyz2lab(rgb2xyz(rgb));
		}

		function labDeltaE(lab1, lab2) {
			return Math.sqrt(
				Math.pow(lab1[0] - lab2[0], 2) + Math.pow(lab1[1] - lab2[1], 2) + Math.pow(lab1[2] - lab2[2], 2)
			);
		}

		function rgbDeltaE(rgb1, rgb2) {
			return labDeltaE(rgb2lab(rgb1), rgb2lab(rgb2));
		}

		function labCompare(lab, palette) {
			let i, match, value, lowest;
			for (i = 0; i < palette.length; ++i) {
				value = labDeltaE(lab, palette[i]);
				if (i === 0 || value < lowest) {
					match = i;
					lowest = value;
				}
			}
			return match;
		}

		return {
			rgb2xyz: rgb2xyz,
			xyz2lab: xyz2lab,
			rgb2lab: rgb2lab,
			labDeltaE: labDeltaE,
			rgbDeltaE: rgbDeltaE,
			labCompare: labCompare
		};
	})();

	function srcToImageData(src, callback) {
		const img = new Image();
		img.onload = function () {
			const imgCanvas = ElementHelper.create("canvas", { width: img.width, height: img.height });
			const imgCtx = imgCanvas.getContext("2d");
			imgCtx.drawImage(img, 0, 0);
			const imgImageData = imgCtx.getImageData(0, 0, imgCanvas.width, imgCanvas.height);
			callback(imgImageData);
		};
		img.src = src;
	}

	function rgbaAt(imageData, x, y) {
		const pos = (y * imageData.width + x) * 4;
		if (pos >= imageData.length) {
			return [0, 0, 0, 255];
		}
		return [imageData.data[pos], imageData.data[pos + 1], imageData.data[pos + 2], imageData.data[pos + 3]];
	}

	function loadImg(src, callback, palette, codepage, noblink) {
		srcToImageData(src, function (imageData) {
			let imgX, imgY, i, paletteLab, topRGBA, botRGBA, topPal, botPal;

			for (paletteLab = [], i = 0; i < palette.COLORS.length; ++i) {
				paletteLab[i] = Colors.rgb2lab([palette.COLORS[i][0], palette.COLORS[i][1], palette.COLORS[i][2]]);
			}

			const data = new Uint8Array(Math.ceil(imageData.height / 2) * imageData.width * 3);

			for (imgY = 0, i = 0; imgY < imageData.height; imgY += 2) {
				for (imgX = 0; imgX < imageData.width; imgX += 1) {
					topRGBA = rgbaAt(imageData, imgX, imgY);
					botRGBA = rgbaAt(imageData, imgX, imgY + 1);
					if (topRGBA[3] === 0 && botRGBA[3] === 0) {
						data[i++] = codepage.NULL;
						data[i++] = 0;
						data[i++] = 0;
					} else {
						topPal = Colors.labCompare(Colors.rgb2lab(topRGBA), paletteLab);
						botPal = Colors.labCompare(Colors.rgb2lab(botRGBA), paletteLab);
						if (topPal === botPal) {
							data[i++] = codepage.FULL_BLOCK;
							data[i++] = topPal;
							data[i++] = 0;
						} else if (topPal < 8 && botPal >= 8) {
							data[i++] = codepage.LOWER_HALF_BLOCK;
							data[i++] = botPal;
							data[i++] = topPal;
						} else if ((topPal >= 8 && botPal < 8) || (topPal < 8 && botPal < 8)) {
							data[i++] = codepage.UPPER_HALF_BLOCK;
							data[i++] = topPal;
							data[i++] = botPal;
						} else if (topRGBA[3] === 0) {
							data[i++] = codepage.LOWER_HALF_BLOCK;
							data[i++] = botPal;
							if (noblink) {
								data[i++] = topPal;
							} else {
								data[i++] = topPal - 8;
							}
						} else {
							data[i++] = codepage.UPPER_HALF_BLOCK;
							data[i++] = topPal;
							if (noblink) {
								data[i++] = botPal;
							} else {
								data[i++] = botPal - 8;
							}
						}
					}
				}
			}
			callback({
				width: imageData.width,
				height: Math.ceil(imageData.height / 2),
				data: data,
				alpha: true
			});
		});
	}

	function File(bytes) {
		let pos, commentCount;

		const SAUCE_ID = new Uint8Array([0x53, 0x41, 0x55, 0x43, 0x45]);
		const COMNT_ID = new Uint8Array([0x43, 0x4f, 0x4d, 0x4e, 0x54]);

		// Returns an 8-bit byte at the current byte position, <pos>. Also advances <pos> by a single byte. Throws an error if we advance beyond the length of the array.
		this.get = function () {
			if (pos >= bytes.length) {
				throw "Unexpected end of file reached.";
			}
			return bytes[pos++];
		};

		// Same as get(), but returns a 16-bit byte. Also advances <pos> by two (8-bit) bytes.
		this.get16 = function () {
			const v = this.get();
			return v + (this.get() << 8);
		};

		// Same as get(), but returns a 32-bit byte. Also advances <pos> by four (8-bit) bytes.
		this.get32 = function () {
			let v;
			v = this.get();
			v += this.get() << 8;
			v += this.get() << 16;
			return v + (this.get() << 24);
		};

		// Exactly the same as get(), but returns a character symbol, instead of the value. e.g. 65 = "A".
		this.getC = function () {
			return String.fromCharCode(this.get());
		};

		// Returns a string of <num> characters at the current file position, and strips the trailing whitespace characters. Advances <pos> by <num> by calling getC().
		this.getS = function (num) {
			let string;
			string = "";
			while (num-- > 0) {
				string += this.getC();
			}
			return string.replace(/\s+$/, "");
		};

		// Returns "true" if, at the current <pos>, a string of characters matches <match>. Does not increment <pos>.
		this.lookahead = function (match) {
			let i;
			for (i = 0; i < match.length; ++i) {
				if (pos + i === bytes.length || bytes[pos + i] !== match[i]) {
					break;
				}
			}
			return i === match.length;
		};

		// Returns an array of <num> bytes found at the current <pos>. Also increments <pos>.
		this.read = function (num) {
			let t;
			t = pos;
			// If num is undefined, return all the bytes until the end of file.
			num = num || this.size - pos;
			while (++pos < this.size) {
				if (--num === 0) {
					break;
				}
			}
			return bytes.subarray(t, pos);
		};

		// Sets a new value for <pos>. Equivalent to seeking a file to a new position.
		this.seek = function (newPos) {
			pos = newPos;
		};

		// Returns the value found at <pos>, without incrementing <pos>.
		this.peek = function (num) {
			num = num || 0;
			return bytes[pos + num];
		};

		// Returns the the current position being read in the file, in amount of bytes. i.e. <pos>.
		this.getPos = function () {
			return pos;
		};

		// Returns true if the end of file has been reached. <this.size> is set later by the SAUCE parsing section, as it is not always the same value as the length of <bytes>. (In case there is a SAUCE record, and optional comments).
		this.eof = function () {
			return pos === this.size;
		};

		// Seek to the position we would expect to find a SAUCE record.
		pos = bytes.length - 128;
		// If we find "SAUCE".
		if (this.lookahead(SAUCE_ID)) {
			this.sauce = {};
			// Read "SAUCE".
			this.getS(5);
			// Read and store the various SAUCE values.
			this.sauce.version = this.getS(2); // String, maximum of 2 characters
			this.sauce.title = this.getS(35); // String, maximum of 35 characters
			this.sauce.author = this.getS(20); // String, maximum of 20 characters
			this.sauce.group = this.getS(20); // String, maximum of 20 characters
			this.sauce.date = this.getS(8); // String, maximum of 8 characters
			this.sauce.fileSize = this.get32(); // unsigned 32-bit
			this.sauce.dataType = this.get(); // unsigned 8-bit
			this.sauce.fileType = this.get(); // unsigned 8-bit
			this.sauce.tInfo1 = this.get16(); // unsigned 16-bit
			this.sauce.tInfo2 = this.get16(); // unsigned 16-bit
			this.sauce.tInfo3 = this.get16(); // unsigned 16-bit
			this.sauce.tInfo4 = this.get16(); // unsigned 16-bit
			// Initialize the comments array.
			this.sauce.comments = [];
			commentCount = this.get(); // unsigned 8-bit
			this.sauce.flags = this.get(); // unsigned 8-bit
			if (commentCount > 0) {
				// If we have a value for the comments amount, seek to the position we'd expect to find them...
				pos = bytes.length - 128 - commentCount * 64 - 5;
				// ... and check that we find a COMNT header.
				if (this.lookahead(COMNT_ID)) {
					// Read COMNT ...
					this.getS(5);
					// ... and push everything we find after that into our <this.sauce.comments> array, in 64-byte chunks, stripping the trailing whitespace in the getS() function.
					while (commentCount-- > 0) {
						this.sauce.comments.push(this.getS(64));
					}
				}
			}
		}
		// Seek back to the start of the file, ready for reading.
		pos = 0;

		if (this.sauce) {
			// If we have found a SAUCE record, and the fileSize field passes some basic sanity checks...
			if (this.sauce.fileSize > 0 && this.sauce.fileSize < bytes.length) {
				// Set <this.size> to the value set in SAUCE.
				this.size = this.sauce.fileSize;
			} else {
				// If it fails the sanity checks, just assume that SAUCE record can't be trusted, and set <this.size> to the position where the SAUCE record begins.
				this.size = bytes.length - 128;
			}
		} else {
			// If there is no SAUCE record, assume that everything in <bytes> relates to an image.
			this.size = bytes.length;
		}
	}

	function ScreenData(width) {
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

		this.reset = function () {
			imageData = new Uint8Array(width * 100 * 3);
			maxY = 0;
			pos = 0;
		};

		this.reset();

		function extendImageData(y) {
			let newImageData;
			newImageData = new Uint8Array(width * (y + 100) * 3 + imageData.length);
			newImageData.set(imageData, 0);
			imageData = newImageData;
		}

		this.set = function (x, y, charCode, fg, bg) {
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

		this.getData = function () {
			return imageData.subarray(0, width * (maxY + 1) * 3);
		};

		this.getHeight = function () {
			return maxY + 1;
		};

		this.rowLength = width * 3;
	}

	function loadAnsi(bytes, icecolors) {
		let escaped,
			escapeCode,
			j,
			code,
			values,
			columns,
			imageData,
			topOfScreen,
			x,
			y,
			savedX,
			savedY,
			foreground,
			background,
			bold,
			blink,
			inverse;

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
				++topOfScreen;
			} else {
				++y;
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

		columns = 80;

		imageData = new ScreenData(columns);

		function getValues() {
			return escapeCode
				.substr(1, escapeCode.length - 2)
				.split(";")
				.map((value) => {
					let parsedValue;
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
							case "A": // Up cursor.
								y = Math.max(1, y - values[0]);
								break;
							case "B": // Down cursor.
								y = Math.min(26 - 1, y + values[0]);
								break;
							case "C": // Forward cursor.
								if (x === columns) {
									newLine();
								}
								x = Math.min(columns, x + values[0]);
								break;
							case "D": // Backward cursor.
								x = Math.max(1, x - values[0]);
								break;
							case "H": // Set the cursor position by calling setPos(), first <y>, then <x>.
								if (values.length === 1) {
									setPos(1, values[0]);
								} else {
									setPos(values[1], values[0]);
								}
								break;
							case "J": // Clear screen.
								if (values[0] === 2) {
									x = 1;
									y = 1;
									imageData.reset();
								}
								break;
							case "K": // Clear until the end of line.
								for (j = x - 1; j < columns; ++j) {
									imageData.set(j, y - 1 + topOfScreen, 0, 0);
								}
								break;
							case "m": // Attributes, work through each code in turn.
								for (j = 0; j < values.length; ++j) {
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
							case "s": // Save the current <x> and <y> positions.
								savedX = x;
								savedY = y;
								break;
							case "u": // Restore the current <x> and <y> positions.
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
						if (file.peek() === 0x0a) {
							file.read(1);
							newLine();
						}
						break;
					case 26: // Ignore eof characters until the actual end-of-file, or sauce record has been reached.
						break;
					default:
						if (code === 27 && file.peek() === 0x5b) {
							escaped = true;
						} else {
							if (!inverse) {
								imageData.set(
									x - 1,
									y - 1 + topOfScreen,
									code,
									bold ? foreground + 8 : foreground,
									icecolors && blink ? background + 8 : background
								);
							} else {
								imageData.set(
									x - 1,
									y - 1 + topOfScreen,
									code,
									bold ? background + 8 : background,
									icecolors && blink ? foreground + 8 : foreground
								);
							}
							if (++x === columns + 1) {
								newLine();
							}
						}
				}
			}
		}

		return {
			width: columns,
			height: imageData.getHeight(),
			data: imageData.getData()
		};
	}

	// Note: XBin file loading is now handled by file.js loadXBin function
	// The old loadXbin function has been removed to avoid confusion

	function loadFile(file, callback, palette, codepage, noblink) {
		const extension = file.name.split(".").pop().toLowerCase();
		const reader = new FileReader();
		reader.onload = function (data) {
			switch (extension) {
				case "png":
				case "gif":
				case "jpg":
				case "jpeg":
					loadImg(data.target.result, callback, palette, codepage, noblink);
					break;
				case "xb":
					// XB files are now handled by file.js instead of loaders.js
					throw new Error("XB file loading should use file.js, not loaders.js");
				default:
					callback(loadAnsi(new Uint8Array(data.target.result)));
			}
		};
		switch (extension) {
			case "png":
			case "gif":
			case "jpg":
			case "jpeg":
				reader.readAsDataURL(file);
				break;
			default:
				reader.readAsArrayBuffer(file);
		}
	}

	return {
		loadFile: loadFile
	};
})();

// ES6 module exports
export { Loaders };
