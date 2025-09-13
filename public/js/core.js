// Global reference for sampleTool dependency
let sampleTool;
function setSampleToolDependency(tool) {
	sampleTool = tool;
}

function createPalette(RGB6Bit) {
	"use strict";
	const RGBAColors = RGB6Bit.map((RGB6Bit) => {
		return new Uint8Array(
			[
				RGB6Bit[0] << 2 | RGB6Bit[0] >> 4,
				RGB6Bit[1] << 2 | RGB6Bit[1] >> 4,
				RGB6Bit[2] << 2 | RGB6Bit[2] >> 4,
				255
			]
		);
	});
	let foreground = 7;
	let background = 0;

	function getRGBAColor(index) {
		return RGBAColors[index];
	}

	function getForegroundColor() {
		return foreground;
	}

	function getBackgroundColor() {
		return background;
	}

	function setForegroundColor(newForeground) {
		foreground = newForeground;
		document.dispatchEvent(new CustomEvent("onForegroundChange", { "detail": foreground }));
	}

	function setBackgroundColor(newBackground) {
		background = newBackground;
		document.dispatchEvent(new CustomEvent("onBackgroundChange", { "detail": background }));
	}

	return {
		"getRGBAColor": getRGBAColor,
		"getForegroundColor": getForegroundColor,
		"getBackgroundColor": getBackgroundColor,
		"setForegroundColor": setForegroundColor,
		"setBackgroundColor": setBackgroundColor
	};
}

function createDefaultPalette() {
	"use strict";
	return createPalette([
		[0, 0, 0],
		[0, 0, 42],
		[0, 42, 0],
		[0, 42, 42],
		[42, 0, 0],
		[42, 0, 42],
		[42, 21, 0],
		[42, 42, 42],
		[21, 21, 21],
		[21, 21, 63],
		[21, 63, 21],
		[21, 63, 63],
		[63, 21, 21],
		[63, 21, 63],
		[63, 63, 21],
		[63, 63, 63]
	]);
}

function createPalettePreview(canvas, palette) {
	"use strict";
	let imageData;
	let paletteObj = palette;

	function newPalette(palette) {
		paletteObj = palette;
		updatePreview();
	}

	function updatePreview() {
		const ctx = canvas.getContext("2d");
		const w = canvas.width, h = canvas.height;
		const squareSize = Math.floor(Math.min(w, h) * 0.6);
		const offset = Math.floor(squareSize * 0.66) + 1;
		ctx.clearRect(0, 0, w, h);
		ctx.fillStyle = `rgba(${paletteObj.getRGBAColor(paletteObj.getBackgroundColor()).join(",")})`;
		ctx.fillRect(offset, 0, squareSize, squareSize);
		ctx.fillStyle = `rgba(${paletteObj.getRGBAColor(paletteObj.getForegroundColor()).join(",")})`;
		ctx.fillRect(0, offset, squareSize, squareSize);
	}

	imageData = canvas.getContext("2d").createImageData(canvas.width, canvas.height);
	updatePreview();
	document.addEventListener("onForegroundChange", updatePreview);
	document.addEventListener("onBackgroundChange", updatePreview);

	return {
		"newPalette": newPalette,
		"setForegroundColor": updatePreview,
		"setBackgroundColor": updatePreview
	};
}

function createPalettePicker(canvas, palette) {
	"use strict";
	const imageData = [];
	let mousedowntime;
	let paletteObj = palette;

	function newPalette(palette) {
		paletteObj = palette;
		updatePalette();
	}

	function updateColor(index) {
		const color = paletteObj.getRGBAColor(index);
		for (let y = 0, i = 0; y < imageData[index].height; y++) {
			for (let x = 0; x < imageData[index].width; x++, i += 4) {
				imageData[index].data.set(color, i);
			}
		}
		canvas.getContext("2d").putImageData(imageData[index], (index > 7) ? (canvas.width / 2) : 0, (index % 8) * imageData[index].height);
	}

	function updatePalette() {
		for (let i = 0; i < 16; i++) {
			updateColor(i);
		}
	}

	function pressStart(_) {
		mousedowntime = new Date().getTime();
	}

	function touchEnd(evt) {
		const rect = canvas.getBoundingClientRect();
		const x = Math.floor((evt.touches[0].pageX - rect.left) / (canvas.width / 2));
		const y = Math.floor((evt.touches[0].pageY - rect.top) / (canvas.height / 8));
		const colorIndex = y + ((x === 0) ? 0 : 8);
		paletteObj.setForegroundColor(colorIndex);
	}

	function mouseEnd(evt) {
		const rect = canvas.getBoundingClientRect();
		const x = Math.floor((evt.clientX - rect.left) / (canvas.width / 2));
		const y = Math.floor((evt.clientY - rect.top) / (canvas.height / 8));
		const colorIndex = y + ((x === 0) ? 0 : 8);
		if (evt.altKey === false && evt.ctrlKey === false) {
			paletteObj.setForegroundColor(colorIndex);
		} else {
			paletteObj.setBackgroundColor(colorIndex);
		}
	}

	for (let i = 0; i < 16; i++) {
		imageData[i] = canvas.getContext("2d").createImageData(canvas.width / 2, canvas.height / 8);
	}

	function keydown(evt) {
		const keyCode = (evt.keyCode || evt.which);
		// {ctrl,alt} + digits
		if (keyCode >= 48 && keyCode <= 55) {
			const num = keyCode - 48;
			if (evt.ctrlKey === true) {
				evt.preventDefault();
				if (paletteObj.getForegroundColor() === num) {
					paletteObj.setForegroundColor(num + 8);
				} else {
					paletteObj.setForegroundColor(num);
				}
			} else if (evt.altKey) {
				evt.preventDefault();
				if (paletteObj.getBackgroundColor() === num) {
					paletteObj.setBackgroundColor(num + 8);
				} else {
					paletteObj.setBackgroundColor(num);
				}
			}
			// ctrl + arrows
		} else if (keyCode >= 37 && keyCode <= 40 && evt.ctrlKey === true) {
			evt.preventDefault();
			switch (keyCode) {
				case 37:
					var color = paletteObj.getBackgroundColor();
					color = (color === 0) ? 15 : (color - 1);
					paletteObj.setBackgroundColor(color);
					break;
				case 38:
					var color = paletteObj.getForegroundColor();
					color = (color === 0) ? 15 : (color - 1);
					paletteObj.setForegroundColor(color);
					break;
				case 39:
					var color = paletteObj.getBackgroundColor();
					color = (color === 15) ? 0 : (color + 1);
					paletteObj.setBackgroundColor(color);
					break;
				case 40:
					var color = paletteObj.getForegroundColor();
					color = (color === 15) ? 0 : (color + 1);
					paletteObj.setForegroundColor(color);
					break;
				default:
					break;
			}
		}
	}

	updatePalette();
	canvas.addEventListener("touchstart", pressStart);
	canvas.addEventListener("touchend", touchEnd);
	canvas.addEventListener("touchcancel", touchEnd);
	canvas.addEventListener("mouseup", mouseEnd);
	canvas.addEventListener("contextmenu", (evt) => {
		evt.preventDefault();
	});
	document.addEventListener("keydown", keydown);

	return {
		"newPalette": newPalette,
		"updatePalette": updatePalette
	};
}

