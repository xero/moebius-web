// ES6 module imports
import { createToggleButton } from './ui.js';

// Global references for tool dependencies
let toolPreview, palette, textArtCanvas;

// Function to initialize dependencies
function setToolDependencies(deps) {
	toolPreview = deps.toolPreview;
	palette = deps.palette;
	textArtCanvas = deps.textArtCanvas;
}

function createPanelCursor(divElement) {
	"use strict";
	const cursor = createCanvas(0, 0);
	cursor.classList.add("cursor");
	divElement.appendChild(cursor);

	function show() {
		cursor.style.display = "block";
	}

	function hide() {
		cursor.style.display = "none";
	}

	function resize(width, height) {
		cursor.style.width = width + "px";
		cursor.style.height = height + "px";
	}

	function setPos(x, y) {
		cursor.style.left = x - 1 + "px";
		cursor.style.top = y - 1 + "px";
	}

	return {
		"show": show,
		"hide": hide,
		"resize": resize,
		"setPos": setPos
	};
}

function createFloatingPanelPalette(width, height) {
	"use strict";
	const canvasContainer = document.createElement("DIV");
	const cursor = createPanelCursor(canvasContainer);
	const canvas = createCanvas(width, height);
	canvasContainer.appendChild(canvas);
	const ctx = canvas.getContext("2d");
	const imageData = new Array(16);

	function generateSwatch(colour) {
		imageData[colour] = ctx.createImageData(width / 8, height / 2);
		const rgba = palette.getRGBAColour(colour);
		for (let y = 0, i = 0; y < imageData[colour].height; y++) {
			for (let x = 0; x < imageData[colour].width; x++, i += 4) {
				imageData[colour].data.set(rgba, i);
			}
		}
	}

	function generateSwatches() {
		for (let colour = 0; colour < 16; colour++) {
			generateSwatch(colour);
		}
	}

	function redrawSwatch(colour) {
		ctx.putImageData(imageData[colour], (colour % 8) * (width / 8), (colour > 7) ? 0 : (height / 2));
	}

	function redrawSwatches() {
		for (let colour = 0; colour < 16; colour++) {
			redrawSwatch(colour);
		}
	}

	function mouseDown(evt) {
		const rect = canvas.getBoundingClientRect();
		const mouseX = evt.clientX - rect.left;
		const mouseY = evt.clientY - rect.top;
		const colour = Math.floor(mouseX / (width / 8)) + ((mouseY < (height / 2)) ? 8 : 0);
		if (evt.ctrlKey === false && evt.altKey === false) {
			palette.setForegroundColour(colour);
		} else {
			palette.setBackgroundColour(colour);
		}
	}

	function updateColour(colour) {
		generateSwatch(colour);
		redrawSwatch(colour);
	}

	function updatePalette() {
		for (let colour = 0; colour < 16; colour++) {
			updateColour(colour);
		}
	}

	function getElement() {
		return canvasContainer;
	}

	function updateCursor(colour) {
		cursor.resize(width / 8, height / 2);
		cursor.setPos((colour % 8) * (width / 8), (colour > 7) ? 0 : (height / 2));
	}

	function onForegroundChange(evt) {
		updateCursor(evt.detail);
	}

	function resize(newWidth, newHeight) {
		width = newWidth;
		height = newHeight;
		canvas.width = width;
		canvas.height = height;
		generateSwatches();
		redrawSwatches();
		updateCursor(palette.getForegroundColour());
	}

	generateSwatches();
	redrawSwatches();
	updateCursor(palette.getForegroundColour());
	canvas.addEventListener("mousedown", mouseDown);
	canvas.addEventListener("contextmenu", (evt) => {
		evt.preventDefault();
	});
	document.addEventListener("onForegroundChange", onForegroundChange);

	return {
		"updateColour": updateColour,
		"updatePalette": updatePalette,
		"getElement": getElement,
		"showCursor": cursor.show,
		"hideCursor": cursor.hide,
		"resize": resize
	};
}

function createFloatingPanel(x, y) {
	"use strict";
	const panel = document.createElement("DIV");
	panel.classList.add("floating-panel");
	$("body-container").appendChild(panel);
	let enabled = false;
	let prev;

	function setPos(newX, newY) {
		panel.style.left = newX + "px";
		x = newX;
		panel.style.top = newY + "px";
		y = newY;
	}

	function mousedown(evt) {
		prev = [evt.clientX, evt.clientY];
	}

	function touchMove(evt) {
		if (evt.which === 1 && prev !== undefined) {
			evt.preventDefault();
			evt.stopPropagation();
			const rect = panel.getBoundingClientRect();
			setPos(rect.left + (evt.touches[0].pageX - prev[0]), rect.top + (evt.touches[0].pageY - prev[1]));
			prev = [evt.touches[0].pageX, evt.touches[0].pageY];
		}
	}

	function mouseMove(evt) {
		if (evt.which === 1 && prev !== undefined) {
			evt.preventDefault();
			evt.stopPropagation();
			const rect = panel.getBoundingClientRect();
			setPos(rect.left + (evt.clientX - prev[0]), rect.top + (evt.clientY - prev[1]));
			prev = [evt.clientX, evt.clientY];
		}
	}

	function mouseUp() {
		prev = undefined;
	}

	function enable() {
		panel.classList.add("enabled");
		enabled = true;
		document.addEventListener("touchmove", touchMove);
		document.addEventListener("mousemove", mouseMove);
		document.addEventListener("mouseup", mouseUp);
	}

	function disable() {
		panel.classList.remove("enabled");
		enabled = false;
		document.removeEventListener("touchmove", touchMove);
		document.removeEventListener("mousemove", mouseMove);
		document.removeEventListener("mouseup", mouseUp);
	}

	function append(element) {
		panel.appendChild(element);
	}

	setPos(x, y);
	panel.addEventListener("mousedown", mousedown);

	return {
		"setPos": setPos,
		"enable": enable,
		"disable": disable,
		"append": append
	};
}

