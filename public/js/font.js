import { createCanvas } from './state.js';

function loadImageAndGetImageData(url) {
	return new Promise((resolve, reject) => {
		const imgElement = new Image();
		imgElement.addEventListener("load", () => {
			const canvas = createCanvas(imgElement.width, imgElement.height);
			const ctx = canvas.getContext("2d");
			ctx.drawImage(imgElement, 0, 0);
			const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
			resolve(imageData);
		});
		imgElement.addEventListener("error", () => {
			reject(new Error(`Failed to load image: ${url}`));
		});
		imgElement.src = url;
	});
}

function loadFontFromXBData(fontBytes, fontWidth, fontHeight, letterSpacing, palette, callback) {
	let fontData = {};
	let fontGlyphs;
	let alphaGlyphs;
	let letterSpacingImageData;

	// Convert XB font data (byte per scanline) to the internal bit format
	function parseXBFontData(fontBytes, fontWidth, fontHeight) {
		if (!fontBytes || fontBytes.length === 0) {
			console.error("Invalid fontBytes provided to parseXBFontData");
			return null;
		}
		if (!fontWidth || fontWidth <= 0) {
			fontWidth = 8;
		}
		if (!fontHeight || fontHeight <= 0) {
			fontHeight = 16;
		}
		const expectedDataSize = fontHeight * 256;
		if (fontBytes.length < expectedDataSize) {
			console.warn("XB font data too small. Expected:", expectedDataSize, "Got:", fontBytes.length);
		}
		// XB format stores bytes directly - each byte is one scanline
		// Our internal format expects fontWidth * fontHeight * 256 / 8 bytes
		// For 8-pixel wide fonts: 8 * fontHeight * 256 / 8 = fontHeight * 256
		const internalDataSize = fontWidth * fontHeight * 256 / 8;
		const data = new Uint8Array(internalDataSize);
		for (let i = 0; i < internalDataSize && i < fontBytes.length; i++) {
			data[i] = fontBytes[i];
		}

		return {
			"width": fontWidth,
			"height": fontHeight,
			"data": data
		};
	}

	function generateNewFontGlyphs() {
		const canvas = createCanvas(fontData.width, fontData.height);
		const ctx = canvas.getContext("2d");
		const bits = new Uint8Array(fontData.width * fontData.height * 256);
		for (let i = 0, k = 0; i < fontData.width * fontData.height * 256 / 8; i += 1) {
			for (let j = 7; j >= 0; j -= 1, k += 1) {
				bits[k] = (fontData.data[i] >> j) & 1;
			}
		}
		fontGlyphs = new Array(16);
		for (let foreground = 0; foreground < 16; foreground++) {
			fontGlyphs[foreground] = new Array(16);
			for (let background = 0; background < 16; background++) {
				fontGlyphs[foreground][background] = new Array(256);
				for (let charCode = 0; charCode < 256; charCode++) {
					fontGlyphs[foreground][background][charCode] = ctx.createImageData(fontData.width, fontData.height);
					for (let i = 0, j = charCode * fontData.width * fontData.height; i < fontData.width * fontData.height; i += 1, j += 1) {
						const color = palette.getRGBAColor((bits[j] === 1) ? foreground : background);
						fontGlyphs[foreground][background][charCode].data.set(color, i * 4);
					}
				}
			}
		}
		alphaGlyphs = new Array(16);
		for (let foreground = 0; foreground < 16; foreground++) {
			alphaGlyphs[foreground] = new Array(256);
			for (let charCode = 0; charCode < 256; charCode++) {
				if (charCode === 220 || charCode === 223) {
					const imageData = ctx.createImageData(fontData.width, fontData.height);
					for (let i = 0, j = charCode * fontData.width * fontData.height; i < fontData.width * fontData.height; i += 1, j += 1) {
						if (bits[j] === 1) {
							imageData.data.set(palette.getRGBAColor(foreground), i * 4);
						}
					}
					const alphaCanvas = createCanvas(imageData.width, imageData.height);
					alphaCanvas.getContext("2d").putImageData(imageData, 0, 0);
					alphaGlyphs[foreground][charCode] = alphaCanvas;
				}
			}
		}
		letterSpacingImageData = new Array(16);
		for (let i = 0; i < 16; i++) {
			const canvas = createCanvas(1, fontData.height);
			const ctx = canvas.getContext("2d");
			const imageData = ctx.getImageData(0, 0, 1, fontData.height);
			const color = palette.getRGBAColor(i);
			for (let j = 0; j < fontData.height; j++) {
				imageData.data.set(color, j * 4);
			}
			letterSpacingImageData[i] = imageData;
		}
	}

	function getWidth() {
		if (letterSpacing === true) {
			return fontData.width + 1;
		}
		return fontData.width;
	}

	function getHeight() {
		return fontData.height;
	}

	function setLetterSpacing(newLetterSpacing) {
		if (newLetterSpacing !== letterSpacing) {
			generateNewFontGlyphs();
			letterSpacing = newLetterSpacing;
			document.dispatchEvent(new CustomEvent("onLetterSpacingChange", { "detail": letterSpacing }));
		}
	}

	function getLetterSpacing() {
		return letterSpacing;
	}

	function draw(charCode, foreground, background, ctx, x, y) {
		if (!fontGlyphs || !fontGlyphs[foreground] || !fontGlyphs[foreground][background] || !fontGlyphs[foreground][background][charCode]) {
			console.warn("XB Font glyph not available:", { foreground, background, charCode, fontGlyphsExists: !!fontGlyphs });
			return;
		}

		if (letterSpacing === true) {
			ctx.putImageData(fontGlyphs[foreground][background][charCode], x * (fontData.width + 1), y * fontData.height);
			if (charCode >= 192 && charCode <= 223) {
				ctx.putImageData(fontGlyphs[foreground][background][charCode], x * (fontData.width + 1) + 1, y * fontData.height, fontData.width - 1, 0, 1, fontData.height);
			} else {
				ctx.putImageData(letterSpacingImageData[background], x * (fontData.width + 1) + 8, y * fontData.height);
			}
		} else {
			ctx.putImageData(fontGlyphs[foreground][background][charCode], x * fontData.width, y * fontData.height);
		}
	}

	function drawWithAlpha(charCode, foreground, ctx, x, y) {
		if (letterSpacing === true) {
			ctx.drawImage(alphaGlyphs[foreground][charCode], x * (fontData.width + 1), y * fontData.height);
			if (charCode >= 192 && charCode <= 223) {
				ctx.drawImage(alphaGlyphs[foreground][charCode], fontData.width - 1, 0, 1, fontData.height, x * (fontData.width + 1) + fontData.width, y * fontData.height, 1, fontData.height);
			}
		} else {
			ctx.drawImage(alphaGlyphs[foreground][charCode], x * fontData.width, y * fontData.height);
		}
	}

	fontData = parseXBFontData(fontBytes, fontWidth, fontHeight);
	if (!fontData || !fontData.width || fontData.width <= 0 || !fontData.height || fontData.height <= 0) {
		console.error("Invalid XB font data:", fontData);
		callback(false);
		return;
	}
	generateNewFontGlyphs();
	callback(true);
	return {
		"getWidth": getWidth,
		"getHeight": getHeight,
		"setLetterSpacing": setLetterSpacing,
		"getLetterSpacing": getLetterSpacing,
		"draw": draw,
		"drawWithAlpha": drawWithAlpha,
		"redraw": generateNewFontGlyphs,
	};
}