function loadImageAndGetImageData(url) {
	"use strict";
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
	"use strict";
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
		var canvas = createCanvas(fontData.width, fontData.height);
		var ctx = canvas.getContext("2d");
		const bits = new Uint8Array(fontData.width * fontData.height * 256);
		for (var i = 0, k = 0; i < fontData.width * fontData.height * 256 / 8; i += 1) {
			for (var j = 7; j >= 0; j -= 1, k += 1) {
				bits[k] = (fontData.data[i] >> j) & 1;
			}
		}
		fontGlyphs = new Array(16);
		for (var foreground = 0; foreground < 16; foreground++) {
			fontGlyphs[foreground] = new Array(16);
			for (let background = 0; background < 16; background++) {
				fontGlyphs[foreground][background] = new Array(256);
				for (var charCode = 0; charCode < 256; charCode++) {
					fontGlyphs[foreground][background][charCode] = ctx.createImageData(fontData.width, fontData.height);
					for (var i = 0, j = charCode * fontData.width * fontData.height; i < fontData.width * fontData.height; i += 1, j += 1) {
						var color = palette.getRGBAColor((bits[j] === 1) ? foreground : background);
						fontGlyphs[foreground][background][charCode].data.set(color, i * 4);
					}
				}
			}
		}
		alphaGlyphs = new Array(16);
		for (var foreground = 0; foreground < 16; foreground++) {
			alphaGlyphs[foreground] = new Array(256);
			for (var charCode = 0; charCode < 256; charCode++) {
				if (charCode === 220 || charCode === 223) {
					var imageData = ctx.createImageData(fontData.width, fontData.height);
					for (var i = 0, j = charCode * fontData.width * fontData.height; i < fontData.width * fontData.height; i += 1, j += 1) {
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
		for (var i = 0; i < 16; i++) {
			var canvas = createCanvas(1, fontData.height);
			var ctx = canvas.getContext("2d");
			var imageData = ctx.getImageData(0, 0, 1, fontData.height);
			var color = palette.getRGBAColor(i);
			for (var j = 0; j < fontData.height; j++) {
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
		"drawWithAlpha": drawWithAlpha
	};
}

function loadFontFromImage(fontName, letterSpacing, palette, callback) {
	"use strict";
	let fontData = {};
	let fontGlyphs;
	let alphaGlyphs;
	let letterSpacingImageData;

	function parseFontData(imageData) {
		const fontWidth = imageData.width / 16;
		const fontHeight = imageData.height / 16;
		if ((fontWidth === 8) && (imageData.height % 16 === 0) && (fontHeight >= 1 && fontHeight <= 32)) {
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
						pos += (imageData.width - 8) * 4;
					}
					if (i % 8 === 0) {
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
		var canvas = createCanvas(fontData.width, fontData.height);
		var ctx = canvas.getContext("2d");
		const bits = new Uint8Array(fontData.width * fontData.height * 256);
		for (var i = 0, k = 0; i < fontData.width * fontData.height * 256 / 8; i += 1) {
			for (var j = 7; j >= 0; j -= 1, k += 1) {
				bits[k] = (fontData.data[i] >> j) & 1;
			}
		}
		fontGlyphs = new Array(16);
		for (var foreground = 0; foreground < 16; foreground++) {
			fontGlyphs[foreground] = new Array(16);
			for (let background = 0; background < 16; background++) {
				fontGlyphs[foreground][background] = new Array(256);
				for (var charCode = 0; charCode < 256; charCode++) {
					fontGlyphs[foreground][background][charCode] = ctx.createImageData(fontData.width, fontData.height);
					for (var i = 0, j = charCode * fontData.width * fontData.height; i < fontData.width * fontData.height; i += 1, j += 1) {
						var color = palette.getRGBAColor((bits[j] === 1) ? foreground : background);
						fontGlyphs[foreground][background][charCode].data.set(color, i * 4);
					}
				}
			}
		}
		alphaGlyphs = new Array(16);
		for (var foreground = 0; foreground < 16; foreground++) {
			alphaGlyphs[foreground] = new Array(256);
			for (var charCode = 0; charCode < 256; charCode++) {
				if (charCode === 220 || charCode === 223) {
					var imageData = ctx.createImageData(fontData.width, fontData.height);
					for (var i = 0, j = charCode * fontData.width * fontData.height; i < fontData.width * fontData.height; i += 1, j += 1) {
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
		for (var i = 0; i < 16; i++) {
			var canvas = createCanvas(1, fontData.height);
			var ctx = canvas.getContext("2d");
			var imageData = ctx.getImageData(0, 0, 1, fontData.height);
			var color = palette.getRGBAColor(i);
			for (var j = 0; j < fontData.height; j++) {
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

	return {
		"getWidth": getWidth,
		"getHeight": getHeight,
		"setLetterSpacing": setLetterSpacing,
		"getLetterSpacing": getLetterSpacing,
		"draw": draw,
		"drawWithAlpha": drawWithAlpha
	};
}

function createTextArtCanvas(canvasContainer, callback) {
	"use strict";
	let columns = 80,
		rows = 25,
		iceColors = false,
		imageData = new Uint16Array(columns * rows),
		canvases,
		ctxs,
		offBlinkCanvases,
		onBlinkCanvases,
		offBlinkCtxs,
		onBlinkCtxs,
		blinkTimer,
		blinkOn = false,
		mouseButton = false,
		currentUndo = [],
		undoBuffer = [],
		redoBuffer = [],
		drawHistory = [],
		mirrorMode = false,
		currentFontName = "CP437 8x16",
		dirtyRegions = [],
		processingDirtyRegions = false;

	function updateBeforeBlinkFlip(x, y) {
		const dataIndex = y * columns + x;
		const contextIndex = Math.floor(y / 25);
		const contextY = y % 25;
		const charCode = imageData[dataIndex] >> 8;
		let background = (imageData[dataIndex] >> 4) & 15;
		const foreground = imageData[dataIndex] & 15;
		const shifted = background >= 8;
		if (shifted === true) {
			background -= 8;
		}
		if (blinkOn === true && shifted) {
			font.draw(charCode, background, background, ctxs[contextIndex], x, contextY);
		} else {
			font.draw(charCode, foreground, background, ctxs[contextIndex], x, contextY);
		}
	}

	function enqueueDirtyRegion(x, y, w, h) {
		// Validate and clamp region to canvas bounds
		if (x < 0) {
			w += x;
			x = 0;
		}
		if (y < 0) {
			h += y;
			y = 0;
		}
		// Invalid or empty region
		if (x >= columns || y >= rows || w <= 0 || h <= 0) {
			return;
		}
		if (x + w > columns) {
			w = columns - x;
		}
		if (y + h > rows) {
			h = rows - y;
		}
		dirtyRegions.push({ x: x, y: y, w: w, h: h });
	}

	function enqueueDirtyCell(x, y) {
		enqueueDirtyRegion(x, y, 1, 1);
	}

	// merge overlapping and adjacent regions
	// This is a basic implementation - could be optimized further with spatial indexing
	function coalesceRegions(regions) {
		if (regions.length <= 1) return regions;
		const coalesced = [];
		const sorted = regions.slice().sort((a, b) => {
			if (a.y !== b.y) return a.y - b.y;
			return a.x - b.x;
		});

		for (let i = 0; i < sorted.length; i++) {
			const current = sorted[i];
			let merged = false;

			// Try to merge with existing coalesced regions
			for (let j = 0; j < coalesced.length; j++) {
				const existing = coalesced[j];

				// Check if regions overlap or are adjacent
				const canMergeX = (current.x <= existing.x + existing.w) && (existing.x <= current.x + current.w);
				const canMergeY = (current.y <= existing.y + existing.h) && (existing.y <= current.y + current.h);

				if (canMergeX && canMergeY) {
					// Merge regions
					const newX = Math.min(existing.x, current.x);
					const newY = Math.min(existing.y, current.y);
					const newW = Math.max(existing.x + existing.w, current.x + current.w) - newX;
					const newH = Math.max(existing.y + existing.h, current.y + current.h) - newY;
					coalesced[j] = { x: newX, y: newY, w: newW, h: newH };
					merged = true;
					break;
				}
			}
			if (!merged) {
				coalesced.push(current);
			}
		}

		// If we reduced the number of regions, try coalescing again
		if (coalesced.length < regions.length && coalesced.length > 1) {
			return coalesceRegions(coalesced);
		}

		return coalesced;
	}

	function drawRegion(x, y, w, h) {
		// Validate and clamp region to canvas bounds
		if (x < 0) {
			w += x;
			x = 0;
		}
		if (y < 0) {
			h += y;
			y = 0;
		}
		// Invalid or empty region, no-op
		if (x >= columns || y >= rows || w <= 0 || h <= 0) {
			return;
		}
		if (x + w > columns) {
			w = columns - x;
		}
		if (y + h > rows) {
			h = rows - y;
		}

		// Redraw all cells in the region
		for (let regionY = y; regionY < y + h; regionY++) {
			for (let regionX = x; regionX < x + w; regionX++) {
				const index = regionY * columns + regionX;
				redrawGlyph(index, regionX, regionY);
			}
		}
	}

	function processDirtyRegions() {
		if (processingDirtyRegions || dirtyRegions.length === 0) {
			return;
		}

		processingDirtyRegions = true;

		// Coalesce regions for better performance
		const coalescedRegions = coalesceRegions(dirtyRegions);
		dirtyRegions = []; // Clear the queue

		// Draw all coalesced regions
		for (let i = 0; i < coalescedRegions.length; i++) {
			const region = coalescedRegions[i];
			drawRegion(region.x, region.y, region.w, region.h);
		}

		processingDirtyRegions = false;
	}


	function redrawGlyph(index, x, y) {
		const contextIndex = Math.floor(y / 25);
		const contextY = y % 25;
		const charCode = imageData[index] >> 8;
		let background = (imageData[index] >> 4) & 15;
		const foreground = imageData[index] & 15;
		if (iceColors === true) {
			font.draw(charCode, foreground, background, ctxs[contextIndex], x, contextY);
		} else {
			if (background >= 8) {
				background -= 8;
				font.draw(charCode, foreground, background, offBlinkCtxs[contextIndex], x, contextY);
				font.draw(charCode, background, background, onBlinkCtxs[contextIndex], x, contextY);
			} else {
				font.draw(charCode, foreground, background, offBlinkCtxs[contextIndex], x, contextY);
				font.draw(charCode, foreground, background, onBlinkCtxs[contextIndex], x, contextY);
			}
		}
	}

	function redrawEntireImage() {
		dirtyRegions = [];
		drawRegion(0, 0, columns, rows);
	}

	let blinkStop = false;

	function blink() {
		if (blinkOn === false) {
			blinkOn = true;
			for (var i = 0; i < ctxs.length; i++) {
				ctxs[i].drawImage(onBlinkCanvases[i], 0, 0);
			}
		} else {
			blinkOn = false;
			for (var i = 0; i < ctxs.length; i++) {
				ctxs[i].drawImage(offBlinkCanvases[i], 0, 0);
			}
		}
	}

	async function updateBlinkTimer() {
		blinkStop = false;
		if (!iceColors) {
			blinkOn = false;
			while (!blinkStop) {
				blink();
				await new Promise(resolve => setTimeout(resolve, 500));
			}
		}
	}

	function stopBlinkTimer() {
		blinkStop = true;
	}

	function createCanvases() {
		if (canvases !== undefined) {
			canvases.forEach((canvas) => {
				canvasContainer.removeChild(canvas);
			});
		}
		canvases = [];
		offBlinkCanvases = [];
		offBlinkCtxs = [];
		onBlinkCanvases = [];
		onBlinkCtxs = [];
		ctxs = [];
		let fontWidth = font.getWidth();
		let fontHeight = font.getHeight();

		if (!fontWidth || fontWidth <= 0) {
			console.warn("Invalid font width detected, falling back to 8px");
			fontWidth = 8;
		}
		if (!fontHeight || fontHeight <= 0) {
			console.warn("Invalid font height detected, falling back to 16px");
			fontHeight = 16;
		}

		const canvasWidth = fontWidth * columns;
		var canvasHeight = fontHeight * 25;
		for (var i = 0; i < Math.floor(rows / 25); i++) {
			var canvas = createCanvas(canvasWidth, canvasHeight);
			canvases.push(canvas);
			ctxs.push(canvas.getContext("2d"));
			var onBlinkCanvas = createCanvas(canvasWidth, canvasHeight);
			onBlinkCanvases.push(onBlinkCanvas);
			onBlinkCtxs.push(onBlinkCanvas.getContext("2d"));
			var offBlinkCanvas = createCanvas(canvasWidth, canvasHeight);
			offBlinkCanvases.push(offBlinkCanvas);
			offBlinkCtxs.push(offBlinkCanvas.getContext("2d"));
		}
		var canvasHeight = fontHeight * (rows % 25);
		if (rows % 25 !== 0) {
			var canvas = createCanvas(canvasWidth, canvasHeight);
			canvases.push(canvas);
			ctxs.push(canvas.getContext("2d"));
			var onBlinkCanvas = createCanvas(canvasWidth, canvasHeight);
			onBlinkCanvases.push(onBlinkCanvas);
			onBlinkCtxs.push(onBlinkCanvas.getContext("2d"));
			var offBlinkCanvas = createCanvas(canvasWidth, canvasHeight);
			offBlinkCanvases.push(offBlinkCanvas);
			offBlinkCtxs.push(offBlinkCanvas.getContext("2d"));
		}
		canvasContainer.style.width = canvasWidth + "px";
		for (var i = 0; i < canvases.length; i++) {
			canvasContainer.appendChild(canvases[i]);
		}
		stopBlinkTimer();
		redrawEntireImage();
		if (iceColors === false) {
			updateBlinkTimer();
		}
	}

	function updateTimer() {
		stopBlinkTimer();
		if (iceColors === false) {
			blinkOn = false;
			updateBlinkTimer();
		}
	}

	function setFont(fontName, callback) {
		console.log("setFont called with:", fontName, "Current font:", currentFontName);

		if (fontName === "XBIN" && xbFontData) {
			console.log("Loading XBIN font with embedded data");
			font = loadFontFromXBData(xbFontData.bytes, xbFontData.width, xbFontData.height, font.getLetterSpacing(), palette, (success) => {
				if (success) {
					currentFontName = fontName;
					createCanvases();
					redrawEntireImage();
					document.dispatchEvent(new CustomEvent("onFontChange", { "detail": fontName }));
					if (callback) { callback(); }
				} else {
					console.warn("XB font loading failed, falling back to CP437 8x16");
					const fallbackFont = "CP437 8x16";
					font = loadFontFromImage(fallbackFont, font.getLetterSpacing(), palette, (fallbackSuccess) => {
						if (fallbackSuccess) {
							currentFontName = fallbackFont;
						}
						createCanvases();
						redrawEntireImage();
						document.dispatchEvent(new CustomEvent("onFontChange", { "detail": fallbackFont }));
						if (callback) { callback(); }
					});
				}
			});
		} else if (fontName === "XBIN" && !xbFontData) {
			console.log("XBIN selected but no embedded font data available, falling back to CP437 8x16");
			const fallbackFont = "CP437 8x16";
			font = loadFontFromImage(fallbackFont, font.getLetterSpacing(), palette, (success) => {
				if (success) {
					currentFontName = fallbackFont;
				}
				createCanvases();
				redrawEntireImage();
				document.dispatchEvent(new CustomEvent("onFontChange", { "detail": fallbackFont }));
				if (callback) { callback(); }
			});
		} else {
			console.log("Loading regular font:", fontName);
			font = loadFontFromImage(fontName, font.getLetterSpacing(), palette, (success) => {
				if (success) {
					currentFontName = fontName;
				}
				createCanvases();
				redrawEntireImage();
				document.dispatchEvent(new CustomEvent("onFontChange", { "detail": fontName }));
				if (callback) { callback(); }
			});
		}
	}

	function resize(newColumnValue, newRowValue) {
		if ((newColumnValue !== columns || newRowValue !== rows) && (newColumnValue > 0 && newRowValue > 0)) {
			clearUndos();
			const maxColumn = (columns > newColumnValue) ? newColumnValue : columns;
			const maxRow = (rows > newRowValue) ? newRowValue : rows;
			const newImageData = new Uint16Array(newColumnValue * newRowValue);
			for (let y = 0; y < maxRow; y++) {
				for (let x = 0; x < maxColumn; x++) {
					newImageData[y * newColumnValue + x] = imageData[y * columns + x];
				}
			}
			imageData = newImageData;
			columns = newColumnValue;
			rows = newRowValue;
			createCanvases();
			document.dispatchEvent(new CustomEvent("onTextCanvasSizeChange", { "detail": { "columns": columns, "rows": rows } }));
		}
	}

	function getIceColors() {
		return iceColors;
	}

	function setIceColors(newIceColors) {
		if (iceColors !== newIceColors) {
			iceColors = newIceColors;
			updateTimer();
			redrawEntireImage();
		}
	}

	function onLetterSpacingChange(_letterSpacing) {
		createCanvases();
	}

	function getImage() {
		const completeCanvas = createCanvas(font.getWidth() * columns, font.getHeight() * rows);
		let y = 0;
		const ctx = completeCanvas.getContext("2d");
		((iceColors === true) ? canvases : offBlinkCanvases).forEach((canvas) => {
			ctx.drawImage(canvas, 0, y);
			y += canvas.height;
		});
		return completeCanvas;
	}

	function getImageData() {
		return imageData;
	}

	function setImageData(newColumnValue, newRowValue, newImageData, newIceColors) {
		clearUndos();
		columns = newColumnValue;
		rows = newRowValue;
		imageData = newImageData;
		if (iceColors !== newIceColors) {
			iceColors = newIceColors;
			updateTimer();
		}
		createCanvases();
		redrawEntireImage();
		document.dispatchEvent(new CustomEvent("onOpenedFile"));
	}

	function getColumns() {
		return columns;
	}

	function getRows() {
		return rows;
	}

	function clearUndos() {
		currentUndo = [];
		undoBuffer = [];
		redoBuffer = [];
	}

	function clear() {
		$('artwork-title').value='';
		clearUndos();
		imageData = new Uint16Array(columns * rows);
		redrawEntireImage();
	}
	var xbFontData = null;
	let xbPaletteData = null;

	window.palette = createDefaultPalette();
	palette = window.palette;
	window.font = loadFontFromImage("CP437 8x16", false, palette, (_success) => {
		font = window.font;
		createCanvases();
		updateTimer();
		callback();
	});

	function getMirrorX(x) {
		if (columns % 2 === 0) {
			// Even columns: split 50/50
			if (x < columns / 2) {
				return columns - 1 - x;
			} else {
				return columns - 1 - x;
			}
		} else {
			// Odd columns
			const center = Math.floor(columns / 2);
			if (x === center) {
				return -1; // Don't mirror center column
			} else if (x < center) {
				return columns - 1 - x;
			} else {
				return columns - 1 - x;
			}
		}
	}

	// Transform characters for horizontal mirroring
	function getMirrorCharCode(charCode) {
		switch (charCode) {
			case 221: // LEFT_HALF_BLOCK
				return 222; // RIGHT_HALF_BLOCK
			case 222: // RIGHT_HALF_BLOCK
				return 221; // LEFT_HALF_BLOCK
			// Upper and lower half blocks stay the same for horizontal mirroring
			case 223: // UPPER_HALF_BLOCK
			case 220: // LOWER_HALF_BLOCK
			default:
				return charCode;
		}
	}

	function setMirrorMode(enabled) {
		mirrorMode = enabled;
	}

	function getMirrorMode() {
		return mirrorMode;
	}

	function draw(index, charCode, foreground, background, x, y) {
		currentUndo.push([index, imageData[index], x, y]);
		imageData[index] = (charCode << 8) + (background << 4) + foreground;
		drawHistory.push((index << 16) + imageData[index]);
	}

	function patchBufferAndEnqueueDirty(index, charCode, foreground, background, x, y, addToUndo = true) {
		if (addToUndo) {
			currentUndo.push([index, imageData[index], x, y]);
		}
		imageData[index] = (charCode << 8) + (background << 4) + foreground;
		if (addToUndo) {
			drawHistory.push((index << 16) + imageData[index]);
		}
		enqueueDirtyCell(x, y);

		if (iceColors === false) {
			updateBeforeBlinkFlip(x, y);
		}
	}

	function getBlock(x, y) {
		const index = y * columns + x;
		const charCode = imageData[index] >> 8;
		const foregroundColor = imageData[index] & 15;
		const backgroundColor = (imageData[index] >> 4) & 15;
		return {
			"x": x,
			"y": y,
			"charCode": charCode,
			"foregroundColor": foregroundColor,
			"backgroundColor": backgroundColor
		};
	}

	function getHalfBlock(x, y) {
		const textY = Math.floor(y / 2);
		const index = textY * columns + x;
		const foreground = imageData[index] & 15;
		const background = (imageData[index] >> 4) & 15;
		let upperBlockColor = 0;
		let lowerBlockColor = 0;
		let isBlocky = false;
		let isVerticalBlocky = false;
		let leftBlockColor;
		let rightBlockColor;
		switch (imageData[index] >> 8) {
			case 0:
			case 32:
			case 255:
				upperBlockColor = background;
				lowerBlockColor = background;
				isBlocky = true;
				break;
			case 220:
				upperBlockColor = background;
				lowerBlockColor = foreground;
				isBlocky = true;
				break;
			case 221:
				isVerticalBlocky = true;
				leftBlockColor = foreground;
				rightBlockColor = background;
				break;
			case 222:
				isVerticalBlocky = true;
				leftBlockColor = background;
				rightBlockColor = foreground;
				break;
			case 223:
				upperBlockColor = foreground;
				lowerBlockColor = background;
				isBlocky = true;
				break;
			case 219:
				upperBlockColor = foreground;
				lowerBlockColor = foreground;
				isBlocky = true;
				break;
			default:
				if (foreground === background) {
					isBlocky = true;
					upperBlockColor = foreground;
					lowerBlockColor = foreground;
				} else {
					isBlocky = false;
				}
		}
		return {
			"x": x,
			"y": y,
			"textY": textY,
			"isBlocky": isBlocky,
			"upperBlockColor": upperBlockColor,
			"lowerBlockColor": lowerBlockColor,
			"halfBlockY": y % 2,
			"isVerticalBlocky": isVerticalBlocky,
			"leftBlockColor": leftBlockColor,
			"rightBlockColor": rightBlockColor
		};
	}

	function drawHalfBlock(index, foreground, x, y, textY) {
		const halfBlockY = y % 2;
		const charCode = imageData[index] >> 8;
		const currentForeground = imageData[index] & 15;
		const currentBackground = (imageData[index] >> 4) & 15;

		let newCharCode, newForeground, newBackground;
		let shouldUpdate = false;

		if (charCode === 219) {
			if (currentForeground !== foreground) {
				if (halfBlockY === 0) {
					newCharCode = 223;
					newForeground = foreground;
					newBackground = currentForeground;
					shouldUpdate = true;
				} else {
					newCharCode = 220;
					newForeground = foreground;
					newBackground = currentForeground;
					shouldUpdate = true;
				}
			}
		} else if (charCode !== 220 && charCode !== 223) {
			if (halfBlockY === 0) {
				newCharCode = 223;
				newForeground = foreground;
				newBackground = currentBackground;
				shouldUpdate = true;
			} else {
				newCharCode = 220;
				newForeground = foreground;
				newBackground = currentBackground;
				shouldUpdate = true;
			}
		} else {
			if (halfBlockY === 0) {
				if (charCode === 223) {
					if (currentBackground === foreground) {
						newCharCode = 219;
						newForeground = foreground;
						newBackground = 0;
						shouldUpdate = true;
					} else {
						newCharCode = 223;
						newForeground = foreground;
						newBackground = currentBackground;
						shouldUpdate = true;
					}
				} else if (currentForeground === foreground) {
					newCharCode = 219;
					newForeground = foreground;
					newBackground = 0;
					shouldUpdate = true;
				} else {
					newCharCode = 223;
					newForeground = foreground;
					newBackground = currentForeground;
					shouldUpdate = true;
				}
			} else {
				if (charCode === 220) {
					if (currentBackground === foreground) {
						newCharCode = 219;
						newForeground = foreground;
						newBackground = 0;
						shouldUpdate = true;
					} else {
						newCharCode = 220;
						newForeground = foreground;
						newBackground = currentBackground;
						shouldUpdate = true;
					}
				} else if (currentForeground === foreground) {
					newCharCode = 219;
					newForeground = foreground;
					newBackground = 0;
					shouldUpdate = true;
				} else {
					newCharCode = 220;
					newForeground = foreground;
					newBackground = currentForeground;
					shouldUpdate = true;
				}
			}
		}

		if (shouldUpdate) {
			// Use unified buffer patching (caller function handles undo)
			patchBufferAndEnqueueDirty(index, newCharCode, newForeground, newBackground, x, textY, false);
		}
	}

	document.addEventListener("onLetterSpacingChange", onLetterSpacingChange);

	function getXYCoords(clientX, clientY, callback) {
		const rect = canvasContainer.getBoundingClientRect();
		const x = Math.floor((clientX - rect.left) / font.getWidth());
		const y = Math.floor((clientY - rect.top) / font.getHeight());
		const halfBlockY = Math.floor((clientY - rect.top) / font.getHeight() * 2);
		callback(x, y, halfBlockY);
	}

	canvasContainer.addEventListener("touchstart", (evt) => {
		if (evt.touches.length == 2 && evt.changedTouches.length == 2) {
			evt.preventDefault();
			undo();
		} else if (evt.touches.length > 2 && evt.changedTouches.length > 2) {
			evt.preventDefault();
			redo();
		} else {

			mouseButton = true;
			getXYCoords(evt.touches[0].pageX, evt.touches[0].pageY, (x, y, halfBlockY) => {
				if (evt.altKey === true) {
					sampleTool.sample(x, halfBlockY);
				} else {
					document.dispatchEvent(new CustomEvent("onTextCanvasDown", { "detail": { "x": x, "y": y, "halfBlockY": halfBlockY, "leftMouseButton": (evt.button === 0 && evt.ctrlKey !== true), "rightMouseButton": (evt.button === 2 || evt.ctrlKey === true) } }));
				}
			});
		}
	});

	canvasContainer.addEventListener("mousedown", (evt) => {
		mouseButton = true;
		getXYCoords(evt.clientX, evt.clientY, (x, y, halfBlockY) => {
			if (evt.altKey === true) {
				sampleTool.sample(x, halfBlockY);
			} else {
				document.dispatchEvent(new CustomEvent("onTextCanvasDown", { "detail": { "x": x, "y": y, "halfBlockY": halfBlockY, "leftMouseButton": (evt.button === 0 && evt.ctrlKey !== true), "rightMouseButton": (evt.button === 2 || evt.ctrlKey === true) } }));
			}
		});
	});

	canvasContainer.addEventListener("contextmenu", (evt) => {
		evt.preventDefault();
	});

	canvasContainer.addEventListener("touchmove", (evt) => {
		evt.preventDefault();
		getXYCoords(evt.touches[0].pageX, evt.touches[0].pageY, (x, y, halfBlockY) => {
			document.dispatchEvent(new CustomEvent("onTextCanvasDrag", { "detail": { "x": x, "y": y, "halfBlockY": halfBlockY, "leftMouseButton": (evt.button === 0 && evt.ctrlKey !== true), "rightMouseButton": (evt.button === 2 || evt.ctrlKey === true) } }));
		});
	});

	canvasContainer.addEventListener("mousemove", (evt) => {
		evt.preventDefault();
		if (mouseButton === true) {
			getXYCoords(evt.clientX, evt.clientY, (x, y, halfBlockY) => {
				document.dispatchEvent(new CustomEvent("onTextCanvasDrag", { "detail": { "x": x, "y": y, "halfBlockY": halfBlockY, "leftMouseButton": (evt.button === 0 && evt.ctrlKey !== true), "rightMouseButton": (evt.button === 2 || evt.ctrlKey === true) } }));
			});
		}
	});

	canvasContainer.addEventListener("touchend", (evt) => {
		evt.preventDefault();
		mouseButton = false;
		document.dispatchEvent(new CustomEvent("onTextCanvasUp", {}));
	});

	canvasContainer.addEventListener("mouseup", (evt) => {
		evt.preventDefault();
		if (mouseButton === true) {
			mouseButton = false;
			document.dispatchEvent(new CustomEvent("onTextCanvasUp", {}));
		}
	});

	canvasContainer.addEventListener("touchenter", (evt) => {
		evt.preventDefault();
		document.dispatchEvent(new CustomEvent("onTextCanvasUp", {}));
	});

	canvasContainer.addEventListener("mouseenter", (evt) => {
		evt.preventDefault();
		if (mouseButton === true && (evt.which === 0 || evt.buttons === 0)) {
			mouseButton = false;
			document.dispatchEvent(new CustomEvent("onTextCanvasUp", {}));
		}
	});

	function sendDrawHistory() {
		if (worker && worker.draw) {
			worker.draw(drawHistory);
		}
		drawHistory = [];
	}

	function undo() {
		if (currentUndo.length > 0) {
			undoBuffer.push(currentUndo);
			currentUndo = [];
		}
		if (undoBuffer.length > 0) {
			const currentRedo = [];
			const undoChunk = undoBuffer.pop();
			for (let i = undoChunk.length - 1; i >= 0; i--) {
				const undo = undoChunk.pop();
				if (undo[0] < imageData.length) {
					currentRedo.push([undo[0], imageData[undo[0]], undo[2], undo[3]]);
					imageData[undo[0]] = undo[1];
					drawHistory.push((undo[0] << 16) + undo[1]);
					if (iceColors === false) {
						updateBeforeBlinkFlip(undo[2], undo[3]);
					}
					// Use both immediate redraw AND dirty region system for undo
					redrawGlyph(undo[0], undo[2], undo[3]);
					enqueueDirtyCell(undo[2], undo[3]);
				}
			}
			redoBuffer.push(currentRedo);
			processDirtyRegions();
			sendDrawHistory();
		}
	}

	function redo() {
		if (redoBuffer.length > 0) {
			const redoChunk = redoBuffer.pop();
			for (let i = redoChunk.length - 1; i >= 0; i--) {
				const redo = redoChunk.pop();
				if (redo[0] < imageData.length) {
					currentUndo.push([redo[0], imageData[redo[0]], redo[2], redo[3]]);
					imageData[redo[0]] = redo[1];
					drawHistory.push((redo[0] << 16) + redo[1]);
					if (iceColors === false) {
						updateBeforeBlinkFlip(redo[2], redo[3]);
					}
					// Use both immediate redraw AND dirty region system for redo
					redrawGlyph(redo[0], redo[2], redo[3]);
					enqueueDirtyCell(redo[2], redo[3]);
				}
			}
			undoBuffer.push(currentUndo);
			currentUndo = [];
			processDirtyRegions();
			sendDrawHistory();
		}
	}

	function startUndo() {
		if (currentUndo.length > 0) {
			undoBuffer.push(currentUndo);
			currentUndo = [];
		}
		redoBuffer = [];
	}

	function optimiseBlocks(blocks) {
		blocks.forEach((block) => {
			const index = block[0];
			const attribute = imageData[index];
			const background = (attribute >> 4) & 15;
			if (background >= 8) {
				switch (attribute >> 8) {
					case 0:
					case 32:
					case 255:
						draw(index, 219, background, 0, block[1], block[2]);
						break;
					case 219:
						draw(index, 219, (attribute & 15), 0, block[1], block[2]);
						break;
					case 221:
						var foreground = (attribute & 15);
						if (foreground < 8) {
							draw(index, 222, background, foreground, block[1], block[2]);
						}
						break;
					case 222:
						var foreground = (attribute & 15);
						if (foreground < 8) {
							draw(index, 221, background, foreground, block[1], block[2]);
						}
						break;
					case 223:
						var foreground = (attribute & 15);
						if (foreground < 8) {
							draw(index, 220, background, foreground, block[1], block[2]);
						}
						break;
					case 220:
						var foreground = (attribute & 15);
						if (foreground < 8) {
							draw(index, 223, background, foreground, block[1], block[2]);
						}
						break;
					default:
						break;
				}
			}
		});
	}

	function drawBlocks(blocks) {
		blocks.forEach((block) => {
			if (iceColors === false) {
				updateBeforeBlinkFlip(block[1], block[2]);
			}
			enqueueDirtyCell(block[1], block[2]);
		});
		processDirtyRegions();
	}

	function undoWithoutSending() {
		for (let i = currentUndo.length - 1; i >= 0; i--) {
			const undo = currentUndo.pop();
			imageData[undo[0]] = undo[1];
		}
		drawHistory = [];
	}

	function drawEntryPoint(callback, optimise) {
		const blocks = [];
		callback(function(charCode, foreground, background, x, y) {
			const index = y * columns + x;
			blocks.push([index, x, y]);
			patchBufferAndEnqueueDirty(index, charCode, foreground, background, x, y, true);

			if (mirrorMode) {
				const mirrorX = getMirrorX(x);
				if (mirrorX >= 0 && mirrorX < columns) {
					const mirrorIndex = y * columns + mirrorX;
					const mirrorCharCode = getMirrorCharCode(charCode);
					blocks.push([mirrorIndex, mirrorX, y]);
					patchBufferAndEnqueueDirty(mirrorIndex, mirrorCharCode, foreground, background, mirrorX, y, true);
				}
			}
		});
		if (optimise) {
			optimiseBlocks(blocks);
		}

		processDirtyRegions();
		sendDrawHistory();
	}

	function drawHalfBlockEntryPoint(callback) {
		const blocks = [];
		callback(function(foreground, x, y) {
			const textY = Math.floor(y / 2);
			const index = textY * columns + x;
			blocks.push([index, x, textY]);

			currentUndo.push([index, imageData[index], x, textY]);
			drawHistory.push((index << 16) + imageData[index]);

			drawHalfBlock(index, foreground, x, y, textY);

			if (mirrorMode) {
				const mirrorX = getMirrorX(x);
				if (mirrorX >= 0 && mirrorX < columns) {
					const mirrorIndex = textY * columns + mirrorX;
					blocks.push([mirrorIndex, mirrorX, textY]);

					currentUndo.push([mirrorIndex, imageData[mirrorIndex], mirrorX, textY]);
					drawHistory.push((mirrorIndex << 16) + imageData[mirrorIndex]);

					drawHalfBlock(mirrorIndex, foreground, mirrorX, y, textY);
				}
			}
		});
		optimiseBlocks(blocks);
		processDirtyRegions();
		sendDrawHistory();
	}

	function deleteArea(x, y, width, height, background) {
		const maxWidth = x + width;
		const maxHeight = y + height;
		drawEntryPoint(function(draw) {
			for (let dy = y; dy < maxHeight; dy++) {
				for (let dx = x; dx < maxWidth; dx++) {
					draw(0, 0, background, dx, dy);
				}
			}
		});
	}

	function getArea(x, y, width, height) {
		const data = new Uint16Array(width * height);
		for (let dy = 0, j = 0; dy < height; dy++) {
			for (let dx = 0; dx < width; dx++, j++) {
				const i = (y + dy) * columns + (x + dx);
				data[j] = imageData[i];
			}
		}
		return {
			"data": data,
			"width": width,
			"height": height
		};
	}

	function setArea(area, x, y) {
		const maxWidth = Math.min(area.width, columns - x);
		const maxHeight = Math.min(area.height, rows - y);
		drawEntryPoint(function(draw) {
			for (let py = 0; py < maxHeight; py++) {
				for (let px = 0; px < maxWidth; px++) {
					const attrib = area.data[py * area.width + px];
					draw(attrib >> 8, attrib & 15, (attrib >> 4) & 15, x + px, y + py);
				}
			}
		});
	}

	// Use unified buffer patching without adding to undo (network changes)
	function quickDraw(blocks) {
		blocks.forEach((block) => {
			if (imageData[block[0]] !== block[1]) {
				imageData[block[0]] = block[1];
				if (iceColors === false) {
					updateBeforeBlinkFlip(block[2], block[3]);
				}
				enqueueDirtyCell(block[2], block[3]);
			}
		});
		processDirtyRegions();
	}

	function getCurrentFontName() {
		return currentFontName;
	}

	function setXBFontData(fontBytes, fontWidth, fontHeight) {
		if (!fontWidth || fontWidth <= 0) {
			console.warn("Invalid XB font width:", fontWidth, "defaulting to 8");
			fontWidth = 8;
		}
		if (!fontHeight || fontHeight <= 0) {
			console.warn("Invalid XB font height:", fontHeight, "defaulting to 16");
			fontHeight = 16;
		}
		if (!fontBytes || fontBytes.length === 0) {
			console.error("No XB font data provided");
			return false;
		}

		xbFontData = {
			bytes: fontBytes,
			width: fontWidth,
			height: fontHeight
		};
		return true;
	}

	function setXBPaletteData(paletteBytes) {
		console.log("Setting XB palette data");
		xbPaletteData = paletteBytes;
		// Convert XB palette (6-bit RGB values)
		const rgb6BitPalette = [];
		for (let i = 0; i < 16; i++) {
			const offset = i * 3;
			rgb6BitPalette.push([paletteBytes[offset], paletteBytes[offset + 1], paletteBytes[offset + 2]]);
		}
		palette = createPalette(rgb6BitPalette);
		window.palette = palette;

		// Force regeneration of font glyphs with new palette
		if (font && font.setLetterSpacing) {
			console.log("Regenerating font glyphs with new palette");
			font.setLetterSpacing(font.getLetterSpacing());
		}
		document.dispatchEvent(new CustomEvent("onPaletteChange", {
			detail: palette,
			bubbles: true,
			cancelable: false
		}));
		console.log("Palette change event dispatched");
	}

	function clearXBData(callback) {
		xbFontData = null;
		xbPaletteData = null;
		palette = createDefaultPalette();
		window.palette = palette;
		document.dispatchEvent(new CustomEvent("onPaletteChange", {
			detail: palette,
			bubbles: true,
			cancelable: false
		}));
		if (font && font.setLetterSpacing) {
			font.setLetterSpacing(font.getLetterSpacing());
		}
		if (callback) { callback(); }
	}

	function loadXBFileSequential(imageData, finalCallback) {
		console.log("Starting sequential XB file loading...");

		clearXBData(() => {
			console.log("XB data cleared, applying new data...");

			if (imageData.paletteData) {
				console.log("Applying XB palette data...");
				setXBPaletteData(imageData.paletteData);
			}
			if (imageData.fontData) {
				console.log("Processing XB font data...");
				const fontDataValid = setXBFontData(imageData.fontData.bytes, imageData.fontData.width, imageData.fontData.height);
				if (fontDataValid) {
					console.log("XB font data valid, loading XBIN font...");
					setFont("XBIN", () => {
						console.log("XBIN font loaded successfully");
						finalCallback(imageData.columns, imageData.rows, imageData.data, imageData.iceColors, imageData.letterSpacing, imageData.fontName);
					});
				} else {
					console.warn("XB font data invalid, falling back to TOPAZ_437");
					var fallbackFont = "TOPAZ_437";
					setFont(fallbackFont, () => {
						finalCallback(imageData.columns, imageData.rows, imageData.data, imageData.iceColors, imageData.letterSpacing, fallbackFont);
					});
				}
			} else {
				console.log("No embedded font in XB file, using TOPAZ_437 fallback");
				var fallbackFont = "TOPAZ_437";
				setFont(fallbackFont, () => {
					finalCallback(imageData.columns, imageData.rows, imageData.data, imageData.iceColors, imageData.letterSpacing, fallbackFont);
				});
			}
		});
	}

	return {
		"resize": resize,
		"redrawEntireImage": redrawEntireImage,
		"setFont": setFont,
		"getIceColors": getIceColors,
		"setIceColors": setIceColors,
		"getImage": getImage,
		"getImageData": getImageData,
		"setImageData": setImageData,
		"getColumns": getColumns,
		"getRows": getRows,
		"clear": clear,
		"draw": drawEntryPoint,
		"getBlock": getBlock,
		"getHalfBlock": getHalfBlock,
		"drawHalfBlock": drawHalfBlockEntryPoint,
		"startUndo": startUndo,
		"undo": undo,
		"redo": redo,
		"deleteArea": deleteArea,
		"getArea": getArea,
		"setArea": setArea,
		"quickDraw": quickDraw,
		"setMirrorMode": setMirrorMode,
		"getMirrorMode": getMirrorMode,
		"getMirrorX": getMirrorX,
		"getCurrentFontName": getCurrentFontName,
		"setXBFontData": setXBFontData,
		"setXBPaletteData": setXBPaletteData,
		"clearXBData": clearXBData,
		"loadXBFileSequential": loadXBFileSequential,
		"drawRegion": drawRegion,
		"enqueueDirtyRegion": enqueueDirtyRegion,
		"enqueueDirtyCell": enqueueDirtyCell,
		"processDirtyRegions": processDirtyRegions,
		"patchBufferAndEnqueueDirty": patchBufferAndEnqueueDirty,
		"coalesceRegions": coalesceRegions
	};
}
export {
	createPalette,
	createDefaultPalette,
	createPalettePreview,
	createPalettePicker,
	loadImageAndGetImageData,
	loadFontFromXBData,
	loadFontFromImage,
	createTextArtCanvas,
	setSampleToolDependency
};