function createFreehandController(panel) {
	"use strict";
	let prev = {};
	let drawMode;

	function line(x0, y0, x1, y1, callback) {
		const dx = Math.abs(x1 - x0);
		const sx = (x0 < x1) ? 1 : -1;
		const dy = Math.abs(y1 - y0);
		const sy = (y0 < y1) ? 1 : -1;
		let err = ((dx > dy) ? dx : -dy) / 2;
		let e2;

		while (true) {
			callback(x0, y0);
			if (x0 === x1 && y0 === y1) {
				break;
			}
			e2 = err;
			if (e2 > -dx) {
				err -= dy;
				x0 += sx;
			}
			if (e2 < dy) {
				err += dx;
				y0 += sy;
			}
		}
	}

	function draw(coords) {
		if (prev.x !== coords.x || prev.y !== coords.y || prev.halfBlockY !== coords.halfBlockY) {
			if (drawMode.halfBlockMode === true) {
				const colour = (coords.leftMouseButton === true) ? palette.getForegroundColour() : palette.getBackgroundColour();
				if (Math.abs(prev.x - coords.x) > 1 || Math.abs(prev.halfBlockY - coords.halfBlockY) > 1) {
					textArtCanvas.drawHalfBlock((callback) => {
						line(prev.x, prev.halfBlockY, coords.x, coords.halfBlockY, (x, y) => {
							callback(colour, x, y);
						});
					});
				} else {
					textArtCanvas.drawHalfBlock((callback) => {
						callback(colour, coords.x, coords.halfBlockY);
					});
				}
			} else {
				if (Math.abs(prev.x - coords.x) > 1 || Math.abs(prev.y - coords.y) > 1) {
					textArtCanvas.draw((callback) => {
						line(prev.x, prev.y, coords.x, coords.y, (x, y) => {
							callback(drawMode.charCode, drawMode.foreground, drawMode.background, x, y);
						});
					}, false);
				} else {
					textArtCanvas.draw((callback) => {
						callback(drawMode.charCode, drawMode.foreground, drawMode.background, coords.x, coords.y);
					}, false);
				}
			}
			positionInfo.update(coords.x, coords.y);
			prev = coords;
		}
	}

	function canvasUp() {
		prev = {};
	}

	function canvasDown(evt) {
		drawMode = panel.getMode();
		textArtCanvas.startUndo();
		draw(evt.detail);
	}

	function canvasDrag(evt) {
		draw(evt.detail);
	}

	function enable() {
		document.addEventListener("onTextCanvasDown", canvasDown);
		document.addEventListener("onTextCanvasUp", canvasUp);
		document.addEventListener("onTextCanvasDrag", canvasDrag);
		panel.enable();
	}

	function disable() {
		document.removeEventListener("onTextCanvasDown", canvasDown);
		document.removeEventListener("onTextCanvasUp", canvasUp);
		document.removeEventListener("onTextCanvasDrag", canvasDrag);
		panel.disable();
	}

	return {
		"enable": enable,
		"disable": disable,
		"select": panel.select,
		"ignore": panel.ignore,
		"unignore": panel.unignore,
		"redrawGlyphs": panel.redrawGlyphs
	};
}

function createShadingPanel() {
	"use strict";
	let panelWidth = font.getWidth() * 20;
	const panel = createFloatingPanel(50, 30);
	const palettePanel = createFloatingPanelPalette(panelWidth, 40);
	const canvasContainer = document.createElement("div");
	const cursor = createPanelCursor(canvasContainer);
	const canvases = new Array(16);
	let halfBlockMode = true;
	let x = 0;
	let y = 0;
	let ignored = false;

	function updateCursor() {
		const width = canvases[0].width / 5;
		const height = canvases[0].height / 15;
		cursor.resize(width, height);
		cursor.setPos(x * width, y * height);
	}

	function mouseDownGenerator(colour) {
		return function(evt) {
			const rect = canvases[colour].getBoundingClientRect();
			const mouseX = evt.clientX - rect.left;
			const mouseY = evt.clientY - rect.top;
			halfBlockMode = false;
			x = Math.floor(mouseX / (canvases[colour].width / 5));
			y = Math.floor(mouseY / (canvases[colour].height / 15));
			palettePanel.hideCursor();
			updateCursor();
			cursor.show();
		};
	}

	function generateCanvases() {
		const fontHeight = font.getHeight();
		for (let foreground = 0; foreground < 16; foreground++) {
			const canvas = createCanvas(panelWidth, fontHeight * 15);
			const ctx = canvas.getContext("2d");
			let y = 0;
			for (var background = 0; background < 8; background++) {
				if (foreground !== background) {
					for (var i = 0; i < 4; i++) {
						font.draw(219, foreground, background, ctx, i, y);
					}
					for (var i = 4; i < 8; i++) {
						font.draw(178, foreground, background, ctx, i, y);
					}
					for (var i = 8; i < 12; i++) {
						font.draw(177, foreground, background, ctx, i, y);
					}
					for (var i = 12; i < 16; i++) {
						font.draw(176, foreground, background, ctx, i, y);
					}
					for (var i = 16; i < 20; i++) {
						font.draw(0, foreground, background, ctx, i, y);
					}
					y += 1;
				}
			}
			for (var background = 8; background < 16; background++) {
				if (foreground !== background) {
					for (var i = 0; i < 4; i++) {
						font.draw(219, foreground, background, ctx, i, y);
					}
					for (var i = 4; i < 8; i++) {
						font.draw(178, foreground, background, ctx, i, y);
					}
					for (var i = 8; i < 12; i++) {
						font.draw(177, foreground, background, ctx, i, y);
					}
					for (var i = 12; i < 16; i++) {
						font.draw(176, foreground, background, ctx, i, y);
					}
					for (var i = 16; i < 20; i++) {
						font.draw(0, foreground, background, ctx, i, y);
					}
					y += 1;
				}
			}
			canvas.addEventListener("mousedown", mouseDownGenerator(foreground));
			canvases[foreground] = canvas;
		}
	}

	function keyDown(evt) {
		if (ignored === false) {
			const keyCode = (evt.keyCode || evt.which);
			if (halfBlockMode === false) {
				switch (keyCode) {
					case 37:
						evt.preventDefault();
						x = Math.max(x - 1, 0);
						updateCursor();
						break;
					case 38:
						evt.preventDefault();
						y = Math.max(y - 1, 0);
						updateCursor();
						break;
					case 39:
						evt.preventDefault();
						x = Math.min(x + 1, 4);
						updateCursor();
						break;
					case 40:
						evt.preventDefault();
						y = Math.min(y + 1, 14);
						updateCursor();
						break;
					default:
						break;
				}
			} else if (keyCode >= 37 && keyCode <= 40) {
				evt.preventDefault();
				halfBlockMode = false;
				palettePanel.hideCursor();
				cursor.show();
			}
		}
	}

	function enable() {
		document.addEventListener("keydown", keyDown);
		panel.enable();
	}

	function disable() {
		document.removeEventListener("keydown", keyDown);
		panel.disable();
	}

	function ignore() {
		ignored = true;
	}

	function unignore() {
		ignored = false;
	}

	function getMode() {
		let charCode = 0;
		switch (x) {
			case 0: charCode = 219; break;
			case 1: charCode = 178; break;
			case 2: charCode = 177; break;
			case 3: charCode = 176; break;
			case 4: charCode = 0; break;
			default: break;
		}
		const foreground = palette.getForegroundColour();
		let background = y;
		if (y >= foreground) {
			background += 1;
		}
		return {
			"halfBlockMode": halfBlockMode,
			"foreground": foreground,
			"background": background,
			"charCode": charCode
		};
	}

	function foregroundChange(evt) {
		canvasContainer.removeChild(canvasContainer.firstChild);
		canvasContainer.insertBefore(canvases[evt.detail], canvasContainer.firstChild);
		palettePanel.showCursor();
		cursor.hide();
		halfBlockMode = true;
	}

	function fontChange() {
		panelWidth = font.getWidth() * 20;
		palettePanel.resize(panelWidth, 40);
		generateCanvases();
		updateCursor();
		canvasContainer.removeChild(canvasContainer.firstChild);
		canvasContainer.insertBefore(canvases[palette.getForegroundColour()], canvasContainer.firstChild);
	}

	function select(charCode) {
		halfBlockMode = false;
		x = 3 - (charCode - 176);
		y = palette.getBackgroundColour();
		if (y > palette.getForegroundColour()) {
			y -= 1;
		}
		palettePanel.hideCursor();
		updateCursor();
		cursor.show();
	}

	document.addEventListener("onForegroundChange", foregroundChange);
	document.addEventListener("onLetterSpacingChange", fontChange);
	document.addEventListener("onFontChange", fontChange);

	palettePanel.showCursor();
	panel.append(palettePanel.getElement());
	generateCanvases();
	updateCursor();
	canvasContainer.insertBefore(canvases[palette.getForegroundColour()], canvasContainer.firstChild);
	panel.append(canvasContainer);
	cursor.hide();

	return {
		"enable": enable,
		"disable": disable,
		"getMode": getMode,
		"select": select,
		"ignore": ignore,
		"unignore": unignore
	};
}