function loadFontFromImage(fontName, letterSpacing, palette, callback) {
	let fontData = {};
	let fontGlyphs;
	let alphaGlyphs;
	let letterSpacingImageData;

	function parseFontData(imageData) {
		const fontWidth = imageData.width / 16;
		const fontHeight = imageData.height / 16;
		if ((fontWidth >= 1 && fontWidth <= 16) && (imageData.height % 16 === 0) && (fontHeight >= 1 && fontHeight <= 32)) {
			const data = new Uint8Array(fontWidth * fontHeight * 256 / 8);
			let k = 0;
			for (let value = 0; value < 256; value += 1) {
				const x = (value % 16) * fontWidth;
				const y = Math.floor(value / 16) * fontHeight;
				let pos = (y * imageData.width + x) * 4;
				let i = 0;
				while (i < fontWidth * fontHeight) {
					data[k] = data[k] << 1;
					if (imageData.data[pos] > 127) {
						data[k] += 1;
					}
					if ((i += 1) % fontWidth === 0) {
						pos += (imageData.width - fontWidth) * 4;
					}
					if (i % fontWidth === 0) {
						k += 1;
					}
					pos += 4;
				}
			}
			return {
				"width": fontWidth,
				"height": fontHeight,
				"data": data
			};
		}
		return undefined;
	}

	function generateNewFontGlyphs() {
		const canvas = createCanvas(fontData.width, fontData.height);
		const ctx = canvas.getContext("2d");
		const bits = new Uint8Array(fontData.width * fontData.height * 256);
		for (let i = 0, k = 0; i < fontData.width * fontData.height * 256 / 8; i += 1) {
			for (let j = 7; j >= 0; j -= 1, k += 1) {
				bits[k] = (fontData.data[i] >> j) & 1;
			}
		}
		fontGlyphs = new Array(16);
		for (let foreground = 0; foreground < 16; foreground++) {
			fontGlyphs[foreground] = new Array(16);
			for (let background = 0; background < 16; background++) {
				fontGlyphs[foreground][background] = new Array(256);
				for (let charCode = 0; charCode < 256; charCode++) {
					fontGlyphs[foreground][background][charCode] = ctx.createImageData(fontData.width, fontData.height);
					for (let i = 0, j = charCode * fontData.width * fontData.height; i < fontData.width * fontData.height; i += 1, j += 1) {
						const color = palette.getRGBAColor((bits[j] === 1) ? foreground : background);
						fontGlyphs[foreground][background][charCode].data.set(color, i * 4);
					}
				}
			}
		}
		alphaGlyphs = new Array(16);
		for (let foreground = 0; foreground < 16; foreground++) {
			alphaGlyphs[foreground] = new Array(256);
			for (let charCode = 0; charCode < 256; charCode++) {
				if (charCode === 220 || charCode === 223) {
					const imageData = ctx.createImageData(fontData.width, fontData.height);
					for (let i = 0, j = charCode * fontData.width * fontData.height; i < fontData.width * fontData.height; i += 1, j += 1) {
						if (bits[j] === 1) {
							imageData.data.set(palette.getRGBAColor(foreground), i * 4);
						}
					}
					const alphaCanvas = createCanvas(imageData.width, imageData.height);
					alphaCanvas.getContext("2d").putImageData(imageData, 0, 0);
					alphaGlyphs[foreground][charCode] = alphaCanvas;
				}
			}
		}
		letterSpacingImageData = new Array(16);
		for (let i = 0; i < 16; i++) {
			const canvas = createCanvas(1, fontData.height);
			const ctx = canvas.getContext("2d");
			const imageData = ctx.getImageData(0, 0, 1, fontData.height);
			const color = palette.getRGBAColor(i);
			for (let j = 0; j < fontData.height; j++) {
				imageData.data.set(color, j * 4);
			}
			letterSpacingImageData[i] = imageData;
		}
	}

	function getWidth() {
		if (letterSpacing === true) {
			return fontData.width + 1;
		}
		return fontData.width;
	}

	function getHeight() {
		return fontData.height;
	}

	function setLetterSpacing(newLetterSpacing) {
		if (newLetterSpacing !== letterSpacing) {
			generateNewFontGlyphs();
			letterSpacing = newLetterSpacing;
			document.dispatchEvent(new CustomEvent("onLetterSpacingChange", { "detail": letterSpacing }));
		}
	}

	function getLetterSpacing() {
		return letterSpacing;
	}

	function draw(charCode, foreground, background, ctx, x, y) {
		if (!fontGlyphs || !fontGlyphs[foreground] || !fontGlyphs[foreground][background] || !fontGlyphs[foreground][background][charCode]) {
			console.warn("PNG Font glyph not available:", { foreground, background, charCode, fontGlyphsExists: !!fontGlyphs });
			return;
		}

		if (letterSpacing === true) {
			ctx.putImageData(fontGlyphs[foreground][background][charCode], x * (fontData.width + 1), y * fontData.height);
			if (charCode >= 192 && charCode <= 223) {
				ctx.putImageData(fontGlyphs[foreground][background][charCode], x * (fontData.width + 1) + 1, y * fontData.height, fontData.width - 1, 0, 1, fontData.height);
			} else {
				ctx.putImageData(letterSpacingImageData[background], x * (fontData.width + 1) + 8, y * fontData.height);
			}
		} else {
			ctx.putImageData(fontGlyphs[foreground][background][charCode], x * fontData.width, y * fontData.height);
		}
	}

	function drawWithAlpha(charCode, foreground, ctx, x, y) {
		if (letterSpacing === true) {
			ctx.drawImage(alphaGlyphs[foreground][charCode], x * (fontData.width + 1), y * fontData.height);
			if (charCode >= 192 && charCode <= 223) {
				ctx.drawImage(alphaGlyphs[foreground][charCode], fontData.width - 1, 0, 1, fontData.height, x * (fontData.width + 1) + fontData.width, y * fontData.height, 1, fontData.height);
			}
		} else {
			ctx.drawImage(alphaGlyphs[foreground][charCode], x * fontData.width, y * fontData.height);
		}
	}

	// Use the Promise-based loadImageAndGetImageData internally
	loadImageAndGetImageData("ui/fonts/" + fontName + ".png")
		.then(imageData => {
			const newFontData = parseFontData(imageData);
			if (newFontData === undefined) {
				callback(false);
			} else {
				fontData = newFontData;
				generateNewFontGlyphs();
				callback(true);
			}
		})
		.catch(error => {
			console.error("Font loading failed:", error);
			callback(false);
		});

	return {
		"getWidth": getWidth,
		"getHeight": getHeight,
		"setLetterSpacing": setLetterSpacing,
		"getLetterSpacing": getLetterSpacing,
		"draw": draw,
		"drawWithAlpha": drawWithAlpha,
		"redraw": generateNewFontGlyphs,
	};
}

export {
	loadFontFromXBData,
	loadFontFromImage,
};
