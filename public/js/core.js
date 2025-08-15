function createPalette(RGB6Bit) {
	"use strict";
	var RGBAColours = RGB6Bit.map((RGB6Bit) => {
		return new Uint8Array(
			[
				RGB6Bit[0] << 2 | RGB6Bit[0] >> 4,
				RGB6Bit[1] << 2 | RGB6Bit[1] >> 4,
				RGB6Bit[2] << 2 | RGB6Bit[2] >> 4,
				255
			]
		);
	});
	var foreground = 7;
	var background = 0;

	function getRGBAColour(index) {
		return RGBAColours[index];
	}

	function getForegroundColour() {
		return foreground;
	}

	function getBackgroundColour() {
		return background;
	}

	function setForegroundColour(newForeground) {
		foreground = newForeground;
		document.dispatchEvent(new CustomEvent("onForegroundChange", { "detail": foreground }));
	}

	function setBackgroundColour(newBackground) {
		background = newBackground;
		document.dispatchEvent(new CustomEvent("onBackgroundChange", { "detail": background }));
	}

	return {
		"getRGBAColour": getRGBAColour,
		"getForegroundColour": getForegroundColour,
		"getBackgroundColour": getBackgroundColour,
		"setForegroundColour": setForegroundColour,
		"setBackgroundColour": setBackgroundColour
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

function createPalettePreview(canvas) {
	"use strict";
	var imageData;

	function updatePreview() {
		var colour;
		var foreground = palette.getRGBAColour(palette.getForegroundColour());
		var background = palette.getRGBAColour(palette.getBackgroundColour());
		for (var y = 0, i = 0; y < canvas.height; y++) {
			for (var x = 0; x < canvas.width; x++, i += 4) {
				if (y >= 10 && y < canvas.height - 10 && x > 10 && x < canvas.width - 10) {
					colour = foreground;
				} else {
					colour = background;
				}
				imageData.data.set(colour, i);
			}
		}
		canvas.getContext("2d").putImageData(imageData, 0, 0);
	}

	imageData = canvas.getContext("2d").createImageData(canvas.width, canvas.height);
	updatePreview();
	document.addEventListener("onForegroundChange", updatePreview);
	document.addEventListener("onBackgroundChange", updatePreview);

	return {
		"setForegroundColour": updatePreview,
		"setBackgroundColour": updatePreview
	};
}

function createPalettePicker(canvas) {
	"use strict";
	var imageData = [];
	var mousedowntime;
	var presstime;

	function updateColor(index) {
		var colour = palette.getRGBAColour(index);
		for (var y = 0, i = 0; y < imageData[index].height; y++) {
			for (var x = 0; x < imageData[index].width; x++, i += 4) {
				imageData[index].data.set(colour, i);
			}
		}
		canvas.getContext("2d").putImageData(imageData[index], (index > 7) ? (canvas.width / 2) : 0, (index % 8) * imageData[index].height);
	}

	function updatePalette() {
		for (var i = 0; i < 16; i++) {
			updateColor(i);
		}
	}

	function pressStart(evt) {
		mousedowntime = new Date().getTime();
	}

	function touchEnd(evt) {
		var rect = canvas.getBoundingClientRect();
		var x = Math.floor((evt.touches[0].pageX - rect.left) / (canvas.width / 2));
		var y = Math.floor((evt.touches[0].pageY - rect.top) / (canvas.height / 8));
		var colourIndex = y + ((x === 0) ? 0 : 8);
		presstime = new Date().getTime() - mousedowntime;
		if (presstime < 200) {
			palette.setForegroundColour(colourIndex);
		} else {
			palette.setBackgroundColour(colourIndex);
		}
	}

	function mouseEnd(evt) {
		var rect = canvas.getBoundingClientRect();
		var x = Math.floor((evt.clientX - rect.left) / (canvas.width / 2));
		var y = Math.floor((evt.clientY - rect.top) / (canvas.height / 8));
		var colourIndex = y + ((x === 0) ? 0 : 8);
		if (evt.altKey === false && evt.ctrlKey === false) {
			presstime = new Date().getTime() - mousedowntime;
			if (presstime < 200) {
				palette.setForegroundColour(colourIndex);
			} else {
				palette.setBackgroundColour(colourIndex);
			}
		} else {
			palette.setBackgroundColour(colourIndex);
		}
	}

	for (var i = 0; i < 16; i++) {
		imageData[i] = canvas.getContext("2d").createImageData(canvas.width / 2, canvas.height / 8);
	}

	function keydown(evt) {
		var keyCode = (evt.keyCode || evt.which);
		if (keyCode >= 48 && keyCode <= 55) {
			var num = keyCode - 48;
			if (evt.ctrlKey === true) {
				evt.preventDefault();
				if (palette.getForegroundColour() === num) {
					palette.setForegroundColour(num + 8);
				} else {
					palette.setForegroundColour(num);
				}
			} else if (evt.altKey) {
				evt.preventDefault();
				if (palette.getBackgroundColour() === num) {
					palette.setBackgroundColour(num + 8);
				} else {
					palette.setBackgroundColour(num);
				}
			}
		} else if (keyCode >= 37 && keyCode <= 40 && evt.ctrlKey === true) {
			evt.preventDefault();
			switch (keyCode) {
				case 37:
					var colour = palette.getBackgroundColour();
					colour = (colour === 0) ? 15 : (colour - 1);
					palette.setBackgroundColour(colour);
					break;
				case 38:
					var colour = palette.getForegroundColour();
					colour = (colour === 0) ? 15 : (colour - 1);
					palette.setForegroundColour(colour);
					break;
				case 39:
					var colour = palette.getBackgroundColour();
					colour = (colour === 15) ? 0 : (colour + 1);
					palette.setBackgroundColour(colour);
					break;
				case 40:
					var colour = palette.getForegroundColour();
					colour = (colour === 15) ? 0 : (colour + 1);
					palette.setForegroundColour(colour);
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
}

function loadImageAndGetImageData(url, callback) {
	"use strict";
	var imgElement = new Image();
	imgElement.addEventListener("load", () => {
		var canvas = createCanvas(imgElement.width, imgElement.height);
		var ctx = canvas.getContext("2d");
		ctx.drawImage(imgElement, 0, 0);
		var imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
		callback(imageData);
	});
	imgElement.addEventListener("error", () => {
		callback(undefined);
	});
	imgElement.src = url;
}

function loadFontFromImage(fontName, letterSpacing, palette, callback) {
	"use strict";
	var fontData = {};
	var fontGlyphs;
	var alphaGlyphs;
	var letterSpacingImageData;

	function parseFontData(imageData) {
		var fontWidth = imageData.width / 16;
		var fontHeight = imageData.height / 16;
		if ((fontWidth === 8) && (imageData.height % 16 === 0) && (fontHeight >= 1 && fontHeight <= 32)) {
			var data = new Uint8Array(fontWidth * fontHeight * 256 / 8);
			var k = 0;
			for (var value = 0; value < 256; value += 1) {
				var x = (value % 16) * fontWidth;
				var y = Math.floor(value / 16) * fontHeight;
				var pos = (y * imageData.width + x) * 4;
				var i = 0;
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
		var bits = new Uint8Array(fontData.width * fontData.height * 256);
		for (var i = 0, k = 0; i < fontData.width * fontData.height * 256 / 8; i += 1) {
			for (var j = 7; j >= 0; j -= 1, k += 1) {
				bits[k] = (fontData.data[i] >> j) & 1;
			}
		}
		fontGlyphs = new Array(16);
		for (var foreground = 0; foreground < 16; foreground++) {
			fontGlyphs[foreground] = new Array(16);
			for (var background = 0; background < 16; background++) {
				fontGlyphs[foreground][background] = new Array(256);
				for (var charCode = 0; charCode < 256; charCode++) {
					fontGlyphs[foreground][background][charCode] = ctx.createImageData(fontData.width, fontData.height);
					for (var i = 0, j = charCode * fontData.width * fontData.height; i < fontData.width * fontData.height; i += 1, j += 1) {
						var colour = palette.getRGBAColour((bits[j] === 1) ? foreground : background);
						fontGlyphs[foreground][background][charCode].data.set(colour, i * 4);
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
							imageData.data.set(palette.getRGBAColour(foreground), i * 4);
						}
					}
					var alphaCanvas = createCanvas(imageData.width, imageData.height);
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
			var colour = palette.getRGBAColour(i);
			for (var j = 0; j < fontData.height; j++) {
				imageData.data.set(colour, j * 4);
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

	loadImageAndGetImageData("fonts/" + fontName + ".png", (imageData) => {
		if (imageData === undefined) {
			callback(false);
		} else {
			var newFontData = parseFontData(imageData);
			if (newFontData === undefined) {
				callback(false);
			} else {
				fontData = newFontData;
				generateNewFontGlyphs();
				callback(true);
			}
		}
	});

	function draw(charCode, foreground, background, ctx, x, y) {
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
	var columns = 80,
		rows = 25,
		iceColours = false,
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
		mirrorMode = false;

	function updateBeforeBlinkFlip(x, y) {
		var dataIndex = y * columns + x;
		var contextIndex = Math.floor(y / 25);
		var contextY = y % 25;
		var charCode = imageData[dataIndex] >> 8;
		var background = (imageData[dataIndex] >> 4) & 15;
		var foreground = imageData[dataIndex] & 15;
		var shifted = background >= 8;
		if (shifted === true) {
			background -= 8;
		}
		if (blinkOn === true && shifted) {
			font.draw(charCode, background, background, ctxs[contextIndex], x, contextY);
		} else {
			font.draw(charCode, foreground, background, ctxs[contextIndex], x, contextY);
		}
	}


	function redrawGlyph(index, x, y) {
		var contextIndex = Math.floor(y / 25);
		var contextY = y % 25;
		var charCode = imageData[index] >> 8;
		var background = (imageData[index] >> 4) & 15;
		var foreground = imageData[index] & 15;
		if (iceColours === true) {
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
		for (var y = 0, i = 0; y < rows; y++) {
			for (var x = 0; x < columns; x++, i++) {
				redrawGlyph(i, x, y);
			}
		}
	}

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
		var fontWidth = font.getWidth();
		var fontHeight = font.getHeight();
		var canvasWidth = fontWidth * columns;
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
		if (blinkTimer !== undefined) {
			clearInterval(blinkTimer);
			blinkOn = false;
		}
		redrawEntireImage();
		if (iceColours === false) {
			blinkTimer = setInterval(blink, 250);
		}
	}

	function updateTimer() {
		if (blinkTimer !== undefined) {
			clearInterval(blinkTimer);
		}
		if (iceColours === false) {
			blinkOn = false;
			blinkTimer = setInterval(blink, 500);
		}
	}

	function setFont(fontName, callback) {
		font = loadFontFromImage(fontName, font.getLetterSpacing(), palette, (success) => {
			createCanvases();
			redrawEntireImage();
			document.dispatchEvent(new CustomEvent("onFontChange", { "detail": fontName }));
			callback();
		});
	}

	function resize(newColumnValue, newRowValue) {
		if ((newColumnValue !== columns || newRowValue !== rows) && (newColumnValue > 0 && newRowValue > 0)) {
			clearUndos();
			var maxColumn = (columns > newColumnValue) ? newColumnValue : columns;
			var maxRow = (rows > newRowValue) ? newRowValue : rows;
			var newImageData = new Uint16Array(newColumnValue * newRowValue);
			for (var y = 0; y < maxRow; y++) {
				for (var x = 0; x < maxColumn; x++) {
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

	function getIceColours() {
		return iceColours;
	}

	function setIceColours(newIceColours) {
		if (iceColours !== newIceColours) {
			iceColours = newIceColours;
			updateTimer();
			redrawEntireImage();
		}
	}

	function onLetterSpacingChange(letterSpacing) {
		createCanvases();
	}

	function getImage() {
		var completeCanvas = createCanvas(font.getWidth() * columns, font.getHeight() * rows);
		var y = 0;
		var ctx = completeCanvas.getContext("2d");
		((iceColours === true) ? canvases : offBlinkCanvases).forEach((canvas) => {
			ctx.drawImage(canvas, 0, y);
			y += canvas.height;
		});
		return completeCanvas;
	}

	function getImageData() {
		return imageData;
	}

	function setImageData(newColumnValue, newRowValue, newImageData, newIceColours) {
		clearUndos();
		columns = newColumnValue;
		rows = newRowValue;
		imageData = newImageData;
		if (iceColours !== newIceColours) {
			iceColours = newIceColours;
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
		title.reset();
		clearUndos();
		imageData = new Uint16Array(columns * rows);
		redrawEntireImage();
	}

	palette = createDefaultPalette();
	font = loadFontFromImage("CP437 8x16", false, palette, (success) => {
		createCanvases();
		updateTimer();
		callback();
	});

	function getMirrorX(x) {
		// Calculate mirrored x position
		if (columns % 2 === 0) {
			// Even columns: split 50/50
			if (x < columns / 2) {
				return columns - 1 - x;
			} else {
				return columns - 1 - x;
			}
		} else {
			// Odd columns: ignore center column
			var center = Math.floor(columns / 2);
			if (x === center) {
				return -1; // Don't mirror center column
			} else if (x < center) {
				return columns - 1 - x;
			} else {
				return columns - 1 - x;
			}
		}
	}

	function getMirrorCharCode(charCode) {
		// Transform characters for horizontal mirroring
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

	function getBlock(x, y) {
		var index = y * columns + x;
		var charCode = imageData[index] >> 8;
		var foregroundColour = imageData[index] & 15;
		var backgroundColour = (imageData[index] >> 4) & 15;
		return {
			"x": x,
			"y": y,
			"charCode": charCode,
			"foregroundColour": foregroundColour,
			"backgroundColour": backgroundColour
		};
	}

	function getHalfBlock(x, y) {
		var textY = Math.floor(y / 2);
		var index = textY * columns + x;
		var foreground = imageData[index] & 15;
		var background = (imageData[index] >> 4) & 15;
		var upperBlockColour = 0;
		var lowerBlockColour = 0;
		var isBlocky = false;
		var isVerticalBlocky = false;
		var leftBlockColour;
		var rightBlockColour;
		switch (imageData[index] >> 8) {
			case 0:
			case 32:
			case 255:
				upperBlockColour = background;
				lowerBlockColour = background;
				isBlocky = true;
				break;
			case 220:
				upperBlockColour = background;
				lowerBlockColour = foreground;
				isBlocky = true;
				break;
			case 221:
				isVerticalBlocky = true;
				leftBlockColour = foreground;
				rightBlockColour = background;
				break;
			case 222:
				isVerticalBlocky = true;
				leftBlockColour = background;
				rightBlockColour = foreground;
				break;
			case 223:
				upperBlockColour = foreground;
				lowerBlockColour = background;
				isBlocky = true;
				break;
			case 219:
				upperBlockColour = foreground;
				lowerBlockColour = foreground;
				isBlocky = true;
				break;
			default:
				if (foreground === background) {
					isBlocky = true;
					upperBlockColour = foreground;
					lowerBlockColour = foreground;
				} else {
					isBlocky = false;
				}
		}
		return {
			"x": x,
			"y": y,
			"textY": textY,
			"isBlocky": isBlocky,
			"upperBlockColour": upperBlockColour,
			"lowerBlockColour": lowerBlockColour,
			"halfBlockY": y % 2,
			"isVerticalBlocky": isVerticalBlocky,
			"leftBlockColour": leftBlockColour,
			"rightBlockColour": rightBlockColour
		};
	}

	function drawHalfBlock(index, foreground, x, y, textY) {
		var halfBlockY = y % 2;
		var charCode = imageData[index] >> 8;
		var currentForeground = imageData[index] & 15;
		var currentBackground = (imageData[index] >> 4) & 15;
		if (charCode === 219) {
			if (currentForeground !== foreground) {
				if (halfBlockY === 0) {
					draw(index, 223, foreground, currentForeground, x, textY);
				} else {
					draw(index, 220, foreground, currentForeground, x, textY);
				}
			}
		} else if (charCode !== 220 && charCode !== 223) {
			if (halfBlockY === 0) {
				draw(index, 223, foreground, currentBackground, x, textY);
			} else {
				draw(index, 220, foreground, currentBackground, x, textY);
			}
		} else {
			if (halfBlockY === 0) {
				if (charCode === 223) {
					if (currentBackground === foreground) {
						draw(index, 219, foreground, 0, x, textY);
					} else {
						draw(index, 223, foreground, currentBackground, x, textY);
					}
				} else if (currentForeground === foreground) {
					draw(index, 219, foreground, 0, x, textY);
				} else {
					draw(index, 223, foreground, currentForeground, x, textY);
				}
			} else {
				if (charCode === 220) {
					if (currentBackground === foreground) {
						draw(index, 219, foreground, 0, x, textY);
					} else {
						draw(index, 220, foreground, currentBackground, x, textY);
					}
				} else if (currentForeground === foreground) {
					draw(index, 219, foreground, 0, x, textY);
				} else {
					draw(index, 220, foreground, currentForeground, x, textY);
				}
			}
		}
	}

	document.addEventListener("onLetterSpacingChange", onLetterSpacingChange);

	function getXYCoords(clientX, clientY, callback) {
		var rect = canvasContainer.getBoundingClientRect();
		var x = Math.floor((clientX - rect.left) / font.getWidth());
		var y = Math.floor((clientY - rect.top) / font.getHeight());
		var halfBlockY = Math.floor((clientY - rect.top) / font.getHeight() * 2);
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
			var currentRedo = [];
			var undoChunk = undoBuffer.pop();
			for (var i = undoChunk.length - 1; i >= 0; i--) {
				var undo = undoChunk.pop();
				if (undo[0] < imageData.length) {
					currentRedo.push([undo[0], imageData[undo[0]], undo[2], undo[3]]);
					imageData[undo[0]] = undo[1];
					drawHistory.push((undo[0] << 16) + undo[1]);
					if (iceColours === false) {
						updateBeforeBlinkFlip(undo[2], undo[3]);
					}
					redrawGlyph(undo[0], undo[2], undo[3]);
				}
			}
			redoBuffer.push(currentRedo);
			sendDrawHistory();
		}
	}

	function redo() {
		if (redoBuffer.length > 0) {
			var redoChunk = redoBuffer.pop();
			for (var i = redoChunk.length - 1; i >= 0; i--) {
				var redo = redoChunk.pop();
				if (redo[0] < imageData.length) {
					currentUndo.push([redo[0], imageData[redo[0]], redo[2], redo[3]]);
					imageData[redo[0]] = redo[1];
					drawHistory.push((redo[0] << 16) + redo[1]);
					if (iceColours === false) {
						updateBeforeBlinkFlip(redo[2], redo[3]);
					}
					redrawGlyph(redo[0], redo[2], redo[3]);
				}
			}
			undoBuffer.push(currentUndo);
			currentUndo = [];
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
			var index = block[0];
			var attribute = imageData[index];
			var background = (attribute >> 4) & 15;
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
			if (iceColours === false) {
				updateBeforeBlinkFlip(block[1], block[2]);
			}
			redrawGlyph(block[0], block[1], block[2]);
		});
	}

	function undoWithoutSending() {
		for (var i = currentUndo.length - 1; i >= 0; i--) {
			var undo = currentUndo.pop();
			imageData[undo[0]] = undo[1];
		}
		drawHistory = [];
	}

	function drawEntryPoint(callback, optimise) {
		var blocks = [];
		callback(function(charCode, foreground, background, x, y) {
			var index = y * columns + x;
			blocks.push([index, x, y]);
			draw(index, charCode, foreground, background, x, y);
			
			// Handle mirroring at entry point level
			if (mirrorMode) {
				var mirrorX = getMirrorX(x);
				if (mirrorX >= 0 && mirrorX < columns) {
					var mirrorIndex = y * columns + mirrorX;
					var mirrorCharCode = getMirrorCharCode(charCode);
					blocks.push([mirrorIndex, mirrorX, y]);
					draw(mirrorIndex, mirrorCharCode, foreground, background, mirrorX, y);
				}
			}
		});
		if (optimise) {
			optimiseBlocks(blocks);
		}
		drawBlocks(blocks);
		sendDrawHistory();
	}

	function drawHalfBlockEntryPoint(callback) {
		var blocks = [];
		callback(function(foreground, x, y) {
			var textY = Math.floor(y / 2);
			var index = textY * columns + x;
			blocks.push([index, x, textY]);
			drawHalfBlock(index, foreground, x, y, textY);
			
			// Handle mirroring at entry point level
			if (mirrorMode) {
				var mirrorX = getMirrorX(x);
				if (mirrorX >= 0 && mirrorX < columns) {
					var mirrorIndex = textY * columns + mirrorX;
					blocks.push([mirrorIndex, mirrorX, textY]);
					drawHalfBlock(mirrorIndex, foreground, mirrorX, y, textY);
				}
			}
		});
		optimiseBlocks(blocks);
		drawBlocks(blocks);
		sendDrawHistory();
	}

	function deleteArea(x, y, width, height, background) {
		var maxWidth = x + width;
		var maxHeight = y + height;
		drawEntryPoint(function(draw) {
			for (var dy = y; dy < maxHeight; dy++) {
				for (var dx = x; dx < maxWidth; dx++) {
					draw(0, 0, background, dx, dy);
				}
			}
		});
	}

	function getArea(x, y, width, height) {
		var data = new Uint16Array(width * height);
		for (var dy = 0, j = 0; dy < height; dy++) {
			for (var dx = 0; dx < width; dx++, j++) {
				var i = (y + dy) * columns + (x + dx);
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
		var maxWidth = Math.min(area.width, columns - x);
		var maxHeight = Math.min(area.height, rows - y);
		drawEntryPoint(function(draw) {
			for (var py = 0; py < maxHeight; py++) {
				for (var px = 0; px < maxWidth; px++) {
					var attrib = area.data[py * area.width + px];
					draw(attrib >> 8, attrib & 15, (attrib >> 4) & 15, x + px, y + py);
				}
			}
		});
	}

	function quickDraw(blocks) {
		blocks.forEach((block) => {
			if (imageData[block[0]] !== block[1]) {
				imageData[block[0]] = block[1];
				if (iceColours === false) {
					updateBeforeBlinkFlip(block[2], block[3]);
				}
				redrawGlyph(block[0], block[2], block[3]);
			}
		});
	}

	return {
		"resize": resize,
		"redrawEntireImage": redrawEntireImage,
		"setFont": setFont,
		"getIceColours": getIceColours,
		"setIceColours": setIceColours,
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
		"getMirrorX": getMirrorX
	};
}