function createCharacterBrushPanel() {
	"use strict";
	let panelWidth = font.getWidth() * 16;
	const panel = createFloatingPanel(50, 30);
	const palettePanel = createFloatingPanelPalette(panelWidth, 40);
	const canvasContainer = document.createElement("div");
	const cursor = createPanelCursor(canvasContainer);
	const canvas = createCanvas(panelWidth, font.getHeight() * 16);
	const ctx = canvas.getContext("2d");
	let x = 0;
	let y = 0;
	let ignored = false;

	function updateCursor() {
		const width = canvas.width / 16;
		const height = canvas.height / 16;
		cursor.resize(width, height);
		cursor.setPos(x * width, y * height);
	}

	function redrawCanvas() {
		const foreground = palette.getForegroundColour();
		const background = palette.getBackgroundColour();
		for (let y = 0, charCode = 0; y < 16; y++) {
			for (let x = 0; x < 16; x++, charCode++) {
				font.draw(charCode, foreground, background, ctx, x, y);
			}
		}
	}

	function keyDown(evt) {
		if (ignored === false) {
			const keyCode = (evt.keyCode || evt.which);
			switch (keyCode) {
				case 37:
					evt.preventDefault();
					x = Math.max(x - 1, 0);
					updateCursor();
					break;
				case 38:
					evt.preventDefault();
					y = Math.max(y - 1, 0);
					updateCursor();
					break;
				case 39:
					evt.preventDefault();
					x = Math.min(x + 1, 15);
					updateCursor();
					break;
				case 40:
					evt.preventDefault();
					y = Math.min(y + 1, 15);
					updateCursor();
					break;
				default:
					break;
			}
		}
	}

	function enable() {
		document.addEventListener("keydown", keyDown);
		panel.enable();
	}

	function disable() {
		document.removeEventListener("keydown", keyDown);
		panel.disable();
	}

	function getMode() {
		const charCode = y * 16 + x;
		return {
			"halfBlockMode": false,
			"foreground": palette.getForegroundColour(),
			"background": palette.getBackgroundColour(),
			"charCode": charCode
		};
	}

	function resizeCanvas() {
		panelWidth = font.getWidth() * 16;
		palettePanel.resize(panelWidth, 40);
		canvas.width = panelWidth;
		canvas.height = font.getHeight() * 16;
		redrawCanvas();
		updateCursor();
	}

	function mouseUp(evt) {
		const rect = canvas.getBoundingClientRect();
		const mouseX = evt.clientX - rect.left;
		const mouseY = evt.clientY - rect.top;
		x = Math.floor(mouseX / (canvas.width / 16));
		y = Math.floor(mouseY / (canvas.height / 16));
		updateCursor();
	}

	function select(charCode) {
		x = charCode % 16;
		y = Math.floor(charCode / 16);
		updateCursor();
	}

	function ignore() {
		ignored = true;
	}

	function unignore() {
		ignored = false;
	}

	function redrawGlyphs() {
		redrawCanvas();
	}

	document.addEventListener("onForegroundChange", redrawCanvas);
	document.addEventListener("onBackgroundChange", redrawCanvas);
	document.addEventListener("onLetterSpacingChange", resizeCanvas);
	document.addEventListener("onFontChange", resizeCanvas);
	document.addEventListener("onPaletteChange", redrawCanvas);
	document.addEventListener("onXBFontLoaded", redrawCanvas);
	canvas.addEventListener("mouseup", mouseUp);

	panel.append(palettePanel.getElement());
	updateCursor();
	cursor.show();
	canvasContainer.appendChild(canvas);
	panel.append(canvasContainer);
	redrawCanvas();

	return {
		"enable": enable,
		"disable": disable,
		"getMode": getMode,
		"select": select,
		"ignore": ignore,
		"unignore": unignore,
		"redrawGlyphs": redrawGlyphs
	};
}

function createFillController() {
	"use strict";

	function fillPoint(evt) {
		let block = textArtCanvas.getHalfBlock(evt.detail.x, evt.detail.halfBlockY);
		if (block.isBlocky) {
			const targetColour = (block.halfBlockY === 0) ? block.upperBlockColour : block.lowerBlockColour;
			const fillColour = palette.getForegroundColour();
			if (targetColour !== fillColour) {
				const columns = textArtCanvas.getColumns();
				const rows = textArtCanvas.getRows();
				let coord = [evt.detail.x, evt.detail.halfBlockY];
				const queue = [coord];

				// Handle mirror mode: if enabled and the mirrored position has the same color, add it to queue
				if (textArtCanvas.getMirrorMode()) {
					const mirrorX = textArtCanvas.getMirrorX(evt.detail.x);
					if (mirrorX >= 0 && mirrorX < columns) {
						const mirrorBlock = textArtCanvas.getHalfBlock(mirrorX, evt.detail.halfBlockY);
						if (mirrorBlock.isBlocky) {
							const mirrorTargetColour = (mirrorBlock.halfBlockY === 0) ? mirrorBlock.upperBlockColour : mirrorBlock.lowerBlockColour;
							if (mirrorTargetColour === targetColour) {
								// Add mirror position to the queue so it gets filled too
								queue.push([mirrorX, evt.detail.halfBlockY]);
							}
						}
					}
				}

				textArtCanvas.startUndo();
				textArtCanvas.drawHalfBlock((callback) => {
					while (queue.length !== 0) {
						coord = queue.pop();
						block = textArtCanvas.getHalfBlock(coord[0], coord[1]);
						if (block.isBlocky && (((block.halfBlockY === 0) && (block.upperBlockColour === targetColour)) || ((block.halfBlockY === 1) && (block.lowerBlockColour === targetColour)))) {
							callback(fillColour, coord[0], coord[1]);
							if (coord[0] > 0) {
								queue.push([coord[0] - 1, coord[1], 0]);
							}
							if (coord[0] < columns - 1) {
								queue.push([coord[0] + 1, coord[1], 1]);
							}
							if (coord[1] > 0) {
								queue.push([coord[0], coord[1] - 1, 2]);
							}
							if (coord[1] < rows * 2 - 1) {
								queue.push([coord[0], coord[1] + 1, 3]);
							}
						} else if (block.isVerticalBlocky) {
							if (coord[2] !== 0 && block.leftBlockColour === targetColour) {
								textArtCanvas.draw(function(callback) {
									callback(221, fillColour, block.rightBlockColour, coord[0], block.textY);
								}, true);
								if (coord[0] > 0) {
									queue.push([coord[0] - 1, coord[1], 0]);
								}
								if (coord[1] > 2) {
									if (block.halfBlockY === 1) {
										queue.push([coord[0], coord[1] - 2, 2]);
									} else {
										queue.push([coord[0], coord[1] - 1, 2]);
									}
								}
								if (coord[1] < rows * 2 - 2) {
									if (block.halfBlockY === 1) {
										queue.push([coord[0], coord[1] + 1, 3]);
									} else {
										queue.push([coord[0], coord[1] + 2, 3]);
									}
								}
							}
							if (coord[2] !== 1 && block.rightBlockColour === targetColour) {
								textArtCanvas.draw(function(callback) {
									callback(222, fillColour, block.leftBlockColour, coord[0], block.textY);
								}, true);
								if (coord[0] > 0) {
									queue.push([coord[0] - 1, coord[1], 0]);
								}
								if (coord[1] > 2) {
									if (block.halfBlockY === 1) {
										queue.push([coord[0], coord[1] - 2, 2]);
									} else {
										queue.push([coord[0], coord[1] - 1, 2]);
									}
								}
								if (coord[1] < rows * 2 - 2) {
									if (block.halfBlockY === 1) {
										queue.push([coord[0], coord[1] + 1, 3]);
									} else {
										queue.push([coord[0], coord[1] + 2, 3]);
									}
								}
							}
						}
					}
				});
			}
		}
	}

	function enable() {
		document.addEventListener("onTextCanvasDown", fillPoint);
	}

	function disable() {
		document.removeEventListener("onTextCanvasDown", fillPoint);
	}

	return {
		"enable": enable,
		"disable": disable
	};
}

function createLineController() {
	"use strict";
	let startXY;
	let endXY;

	function canvasDown(evt) {
		startXY = evt.detail;
	}

	function line(x0, y0, x1, y1, callback) {
		const dx = Math.abs(x1 - x0);
		const sx = (x0 < x1) ? 1 : -1;
		const dy = Math.abs(y1 - y0);
		const sy = (y0 < y1) ? 1 : -1;
		let err = ((dx > dy) ? dx : -dy) / 2;
		let e2;

		while (true) {
			callback(x0, y0);
			if (x0 === x1 && y0 === y1) {
				break;
			}
			e2 = err;
			if (e2 > -dx) {
				err -= dy;
				x0 += sx;
			}
			if (e2 < dy) {
				err += dx;
				y0 += sy;
			}
		}
	}

	function canvasUp() {
		toolPreview.clear();
		const foreground = palette.getForegroundColour();
		textArtCanvas.startUndo();
		textArtCanvas.drawHalfBlock((draw) => {
			line(startXY.x, startXY.halfBlockY, endXY.x, endXY.halfBlockY, function(lineX, lineY) {
				draw(foreground, lineX, lineY);
			});
		});
		startXY = undefined;
		endXY = undefined;
	}

	function canvasDrag(evt) {
		if (startXY !== undefined) {
			if (endXY === undefined || (evt.detail.x !== endXY.x || evt.detail.y !== endXY.y || evt.detail.halfBlockY !== endXY.halfBlockY)) {
				if (endXY !== undefined) {
					toolPreview.clear();
				}
				endXY = evt.detail;
				const foreground = palette.getForegroundColour();
				line(startXY.x, startXY.halfBlockY, endXY.x, endXY.halfBlockY, function(lineX, lineY) {
					toolPreview.drawHalfBlock(foreground, lineX, lineY);
				});
			}
		}
	}

	function enable() {
		document.addEventListener("onTextCanvasDown", canvasDown);
		document.addEventListener("onTextCanvasUp", canvasUp);
		document.addEventListener("onTextCanvasDrag", canvasDrag);
	}

	function disable() {
		document.removeEventListener("onTextCanvasDown", canvasDown);
		document.removeEventListener("onTextCanvasUp", canvasUp);
		document.removeEventListener("onTextCanvasDrag", canvasDrag);
	}

	return {
		"enable": enable,
		"disable": disable
	};
}

function createSquareController() {
	"use strict";
	const panel = createFloatingPanel(50, 30);
	const palettePanel = createFloatingPanelPalette(160, 40);
	let startXY;
	let endXY;
	let outlineMode = true;
	const outlineToggle = createToggleButton("Outline", "Filled", () => {
		outlineMode = true;
	}, () => {
		outlineMode = false;
	});

	function canvasDown(evt) {
		startXY = evt.detail;
	}

	function processCoords() {
		let x0, y0, x1, y1;
		if (startXY.x < endXY.x) {
			x0 = startXY.x;
			x1 = endXY.x;
		} else {
			x0 = endXY.x;
			x1 = startXY.x;
		}
		if (startXY.halfBlockY < endXY.halfBlockY) {
			y0 = startXY.halfBlockY;
			y1 = endXY.halfBlockY;
		} else {
			y0 = endXY.halfBlockY;
			y1 = startXY.halfBlockY;
		}
		return { "x0": x0, "y0": y0, "x1": x1, "y1": y1 };
	}

	function canvasUp() {
		toolPreview.clear();
		const coords = processCoords();
		const foreground = palette.getForegroundColour();
		textArtCanvas.startUndo();
		textArtCanvas.drawHalfBlock((draw) => {
			if (outlineMode === true) {
				for (var px = coords.x0; px <= coords.x1; px++) {
					draw(foreground, px, coords.y0);
					draw(foreground, px, coords.y1);
				}
				for (var py = coords.y0 + 1; py < coords.y1; py++) {
					draw(foreground, coords.x0, py);
					draw(foreground, coords.x1, py);
				}
			} else {
				for (var py = coords.y0; py <= coords.y1; py++) {
					for (var px = coords.x0; px <= coords.x1; px++) {
						draw(foreground, px, py);
					}
				}
			}
		});
		startXY = undefined;
		endXY = undefined;
	}

	function canvasDrag(evt) {
		if (startXY !== undefined) {
			if (evt.detail.x !== startXY.x || evt.detail.y !== startXY.y || evt.detail.halfBlockY !== startXY.halfBlockY) {
				if (endXY !== undefined) {
					toolPreview.clear();
				}
				endXY = evt.detail;
				const coords = processCoords();
				const foreground = palette.getForegroundColour();
				if (outlineMode === true) {
					for (var px = coords.x0; px <= coords.x1; px++) {
						toolPreview.drawHalfBlock(foreground, px, coords.y0);
						toolPreview.drawHalfBlock(foreground, px, coords.y1);
					}
					for (var py = coords.y0 + 1; py < coords.y1; py++) {
						toolPreview.drawHalfBlock(foreground, coords.x0, py);
						toolPreview.drawHalfBlock(foreground, coords.x1, py);
					}
				} else {
					for (var py = coords.y0; py <= coords.y1; py++) {
						for (var px = coords.x0; px <= coords.x1; px++) {
							toolPreview.drawHalfBlock(foreground, px, py);
						}
					}
				}
			}
		}
	}

	function enable() {
		panel.enable();
		document.addEventListener("onTextCanvasDown", canvasDown);
		document.addEventListener("onTextCanvasUp", canvasUp);
		document.addEventListener("onTextCanvasDrag", canvasDrag);
	}

	function disable() {
		panel.disable();
		document.removeEventListener("onTextCanvasDown", canvasDown);
		document.removeEventListener("onTextCanvasUp", canvasUp);
		document.removeEventListener("onTextCanvasDrag", canvasDrag);
	}

	panel.append(palettePanel.getElement());
	palettePanel.showCursor();
	panel.append(outlineToggle.getElement());
	if (outlineMode === true) {
		outlineToggle.setStateOne();
	} else {
		outlineToggle.setStateTwo();
	}

	return {
		"enable": enable,
		"disable": disable
	};
}

function createCircleController() {
	"use strict";
	const panel = createFloatingPanel(50, 30);
	const palettePanel = createFloatingPanelPalette(160, 40);
	let startXY;
	let endXY;
	let outlineMode = true;
	const outlineToggle = createToggleButton("Outline", "Filled", () => {
		outlineMode = true;
	}, () => {
		outlineMode = false;
	});

	function canvasDown(evt) {
		startXY = evt.detail;
	}

	function processCoords() {
		let sx, sy, width, height;
		sx = startXY.x;
		sy = startXY.halfBlockY;
		width = Math.abs(endXY.x - startXY.x);
		height = Math.abs(endXY.halfBlockY - startXY.halfBlockY);
		return {
			"sx": sx,
			"sy": sy,
			"width": width,
			"height": height
		};
	}

	function ellipseOutline(sx, sy, width, height, callback) {
		const a2 = width * width;
		const b2 = height * height;
		const fa2 = 4 * a2;
		const fb2 = 4 * b2;
		for (var px = 0, py = height, sigma = 2 * b2 + a2 * (1 - 2 * height); b2 * px <= a2 * py; px += 1) {
			callback(sx + px, sy + py);
			callback(sx - px, sy + py);
			callback(sx + px, sy - py);
			callback(sx - px, sy - py);
			if (sigma >= 0) {
				sigma += fa2 * (1 - py);
				py -= 1;
			}
			sigma += b2 * ((4 * px) + 6);
		}
		for (var px = width, py = 0, sigma = 2 * a2 + b2 * (1 - 2 * width); a2 * py <= b2 * px; py += 1) {
			callback(sx + px, sy + py);
			callback(sx - px, sy + py);
			callback(sx + px, sy - py);
			callback(sx - px, sy - py);
			if (sigma >= 0) {
				sigma += fb2 * (1 - px);
				px -= 1;
			}
			sigma += a2 * ((4 * py) + 6);
		}
	}

	function ellipseFilled(sx, sy, width, height, callback) {
		const a2 = width * width;
		const b2 = height * height;
		const fa2 = 4 * a2;
		const fb2 = 4 * b2;
		for (var px = 0, py = height, sigma = 2 * b2 + a2 * (1 - 2 * height); b2 * px <= a2 * py; px += 1) {
			var amount = px * 2;
			var start = sx - px;
			var y0 = sy + py;
			var y1 = sy - py;
			for (var i = 0; i < amount; i++) {
				callback(start + i, y0);
				callback(start + i, y1);
			}
			if (sigma >= 0) {
				sigma += fa2 * (1 - py);
				py -= 1;
			}
			sigma += b2 * ((4 * px) + 6);
		}
		for (var px = width, py = 0, sigma = 2 * a2 + b2 * (1 - 2 * width); a2 * py <= b2 * px; py += 1) {
			var amount = px * 2;
			var start = sx - px;
			var y0 = sy + py;
			var y1 = sy - py;
			for (var i = 0; i < amount; i++) {
				callback(start + i, y0);
				callback(start + i, y1);
			}
			if (sigma >= 0) {
				sigma += fb2 * (1 - px);
				px -= 1;
			}
			sigma += a2 * ((4 * py) + 6);
		}
	}

	function canvasUp() {
		toolPreview.clear();
		const coords = processCoords();
		const foreground = palette.getForegroundColour();
		textArtCanvas.startUndo();
		const columns = textArtCanvas.getColumns();
		const rows = textArtCanvas.getRows();
		const doubleRows = rows * 2;
		textArtCanvas.drawHalfBlock((draw) => {
			if (outlineMode === true) {
				ellipseOutline(coords.sx, coords.sy, coords.width, coords.height, (px, py) => {
					if (px >= 0 && px < columns && py >= 0 && py < doubleRows) {
						draw(foreground, px, py);
					}
				});
			} else {
				ellipseFilled(coords.sx, coords.sy, coords.width, coords.height, (px, py) => {
					if (px >= 0 && px < columns && py >= 0 && py < doubleRows) {
						draw(foreground, px, py);
					}
				});
			}
		});
		startXY = undefined;
		endXY = undefined;
	}

	function canvasDrag(evt) {
		if (startXY !== undefined) {
			if (evt.detail.x !== startXY.x || evt.detail.y !== startXY.y || evt.detail.halfBlockY !== startXY.halfBlockY) {
				if (endXY !== undefined) {
					toolPreview.clear();
				}
				endXY = evt.detail;
				const coords = processCoords();
				const foreground = palette.getForegroundColour();
				const columns = textArtCanvas.getColumns();
				const rows = textArtCanvas.getRows();
				const doubleRows = rows * 2;
				if (outlineMode === true) {
					ellipseOutline(coords.sx, coords.sy, coords.width, coords.height, (px, py) => {
						if (px >= 0 && px < columns && py >= 0 && py < doubleRows) {
							toolPreview.drawHalfBlock(foreground, px, py);
						}
					});
				} else {
					ellipseFilled(coords.sx, coords.sy, coords.width, coords.height, (px, py) => {
						if (px >= 0 && px < columns && py >= 0 && py < doubleRows) {
							toolPreview.drawHalfBlock(foreground, px, py);
						}
					});
				}
			}
		}
	}

	function enable() {
		panel.enable();
		document.addEventListener("onTextCanvasDown", canvasDown);
		document.addEventListener("onTextCanvasUp", canvasUp);
		document.addEventListener("onTextCanvasDrag", canvasDrag);
	}

	function disable() {
		panel.disable();
		document.removeEventListener("onTextCanvasDown", canvasDown);
		document.removeEventListener("onTextCanvasUp", canvasUp);
		document.removeEventListener("onTextCanvasDrag", canvasDrag);
	}

	panel.append(palettePanel.getElement());
	palettePanel.showCursor();
	panel.append(outlineToggle.getElement());
	if (outlineMode === true) {
		outlineToggle.setStateOne();
	} else {
		outlineToggle.setStateTwo();
	}

	return {
		"enable": enable,
		"disable": disable
	};
}

function createSampleTool(divElement, freestyle, divFreestyle, characterBrush, divCharacterBrush) {
	"use strict";

	function sample(x, halfBlockY) {
		let block = textArtCanvas.getHalfBlock(x, halfBlockY);
		if (block.isBlocky) {
			if (block.halfBlockY === 0) {
				palette.setForegroundColour(block.upperBlockColour);
			} else {
				palette.setForegroundColour(block.lowerBlockColour);
			}
		} else {
			block = textArtCanvas.getBlock(block.x, Math.floor(block.y / 2));
			palette.setForegroundColour(block.foregroundColour);
			palette.setBackgroundColour(block.backgroundColour);
			if (block.charCode >= 176 && block.charCode <= 178) {
				freestyle.select(block.charCode);
				divFreestyle.click();
			} else {
				characterBrush.select(block.charCode);
				divCharacterBrush.click();
			}
		}
	}

	function canvasDown(evt) {
		sample(evt.detail.x, evt.detail.halfBlockY);
	}

	function enable() {
		document.addEventListener("onTextCanvasDown", canvasDown);
	}

	function disable() {
		document.removeEventListener("onTextCanvasDown", canvasDown);
	}

	return {
		"enable": enable,
		"disable": disable,
		"sample": sample
	};
}

function createSelectionTool(divElement) {
	"use strict";
	const panel = $("selection-panel");
	const flipHButton = $("flip-horizontal");
	const flipVButton = $("flip-vertical");
	const moveButton = $("move-blocks");
	let moveMode = false;
	let selectionData = null;
	let isDragging = false;
	let dragStartX = 0;
	let dragStartY = 0;
	let originalPosition = null; // Original position when move mode started
	let underlyingData = null; // Content currently underneath the moving blocks

	function canvasDown(evt) {
		if (moveMode) {
			const selection = selectionCursor.getSelection();
			if (selection &&
				evt.detail.x >= selection.x && evt.detail.x < selection.x + selection.width &&
				evt.detail.y >= selection.y && evt.detail.y < selection.y + selection.height) {
				// Start dragging the selection
				isDragging = true;
				dragStartX = evt.detail.x;
				dragStartY = evt.detail.y;
			}
		} else {
			selectionCursor.setStart(evt.detail.x, evt.detail.y);
			selectionCursor.setEnd(evt.detail.x, evt.detail.y);
		}
	}

	function canvasDrag(evt) {
		if (moveMode && isDragging) {
			const deltaX = evt.detail.x - dragStartX;
			const deltaY = evt.detail.y - dragStartY;
			moveSelection(deltaX, deltaY);
			dragStartX = evt.detail.x;
			dragStartY = evt.detail.y;
		} else if (!moveMode) {
			selectionCursor.setEnd(evt.detail.x, evt.detail.y);
		}
	}

	function canvasUp(evt) {
		if (moveMode && isDragging) {
			isDragging = false;
		}
	}

	function flipHorizontal() {
		const selection = selectionCursor.getSelection();
		if (!selection) {
			return;
		}

		textArtCanvas.startUndo();

		// Get all blocks in the selection
		for (var y = 0; y < selection.height; y++) {
			var blocks = [];
			for (let x = 0; x < selection.width; x++) {
				blocks.push(textArtCanvas.getBlock(selection.x + x, selection.y + y));
			}

			// Flip the row horizontally
			textArtCanvas.draw(function(callback) {
				for (let x = 0; x < selection.width; x++) {
					const sourceBlock = blocks[x];
					const targetX = selection.x + (selection.width - 1 - x);
					let charCode = sourceBlock.charCode;

					// Transform left/right half blocks
					switch (charCode) {
						case 221: // LEFT_HALF_BLOCK
							charCode = 222; // RIGHT_HALF_BLOCK
							break;
						case 222: // RIGHT_HALF_BLOCK
							charCode = 221; // LEFT_HALF_BLOCK
							break;
						default:
							break;
					}

					callback(charCode, sourceBlock.foregroundColour, sourceBlock.backgroundColour, targetX, selection.y + y);
				}
			}, false);
		}
	}

	function flipVertical() {
		const selection = selectionCursor.getSelection();
		if (!selection) {
			return;
		}

		textArtCanvas.startUndo();

		// Get all blocks in the selection
		for (var x = 0; x < selection.width; x++) {
			var blocks = [];
			for (let y = 0; y < selection.height; y++) {
				blocks.push(textArtCanvas.getBlock(selection.x + x, selection.y + y));
			}

			// Flip the column vertically
			textArtCanvas.draw(function(callback) {
				for (let y = 0; y < selection.height; y++) {
					const sourceBlock = blocks[y];
					const targetY = selection.y + (selection.height - 1 - y);
					let charCode = sourceBlock.charCode;

					// Transform upper/lower half blocks
					switch (charCode) {
						case 223: // UPPER_HALF_BLOCK
							charCode = 220; // LOWER_HALF_BLOCK
							break;
						case 220: // LOWER_HALF_BLOCK
							charCode = 223; // UPPER_HALF_BLOCK
							break;
						default:
							break;
					}

					callback(charCode, sourceBlock.foregroundColour, sourceBlock.backgroundColour, selection.x + x, targetY);
				}
			}, false);
		}
	}

	function setAreaSelective(area, targetArea, x, y) {
		// Apply selection data to target position, but only overwrite non-blank characters
		// Blank characters (char code 0, foreground 0, background 0) are treated as transparent
		const maxWidth = Math.min(area.width, textArtCanvas.getColumns() - x);
		const maxHeight = Math.min(area.height, textArtCanvas.getRows() - y);

		textArtCanvas.draw(function(draw) {
			for (let py = 0; py < maxHeight; py++) {
				for (let px = 0; px < maxWidth; px++) {
					const sourceAttrib = area.data[py * area.width + px];

					// Only apply the source character if it's not a truly blank character
					// Truly blank = char code 0, foreground 0, background 0 (attrib === 0)
					if (sourceAttrib !== 0) {
						draw(sourceAttrib >> 8, sourceAttrib & 15, (sourceAttrib >> 4) & 15, x + px, y + py);
					} else if (targetArea) {
						// Keep the original target character for blank spaces
						const targetAttrib = targetArea.data[py * targetArea.width + px];
						draw(targetAttrib >> 8, targetAttrib & 15, (targetAttrib >> 4) & 15, x + px, y + py);
					}
					// If no targetArea and source is blank, do nothing (leave existing content)
				}
			}
		});
	}

	function moveSelection(deltaX, deltaY) {
		const selection = selectionCursor.getSelection();
		if (!selection) {
			return;
		}

		const newX = Math.max(0, Math.min(selection.x + deltaX, textArtCanvas.getColumns() - selection.width));
		const newY = Math.max(0, Math.min(selection.y + deltaY, textArtCanvas.getRows() - selection.height));

		// Don't move if we haven't actually moved
		if (newX === selection.x && newY === selection.y) {
			return;
		}

		textArtCanvas.startUndo();

		// Get the current selection data if we don't have it
		if (!selectionData) {
			selectionData = textArtCanvas.getArea(selection.x, selection.y, selection.width, selection.height);
		}

		// Restore what was underneath the current position (if any)
		if (underlyingData) {
			textArtCanvas.setArea(underlyingData, selection.x, selection.y);
		}

		// Store what's underneath the new position
		underlyingData = textArtCanvas.getArea(newX, newY, selection.width, selection.height);

		// Apply the selection at the new position, but only non-blank characters
		setAreaSelective(selectionData, underlyingData, newX, newY);

		// Update the selection cursor to the new position
		selectionCursor.setStart(newX, newY);
		selectionCursor.setEnd(newX + selection.width - 1, newY + selection.height - 1);
	}

	function createEmptyArea(width, height) {
		// Create an area filled with empty/blank characters (char code 0, colors 0)
		const data = new Uint16Array(width * height);
		for (let i = 0; i < data.length; i++) {
			data[i] = 0; // char code 0, foreground 0, background 0
		}
		return {
			"data": data,
			"width": width,
			"height": height
		};
	}

	function toggleMoveMode() {
		moveMode = !moveMode;
		if (moveMode) {
			// Enable move mode
			moveButton.classList.add("enabled");
			selectionCursor.getElement().classList.add("move-mode");

			// Store selection data and original position when entering move mode
			const selection = selectionCursor.getSelection();
			if (selection) {
				selectionData = textArtCanvas.getArea(selection.x, selection.y, selection.width, selection.height);
				originalPosition = {x: selection.x, y: selection.y, width: selection.width, height: selection.height};
				// What's underneath initially is empty space (what should be left when the selection moves away)
				underlyingData = createEmptyArea(selection.width, selection.height);
			}
		} else {
			// Disable move mode - finalize the move by clearing original position if different
			const currentSelection = selectionCursor.getSelection();
			if (originalPosition && currentSelection &&
				(currentSelection.x !== originalPosition.x || currentSelection.y !== originalPosition.y)) {
				// Only clear original position if we actually moved
				textArtCanvas.startUndo();
				textArtCanvas.deleteArea(originalPosition.x, originalPosition.y, originalPosition.width, originalPosition.height, 0);
			}

			moveButton.classList.remove("enabled");
			selectionCursor.getElement().classList.remove("move-mode");
			selectionData = null;
			originalPosition = null;
			underlyingData = null;
		}
	}

	function keyDown(evt) {
		const keyCode = (evt.keyCode || evt.which);
		if (evt.ctrlKey === false && evt.altKey === false && evt.shiftKey === false && evt.metaKey === false) {
			if (keyCode === 27) { // Escape key - return to previous tool
				evt.preventDefault();
				if (typeof Toolbar !== 'undefined') {
					Toolbar.returnToPreviousTool();
				}
			} else if (keyCode === 91) { // '[' key - flip horizontal
				evt.preventDefault();
				flipHorizontal();
			} else if (keyCode === 93) { // ']' key - flip vertical
				evt.preventDefault();
				flipVertical();
			} else if (keyCode === 77) { // 'M' key - toggle move mode
				evt.preventDefault();
				toggleMoveMode();
			} else if (moveMode && selectionCursor.getSelection()) {
				// Arrow key movement in move mode
				if (keyCode === 37) { // Left arrow
					evt.preventDefault();
					moveSelection(-1, 0);
				} else if (keyCode === 38) { // Up arrow
					evt.preventDefault();
					moveSelection(0, -1);
				} else if (keyCode === 39) { // Right arrow
					evt.preventDefault();
					moveSelection(1, 0);
				} else if (keyCode === 40) { // Down arrow
					evt.preventDefault();
					moveSelection(0, 1);
				}
			} else {
				// Handle cursor movement when not in move mode
				switch (keyCode) {
					case 13: // Enter key - new line
						evt.preventDefault();
						cursor.newLine();
						break;
					case 35: // End key
						evt.preventDefault();
						cursor.endOfCurrentRow();
						break;
					case 36: // Home key
						evt.preventDefault();
						cursor.startOfCurrentRow();
						break;
					case 37: // Left arrow
						evt.preventDefault();
						cursor.left();
						break;
					case 38: // Up arrow
						evt.preventDefault();
						cursor.up();
						break;
					case 39: // Right arrow
						evt.preventDefault();
						cursor.right();
						break;
					case 40: // Down arrow
						evt.preventDefault();
						cursor.down();
						break;
					default:
						break;
				}
			}
		} else if (evt.metaKey === true && evt.shiftKey === false) {
			// Handle Meta key combinations
			switch (keyCode) {
				case 37: // Meta+Left - expand selection to start of current row
					evt.preventDefault();
					cursor.shiftToStartOfRow();
					break;
				case 39: // Meta+Right - expand selection to end of current row
					evt.preventDefault();
					cursor.shiftToEndOfRow();
					break;
				default:
					break;
			}
		} else if (evt.shiftKey === true && evt.metaKey === false) {
			// Handle Shift key combinations for selection
			switch (keyCode) {
				case 37: // Shift+Left
					evt.preventDefault();
					cursor.shiftLeft();
					break;
				case 38: // Shift+Up
					evt.preventDefault();
					cursor.shiftUp();
					break;
				case 39: // Shift+Right
					evt.preventDefault();
					cursor.shiftRight();
					break;
				case 40: // Shift+Down
					evt.preventDefault();
					cursor.shiftDown();
					break;
				default:
					break;
			}
		}
	}

	function enable() {
		document.addEventListener("onTextCanvasDown", canvasDown);
		document.addEventListener("onTextCanvasDrag", canvasDrag);
		document.addEventListener("onTextCanvasUp", canvasUp);
		document.addEventListener("keydown", keyDown);
		panel.style.display = "block";

		// Add click handlers for the buttons
		flipHButton.addEventListener("click", flipHorizontal);
		flipVButton.addEventListener("click", flipVertical);
		moveButton.addEventListener("click", toggleMoveMode);
	}

	function disable() {
		selectionCursor.hide();
		document.removeEventListener("onTextCanvasDown", canvasDown);
		document.removeEventListener("onTextCanvasDrag", canvasDrag);
		document.removeEventListener("onTextCanvasUp", canvasUp);
		document.removeEventListener("keydown", keyDown);
		panel.style.display = "none";

		// Reset move mode if it was active and finalize any pending move
		if (moveMode) {
			// Finalize the move by clearing original position if different
			const currentSelection = selectionCursor.getSelection();
			if (originalPosition && currentSelection &&
				(currentSelection.x !== originalPosition.x || currentSelection.y !== originalPosition.y)) {
				textArtCanvas.startUndo();
				textArtCanvas.deleteArea(originalPosition.x, originalPosition.y, originalPosition.width, originalPosition.height, 0);
			}

			moveMode = false;
			moveButton.classList.remove("enabled");
			selectionCursor.getElement().classList.remove("move-mode");
			selectionData = null;
			originalPosition = null;
			underlyingData = null;
		}

		// Remove click handlers
		flipHButton.removeEventListener("click", flipHorizontal);
		flipVButton.removeEventListener("click", flipVertical);
		moveButton.removeEventListener("click", toggleMoveMode);
		pasteTool.disable();
	}

	return {
		"enable": enable,
		"disable": disable,
		"flipHorizontal": flipHorizontal,
		"flipVertical": flipVertical
	};
}

function createAttributeBrushController() {
	"use strict";
	let isActive = false;
	let lastCoord = null;

	function paintAttribute(x, y, altKey) {
		const block = textArtCanvas.getBlock(x, y);
		const currentForeground = palette.getForegroundColour();
		const currentBackground = palette.getBackgroundColour();
		let newForeground, newBackground;

		if (altKey) {
			// Alt+click modifies background color only
			newForeground = block.foregroundColour;
			newBackground = currentForeground > 7 ? currentForeground - 8 : currentForeground;
		} else {
			// Normal click modifies both foreground and background colors
			newForeground = currentForeground;
			newBackground = currentBackground;
		}

		// Only update if something changes
		if (block.foregroundColour !== newForeground || block.backgroundColour !== newBackground) {
			textArtCanvas.draw((callback) => {
				callback(block.charCode, newForeground, newBackground, x, y);
			}, true);
		}
	}

	function paintLine(fromX, fromY, toX, toY, altKey) {
		// Use Bresenham's line algorithm to paint attributes along a line
		const dx = Math.abs(toX - fromX);
		const dy = Math.abs(toY - fromY);
		const sx = fromX < toX ? 1 : -1;
		const sy = fromY < toY ? 1 : -1;
		let err = dx - dy;
		let x = fromX;
		let y = fromY;

		while (true) {
			paintAttribute(x, y, altKey);

			if (x === toX && y === toY) {break;}

			const e2 = 2 * err;
			if (e2 > -dy) {
				err -= dy;
				x += sx;
			}
			if (e2 < dx) {
				err += dx;
				y += sy;
			}
		}
	}

	function canvasDown(evt) {
		textArtCanvas.startUndo();
		isActive = true;

		if (evt.detail.shiftKey && lastCoord) {
			// Shift+click draws a line from last point
			paintLine(lastCoord.x, lastCoord.y, evt.detail.x, evt.detail.y, evt.detail.altKey);
		} else {
			// Normal click paints single point
			paintAttribute(evt.detail.x, evt.detail.y, evt.detail.altKey);
		}

		lastCoord = { x: evt.detail.x, y: evt.detail.y };
	}

	function canvasDrag(evt) {
		if (isActive && lastCoord) {
			paintLine(lastCoord.x, lastCoord.y, evt.detail.x, evt.detail.y, evt.detail.altKey);
			lastCoord = { x: evt.detail.x, y: evt.detail.y };
		}
	}

	function canvasUp(evt) {
		isActive = false;
	}

	function enable() {
		document.addEventListener("onTextCanvasDown", canvasDown);
		document.addEventListener("onTextCanvasDrag", canvasDrag);
		document.addEventListener("onTextCanvasUp", canvasUp);
	}

	function disable() {
		document.removeEventListener("onTextCanvasDown", canvasDown);
		document.removeEventListener("onTextCanvasDrag", canvasDrag);
		document.removeEventListener("onTextCanvasUp", canvasUp);
		isActive = false;
		lastCoord = null;
	}

	return {
		"enable": enable,
		"disable": disable
	};
}

// ES6 module exports
export {
	setToolDependencies,
	createPanelCursor,
	createFloatingPanelPalette,
	createFloatingPanel,
	createFreehandController,
	createShadingPanel,
	createCharacterBrushPanel,
	createFillController,
	createLineController,
	createSquareController,
	createCircleController,
	createAttributeBrushController,
	createSelectionTool,
	createSampleTool
};
