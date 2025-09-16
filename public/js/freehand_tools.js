// ES6 module imports
import { createToggleButton } from './ui.js';
import { State, $, createCanvas } from './state.js';

function createPanelCursor(divElement) {
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
	const canvasContainer = document.createElement("DIV");
	const cursor = createPanelCursor(canvasContainer);
	const canvas = createCanvas(width, height);
	canvasContainer.appendChild(canvas);
	const ctx = canvas.getContext("2d");
	const imageData = new Array(16);

	function generateSwatch(color) {
		imageData[color] = ctx.createImageData(width / 8, height / 2);
		const rgba = State.palette.getRGBAColor(color);
		for (let y = 0, i = 0; y < imageData[color].height; y++) {
			for (let x = 0; x < imageData[color].width; x++, i += 4) {
				imageData[color].data.set(rgba, i);
			}
		}
	}

	function generateSwatches() {
		for (let color = 0; color < 16; color++) {
			generateSwatch(color);
		}
	}

	function redrawSwatch(color) {
		ctx.putImageData(imageData[color], (color % 8) * (width / 8), (color > 7) ? 0 : (height / 2));
	}

	function redrawSwatches() {
		for (let color = 0; color < 16; color++) {
			redrawSwatch(color);
		}
	}

	function mouseDown(evt) {
		const rect = canvas.getBoundingClientRect();
		const mouseX = evt.clientX - rect.left;
		const mouseY = evt.clientY - rect.top;
		const color = Math.floor(mouseX / (width / 8)) + ((mouseY < (height / 2)) ? 8 : 0);
		if (evt.ctrlKey === false && evt.altKey === false) {
			State.palette.setForegroundColor(color);
		} else {
			State.palette.setBackgroundColor(color);
		}
	}

	function onPaletteChange(_) {
		console.log('update palette');
		updatePalette();
	}

	function updateColor(color) {
		generateSwatch(color);
		redrawSwatch(color);
	}

	function updatePalette() {
		for (let color = 0; color < 16; color++) {
			updateColor(color);
		}
	}

	function getElement() {
		return canvasContainer;
	}

	function updateCursor(color) {
		cursor.resize(width / 8, height / 2);
		cursor.setPos((color % 8) * (width / 8), (color > 7) ? 0 : (height / 2));
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
		updateCursor(State.palette.getForegroundColor());
	}

	generateSwatches();
	redrawSwatches();
	updateCursor(State.palette.getForegroundColor());
	canvas.addEventListener("mousedown", mouseDown);
	canvas.addEventListener("contextmenu", (evt) => {
		evt.preventDefault();
	});
	document.addEventListener("onForegroundChange", onForegroundChange);
	document.addEventListener("onPaletteChange", onPaletteChange);
	return {
		"updateColor": updateColor,
		"updatePalette": updatePalette,
		"getElement": getElement,
		"showCursor": cursor.show,
		"hideCursor": cursor.hide,
		"resize": resize
	};
}

function createFloatingPanel(x, y) {
	const panel = document.createElement("DIV");
	const hide = document.createElement("DIV");
	panel.classList.add("floating-panel");
	hide.classList.add("hidePanel");
	hide.innerText = "X";
	panel.appendChild(hide);
	$("body-container").appendChild(panel);
	hide.addEventListener('click', _ => panel.classList.remove('enabled'));
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

function createBrushController() {
	const panel = $("brush-toolbar");
	function enable() {
		panel.style.display = "flex";
		$('halfblock').click();
	}
	function disable() {
		panel.style.display = "none";
	}
	return {
		"enable": enable,
		"disable": disable
	};
}

function createHalfBlockController() {
	let prev = {};
	const bar = $("brush-toolbar");
	const nav = $('brushes');

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
			const color = (coords.leftMouseButton === true) ? State.palette.getForegroundColor() : State.palette.getBackgroundColor();
			if (Math.abs(prev.x - coords.x) > 1 || Math.abs(prev.halfBlockY - coords.halfBlockY) > 1) {
				State.textArtCanvas.drawHalfBlock((callback) => {
					line(prev.x, prev.halfBlockY, coords.x, coords.halfBlockY, (x, y) => {
						callback(color, x, y);
					});
				});
			} else {
				State.textArtCanvas.drawHalfBlock((callback) => {
					callback(color, coords.x, coords.halfBlockY);
				});
			}
			State.positionInfo.update(coords.x, coords.y);
			prev = coords;
		}
	}

	function canvasUp() {
		prev = {};
	}

	function canvasDown(evt) {
		State.textArtCanvas.startUndo();
		draw(evt.detail);
	}

	function canvasDrag(evt) {
		draw(evt.detail);
	}

	function enable() {
		document.addEventListener("onTextCanvasDown", canvasDown);
		document.addEventListener("onTextCanvasUp", canvasUp);
		document.addEventListener("onTextCanvasDrag", canvasDrag);
		bar.style.display = "flex";
		nav.classList.add('enabled');
	}

	function disable() {
		document.removeEventListener("onTextCanvasDown", canvasDown);
		document.removeEventListener("onTextCanvasUp", canvasUp);
		document.removeEventListener("onTextCanvasDrag", canvasDrag);
		bar.style.display = "none";
		nav.classList.remove('enabled');
	}

	return {
		"enable": enable,
		"disable": disable,
	};
}

function createShadingController(panel, charMode) {
	let prev = {};
	let drawMode;
	let reduce = false;
	const bar = $("brush-toolbar");
	const nav = $('brushes');

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
	function keyDown(evt) {
		const keyCode = (evt.keyCode || evt.which);
		if (keyCode === 16) { // Shift key
			reduce = true;
		}
	}

	function keyUp(evt) {
		const keyCode = (evt.keyCode || evt.which);
		if (keyCode === 16) { // Shift key
			reduce = false;
		}
	}

	function calculateShadingCharacter(x, y) {
		// Get current cell character
		const block = State.textArtCanvas.getBlock(x, y);
		let code = block.charCode;
		const currentFG = block.foregroundColor;
		const fg = State.palette.getForegroundColor();

		if (reduce) {
			// lighten (backwards in the cycle, or erase if already lightest)
			switch (code) {
				case 176: code = 32; break;
				case 177: code = 176; break;
				case 178: code = 177; break;
				case 219: code = (currentFG === fg) ? 178 : 176; break;
				default: code = 32;
			}
		} else {
			// darken (forwards in the cycle)
			switch (code) {
				case 219: code = (currentFG !== fg) ? 176 : 219; break;
				case 178: code = 219; break;
				case 177: code = 178; break;
				case 176: code = 177; break;
				default: code = 176;
			}
		}
		return code;
	}

	function draw(coords) {
		if (prev.x !== coords.x || prev.y !== coords.y || prev.halfBlockY !== coords.halfBlockY) {
			if (Math.abs(prev.x - coords.x) > 1 || Math.abs(prev.y - coords.y) > 1) {
				State.textArtCanvas.draw((callback) => {
					line(prev.x, prev.y, coords.x, coords.y, (x, y) => {
						callback(
							charMode ? drawMode.charCode : calculateShadingCharacter(x, y),
							drawMode.foreground, drawMode.background, x, y
						);
					});
				}, false);
			} else {
				State.textArtCanvas.draw((callback) => {
					callback(
						charMode ? drawMode.charCode : calculateShadingCharacter(coords.x, coords.y),
						drawMode.foreground, drawMode.background, coords.x, coords.y
					);
				}, false);
			}
			State.positionInfo.update(coords.x, coords.y);
			prev = coords;
		}
	}

	function canvasUp() {
		prev = {};
	}

	function canvasDown(evt) {
		drawMode = panel.getMode();
		State.textArtCanvas.startUndo();
		draw(evt.detail);
	}

	function canvasDrag(evt) {
		draw(evt.detail);
	}

	function enable() {
		document.addEventListener("onTextCanvasDown", canvasDown);
		document.addEventListener("onTextCanvasUp", canvasUp);
		document.addEventListener("onTextCanvasDrag", canvasDrag);
		document.addEventListener("keydown", keyDown);
		document.addEventListener("keyup", keyUp);
		panel.enable();
		bar.style.display = "flex";
		nav.classList.add('enabled');
	}

	function disable() {
		document.removeEventListener("onTextCanvasDown", canvasDown);
		document.removeEventListener("onTextCanvasUp", canvasUp);
		document.removeEventListener("onTextCanvasDrag", canvasDrag);
		document.removeEventListener("keydown", keyDown);
		document.removeEventListener("keyup", keyUp);
		panel.disable();
		bar.style.display = "none";
		nav.classList.remove('enabled');
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
	let panelWidth = State.font.getWidth() * 20;
	const panel = createFloatingPanel(50, 50);
	const canvasContainer = document.createElement("div");
	const cursor = createPanelCursor(canvasContainer);
	const canvases = new Array(16);
	let halfBlockMode = false;
	let x = 0;
	let y = 0;
	let ignored = false;
	const nav = $('brushes');

	function updateCursor() {
		const width = canvases[0].width / 5;
		const height = canvases[0].height / 15;
		cursor.resize(width, height);
		cursor.setPos(x * width, y * height);
	}

	function mouseDownGenerator(color) {
		return function(evt) {
			const rect = canvases[color].getBoundingClientRect();
			const mouseX = evt.clientX - rect.left;
			const mouseY = evt.clientY - rect.top;
			halfBlockMode = false;
			x = Math.floor(mouseX / (canvases[color].width / 5));
			y = Math.floor(mouseY / (canvases[color].height / 15));
			updateCursor();
			cursor.show();
		};
	}

	function generateCanvases() {
		const fontHeight = State.font.getHeight();
		for (let foreground = 0; foreground < 16; foreground++) {
			const canvas = createCanvas(panelWidth, fontHeight * 15);
			const ctx = canvas.getContext("2d");
			let y = 0;
			for (var background = 0; background < 8; background++) {
				if (foreground !== background) {
					for (var i = 0; i < 4; i++) {
						State.font.draw(219, foreground, background, ctx, i, y);
					}
					for (var i = 4; i < 8; i++) {
						State.font.draw(178, foreground, background, ctx, i, y);
					}
					for (var i = 8; i < 12; i++) {
						State.font.draw(177, foreground, background, ctx, i, y);
					}
					for (var i = 12; i < 16; i++) {
						State.font.draw(176, foreground, background, ctx, i, y);
					}
					for (var i = 16; i < 20; i++) {
						State.font.draw(0, foreground, background, ctx, i, y);
					}
					y += 1;
				}
			}
			for (var background = 8; background < 16; background++) {
				if (foreground !== background) {
					for (var i = 0; i < 4; i++) {
						State.font.draw(219, foreground, background, ctx, i, y);
					}
					for (var i = 4; i < 8; i++) {
						State.font.draw(178, foreground, background, ctx, i, y);
					}
					for (var i = 8; i < 12; i++) {
						State.font.draw(177, foreground, background, ctx, i, y);
					}
					for (var i = 12; i < 16; i++) {
						State.font.draw(176, foreground, background, ctx, i, y);
					}
					for (var i = 16; i < 20; i++) {
						State.font.draw(0, foreground, background, ctx, i, y);
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
				cursor.show();
			}
		}
	}

	function enable() {
		document.addEventListener("keydown", keyDown);
		panel.enable();
		nav.classList.add('enabled');
	}

	function disable() {
		document.removeEventListener("keydown", keyDown);
		panel.disable();
		nav.classList.remove('enabled');
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
		const foreground = State.palette.getForegroundColor();
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
		cursor.hide();
		halfBlockMode = true;
	}

	async function fontChange() {
		// Use await instead of setTimeout for font change handling
		await new Promise(resolve => setTimeout(resolve, 10));
		panelWidth = State.font.getWidth() * 20;
		generateCanvases();
		updateCursor();
		canvasContainer.removeChild(canvasContainer.firstChild);
		canvasContainer.insertBefore(canvases[State.palette.getForegroundColor()], canvasContainer.firstChild);
	}

	function onPaletteChange(e) {
		State.palette = e.detail;
		canvasContainer.removeChild(canvasContainer.firstChild);
		generateCanvases();
		updateCursor();
		canvasContainer.insertBefore(canvases[State.palette.getForegroundColor()], canvasContainer.firstChild);
	}

	function select(charCode) {
		halfBlockMode = false;
		x = 3 - (charCode - 176);
		y = State.palette.getBackgroundColor();
		if (y > State.palette.getForegroundColor()) {
			y -= 1;
		}
		updateCursor();
		cursor.show();
	}

	document.addEventListener("onPaletteChange", onPaletteChange);
	document.addEventListener("onForegroundChange", foregroundChange);
	document.addEventListener("onLetterSpacingChange", fontChange);
	document.addEventListener("onFontChange", fontChange);

	generateCanvases();
	updateCursor();
	canvasContainer.insertBefore(canvases[State.palette.getForegroundColor()], canvasContainer.firstChild);
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
	let panelWidth = State.font.getWidth() * 16;
	const panel = createFloatingPanel(50, 50);
	const canvasContainer = document.createElement("div");
	const cursor = createPanelCursor(canvasContainer);
	const canvas = createCanvas(panelWidth, State.font.getHeight() * 16);
	const ctx = canvas.getContext("2d");
	let x = 0;
	let y = 0;
	let ignored = false;
	const nav = $('brushes');

	function updateCursor() {
		const width = canvas.width / 16;
		const height = canvas.height / 16;
		cursor.resize(width, height);
		cursor.setPos(x * width, y * height);
	}

	function redrawCanvas() {
		const foreground = State.palette.getForegroundColor();
		const background = State.palette.getBackgroundColor();
		for (let y = 0, charCode = 0; y < 16; y++) {
			for (let x = 0; x < 16; x++, charCode++) {
				State.font.draw(charCode, foreground, background, ctx, x, y);
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
		nav.classList.add('enabled');
	}

	function disable() {
		document.removeEventListener("keydown", keyDown);
		panel.disable();
		nav.classList.remove('enabled');
	}

	function getMode() {
		const charCode = y * 16 + x;
		return {
			"halfBlockMode": false,
			"foreground": State.palette.getForegroundColor(),
			"background": State.palette.getBackgroundColor(),
			"charCode": charCode
		};
	}

	function resizeCanvas() {
		panelWidth = State.font.getWidth() * 16;
		canvas.width = panelWidth;
		canvas.height = State.font.getHeight() * 16;
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
		resizeCanvas();
		redrawCanvas();
	}

	document.addEventListener("onForegroundChange", redrawCanvas);
	document.addEventListener("onBackgroundChange", redrawCanvas);
	document.addEventListener("onLetterSpacingChange", resizeCanvas);
	document.addEventListener("onFontChange", redrawGlyphs);
	document.addEventListener("onPaletteChange", redrawCanvas);
	document.addEventListener("onXBFontLoaded", redrawGlyphs);
	canvas.addEventListener("mouseup", mouseUp);

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
	function fillPoint(evt) {
		let block = State.textArtCanvas.getHalfBlock(evt.detail.x, evt.detail.halfBlockY);
		if (block.isBlocky) {
			const targetColor = (block.halfBlockY === 0) ? block.upperBlockColor : block.lowerBlockColor;
			const fillColor = State.palette.getForegroundColor();
			if (targetColor !== fillColor) {
				const columns = State.textArtCanvas.getColumns();
				const rows = State.textArtCanvas.getRows();
				let coord = [evt.detail.x, evt.detail.halfBlockY];
				const queue = [coord];

				// Handle mirror mode: if enabled and the mirrored position has the same color, add it to queue
				if (State.textArtCanvas.getMirrorMode()) {
					const mirrorX = State.textArtCanvas.getMirrorX(evt.detail.x);
					if (mirrorX >= 0 && mirrorX < columns) {
						const mirrorBlock = State.textArtCanvas.getHalfBlock(mirrorX, evt.detail.halfBlockY);
						if (mirrorBlock.isBlocky) {
							const mirrorTargetColor = (mirrorBlock.halfBlockY === 0) ? mirrorBlock.upperBlockColor : mirrorBlock.lowerBlockColor;
							if (mirrorTargetColor === targetColor) {
								// Add mirror position to the queue so it gets filled too
								queue.push([mirrorX, evt.detail.halfBlockY]);
							}
						}
					}
				}

				State.textArtCanvas.startUndo();
				State.textArtCanvas.drawHalfBlock((callback) => {
					while (queue.length !== 0) {
						coord = queue.pop();
						block = State.textArtCanvas.getHalfBlock(coord[0], coord[1]);
						if (block.isBlocky && (((block.halfBlockY === 0) && (block.upperBlockColor === targetColor)) || ((block.halfBlockY === 1) && (block.lowerBlockColor === targetColor)))) {
							callback(fillColor, coord[0], coord[1]);
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
							if (coord[2] !== 0 && block.leftBlockColor === targetColor) {
								State.textArtCanvas.draw(function(callback) {
									callback(221, fillColor, block.rightBlockColor, coord[0], block.textY);
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
							if (coord[2] !== 1 && block.rightBlockColor === targetColor) {
								State.textArtCanvas.draw(function(callback) {
									callback(222, fillColor, block.leftBlockColor, coord[0], block.textY);
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

function createShapesController() {
	const panel = $("shapes-toolbar");
	function enable() {
		panel.style.display = "flex";
		$('line').click();
	}
	function disable() {
		panel.style.display = "none";
	}
	return {
		"enable": enable,
		"disable": disable
	};
}

function createLineController() {
	const panel = $("shapes-toolbar");
	const nav = $('shapes');
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
		State.toolPreview.clear();
		const foreground = State.palette.getForegroundColor();
		State.textArtCanvas.startUndo();
		State.textArtCanvas.drawHalfBlock((draw) => {
			const endPoint = endXY || startXY;
			line(startXY.x, startXY.halfBlockY, endPoint.x, endPoint.halfBlockY, function(lineX, lineY) {
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
					State.toolPreview.clear();
				}
				endXY = evt.detail;
				const foreground = State.palette.getForegroundColor();
				line(startXY.x, startXY.halfBlockY, endXY.x, endXY.halfBlockY, function(lineX, lineY) {
					State.toolPreview.drawHalfBlock(foreground, lineX, lineY);
				});
			}
		}
	}

	function enable() {
		panel.style.display = "flex";
		nav.classList.add('enabled');
		document.addEventListener("onTextCanvasDown", canvasDown);
		document.addEventListener("onTextCanvasUp", canvasUp);
		document.addEventListener("onTextCanvasDrag", canvasDrag);
	}

	function disable() {
		panel.style.display = "none";
		nav.classList.remove('enabled');
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
	const panel = $("square-toolbar");
	const bar = $("shapes-toolbar");
	const nav = $('shapes');
	let startXY;
	let endXY;
	let outlineMode = true;
	const outlineToggle = createToggleButton("Outline", "Filled", () => {
		outlineMode = true;
	}, () => {
		outlineMode = false;
	});
	outlineToggle.id = "squareOpts";

	function canvasDown(evt) {
		startXY = evt.detail;
	}

	function processCoords() {
		// If endXY is undefined (no drag), use startXY as endpoint
		const endPoint = endXY || startXY;
		let x0, y0, x1, y1;
		if (startXY.x < endPoint.x) {
			x0 = startXY.x;
			x1 = endPoint.x;
		} else {
			x0 = endPoint.x;
			x1 = startXY.x;
		}
		if (startXY.halfBlockY < endPoint.halfBlockY) {
			y0 = startXY.halfBlockY;
			y1 = endPoint.halfBlockY;
		} else {
			y0 = endPoint.halfBlockY;
			y1 = startXY.halfBlockY;
		}
		return { "x0": x0, "y0": y0, "x1": x1, "y1": y1 };
	}

	function canvasUp() {
		State.toolPreview.clear();
		const coords = processCoords();
		const foreground = State.palette.getForegroundColor();
		State.textArtCanvas.startUndo();
		State.textArtCanvas.drawHalfBlock((draw) => {
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
					State.toolPreview.clear();
				}
				endXY = evt.detail;
				const coords = processCoords();
				const foreground = State.palette.getForegroundColor();
				if (outlineMode === true) {
					for (var px = coords.x0; px <= coords.x1; px++) {
						State.toolPreview.drawHalfBlock(foreground, px, coords.y0);
						State.toolPreview.drawHalfBlock(foreground, px, coords.y1);
					}
					for (var py = coords.y0 + 1; py < coords.y1; py++) {
						State.toolPreview.drawHalfBlock(foreground, coords.x0, py);
						State.toolPreview.drawHalfBlock(foreground, coords.x1, py);
					}
				} else {
					for (var py = coords.y0; py <= coords.y1; py++) {
						for (var px = coords.x0; px <= coords.x1; px++) {
							State.toolPreview.drawHalfBlock(foreground, px, py);
						}
					}
				}
			}
		}
	}

	function enable() {
		panel.classList.remove('hide');
		bar.style.display = "flex";
		nav.classList.add('enabled');
		document.addEventListener("onTextCanvasDown", canvasDown);
		document.addEventListener("onTextCanvasUp", canvasUp);
		document.addEventListener("onTextCanvasDrag", canvasDrag);
	}

	function disable() {
		panel.classList.add('hide');
		bar.style.display = "none";
		nav.classList.remove('enabled');
		document.removeEventListener("onTextCanvasDown", canvasDown);
		document.removeEventListener("onTextCanvasUp", canvasUp);
		document.removeEventListener("onTextCanvasDrag", canvasDrag);
	}

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
	const bar = $("shapes-toolbar");
	const panel = $("circle-toolbar");
	const nav = $('shapes');
	let startXY;
	let endXY;
	let outlineMode = true;
	const outlineToggle = createToggleButton("Outline", "Filled", () => {
		outlineMode = true;
	}, () => {
		outlineMode = false;
	});
	outlineToggle.id = "circleOps";

	function canvasDown(evt) {
		startXY = evt.detail;
	}

	function processCoords() {
		// If endXY is undefined (no drag), use startXY as endpoint
		const endPoint = endXY || startXY;
		let sx, sy, width, height;
		sx = startXY.x;
		sy = startXY.halfBlockY;
		width = Math.abs(endPoint.x - startXY.x);
		height = Math.abs(endPoint.halfBlockY - startXY.halfBlockY);
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
		State.toolPreview.clear();
		const coords = processCoords();
		const foreground = State.palette.getForegroundColor();
		State.textArtCanvas.startUndo();
		const columns = State.textArtCanvas.getColumns();
		const rows = State.textArtCanvas.getRows();
		const doubleRows = rows * 2;
		State.textArtCanvas.drawHalfBlock((draw) => {
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
					State.toolPreview.clear();
				}
				endXY = evt.detail;
				const coords = processCoords();
				const foreground = State.palette.getForegroundColor();
				const columns = State.textArtCanvas.getColumns();
				const rows = State.textArtCanvas.getRows();
				const doubleRows = rows * 2;
				if (outlineMode === true) {
					ellipseOutline(coords.sx, coords.sy, coords.width, coords.height, (px, py) => {
						if (px >= 0 && px < columns && py >= 0 && py < doubleRows) {
							State.toolPreview.drawHalfBlock(foreground, px, py);
						}
					});
				} else {
					ellipseFilled(coords.sx, coords.sy, coords.width, coords.height, (px, py) => {
						if (px >= 0 && px < columns && py >= 0 && py < doubleRows) {
							State.toolPreview.drawHalfBlock(foreground, px, py);
						}
					});
				}
			}
		}
	}

	function enable() {
		panel.classList.remove('hide');
		bar.style.display = "flex";
		nav.classList.add('enabled');
		document.addEventListener("onTextCanvasDown", canvasDown);
		document.addEventListener("onTextCanvasUp", canvasUp);
		document.addEventListener("onTextCanvasDrag", canvasDrag);
	}

	function disable() {
		panel.classList.add('hide');
		bar.style.display = "none";
		nav.classList.remove('enabled');
		document.removeEventListener("onTextCanvasDown", canvasDown);
		document.removeEventListener("onTextCanvasUp", canvasUp);
		document.removeEventListener("onTextCanvasDrag", canvasDrag);
	}

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

function createSampleTool(shade, divShade, characterBrush, divCharacterBrush) {
	function sample(x, halfBlockY) {
		let block = State.textArtCanvas.getHalfBlock(x, halfBlockY);
		if (block.isBlocky) {
			if (block.halfBlockY === 0) {
				State.palette.setForegroundColor(block.upperBlockColor);
			} else {
				State.palette.setForegroundColor(block.lowerBlockColor);
			}
		} else {
			block = State.textArtCanvas.getBlock(block.x, Math.floor(block.y / 2));
			State.palette.setForegroundColor(block.foregroundColor);
			State.palette.setBackgroundColor(block.backgroundColor);
			if (block.charCode >= 176 && block.charCode <= 178) {
				shade.select(block.charCode);
				divShade.click();
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

function createSelectionTool() {
	const panel = $("selection-toolbar");
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
			const selection = State.selectionCursor.getSelection();
			if (selection &&
				evt.detail.x >= selection.x && evt.detail.x < selection.x + selection.width &&
				evt.detail.y >= selection.y && evt.detail.y < selection.y + selection.height) {
				// Start dragging the selection
				isDragging = true;
				dragStartX = evt.detail.x;
				dragStartY = evt.detail.y;
			}
		} else {
			State.selectionCursor.setStart(evt.detail.x, evt.detail.y);
			State.selectionCursor.setEnd(evt.detail.x, evt.detail.y);
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
			State.selectionCursor.setEnd(evt.detail.x, evt.detail.y);
		}
	}

	function canvasUp(_) {
		if (moveMode && isDragging) {
			isDragging = false;
		}
	}

	function flipHorizontal() {
		const selection = State.selectionCursor.getSelection();
		if (!selection) {
			return;
		}

		State.textArtCanvas.startUndo();

		// Get all blocks in the selection
		for (var y = 0; y < selection.height; y++) {
			var blocks = [];
			for (let x = 0; x < selection.width; x++) {
				blocks.push(State.textArtCanvas.getBlock(selection.x + x, selection.y + y));
			}

			// Flip the row horizontally
			State.textArtCanvas.draw(function(callback) {
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

					callback(charCode, sourceBlock.foregroundColor, sourceBlock.backgroundColor, targetX, selection.y + y);
				}
			}, false);
		}
	}

	function flipVertical() {
		const selection = State.selectionCursor.getSelection();
		if (!selection) {
			return;
		}

		State.textArtCanvas.startUndo();

		// Get all blocks in the selection
		for (var x = 0; x < selection.width; x++) {
			var blocks = [];
			for (let y = 0; y < selection.height; y++) {
				blocks.push(State.textArtCanvas.getBlock(selection.x + x, selection.y + y));
			}

			// Flip the column vertically
			State.textArtCanvas.draw(function(callback) {
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

					callback(charCode, sourceBlock.foregroundColor, sourceBlock.backgroundColor, selection.x + x, targetY);
				}
			}, false);
		}
	}

	function setAreaSelective(area, targetArea, x, y) {
		// Apply selection data to target position, but only overwrite non-blank characters
		// Blank characters (char code 0, foreground 0, background 0) are treated as transparent
		const maxWidth = Math.min(area.width, State.textArtCanvas.getColumns() - x);
		const maxHeight = Math.min(area.height, State.textArtCanvas.getRows() - y);

		State.textArtCanvas.draw(function(draw) {
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
		const selection = State.selectionCursor.getSelection();
		if (!selection) {
			return;
		}

		const newX = Math.max(0, Math.min(selection.x + deltaX, State.textArtCanvas.getColumns() - selection.width));
		const newY = Math.max(0, Math.min(selection.y + deltaY, State.textArtCanvas.getRows() - selection.height));

		// Don't move if we haven't actually moved
		if (newX === selection.x && newY === selection.y) {
			return;
		}

		State.textArtCanvas.startUndo();

		// Get the current selection data if we don't have it
		if (!selectionData) {
			selectionData = State.textArtCanvas.getArea(selection.x, selection.y, selection.width, selection.height);
		}

		// Restore what was underneath the current position (if any)
		if (underlyingData) {
			State.textArtCanvas.setArea(underlyingData, selection.x, selection.y);
		}

		// Store what's underneath the new position
		underlyingData = State.textArtCanvas.getArea(newX, newY, selection.width, selection.height);

		// Apply the selection at the new position, but only non-blank characters
		setAreaSelective(selectionData, underlyingData, newX, newY);

		// Update the selection cursor to the new position
		State.selectionCursor.setStart(newX, newY);
		State.selectionCursor.setEnd(newX + selection.width - 1, newY + selection.height - 1);
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
			State.selectionCursor.getElement().classList.add("move-mode");

			// Store selection data and original position when entering move mode
			const selection = State.selectionCursor.getSelection();
			if (selection) {
				selectionData = State.textArtCanvas.getArea(selection.x, selection.y, selection.width, selection.height);
				originalPosition = { x: selection.x, y: selection.y, width: selection.width, height: selection.height };
				// What's underneath initially is empty space (what should be left when the selection moves away)
				underlyingData = createEmptyArea(selection.width, selection.height);
			}
		} else {
			// Disable move mode - finalize the move by clearing original position if different
			const currentSelection = State.selectionCursor.getSelection();
			if (originalPosition && currentSelection &&
				(currentSelection.x !== originalPosition.x || currentSelection.y !== originalPosition.y)) {
				// Only clear original position if we actually moved
				State.textArtCanvas.startUndo();
				State.textArtCanvas.deleteArea(originalPosition.x, originalPosition.y, originalPosition.width, originalPosition.height, 0);
			}

			moveButton.classList.remove("enabled");
			State.selectionCursor.getElement().classList.remove("move-mode");
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
			} else if (moveMode && State.selectionCursor.getSelection()) {
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
						State.cursor.newLine();
						break;
					case 35: // End key
						evt.preventDefault();
						State.cursor.endOfCurrentRow();
						break;
					case 36: // Home key
						evt.preventDefault();
						State.cursor.startOfCurrentRow();
						break;
					case 37: // Left arrow
						evt.preventDefault();
						State.cursor.left();
						break;
					case 38: // Up arrow
						evt.preventDefault();
						State.cursor.up();
						break;
					case 39: // Right arrow
						evt.preventDefault();
						State.cursor.right();
						break;
					case 40: // Down arrow
						evt.preventDefault();
						State.cursor.down();
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
					State.cursor.shiftToStartOfRow();
					break;
				case 39: // Meta+Right - expand selection to end of current row
					evt.preventDefault();
					State.cursor.shiftToEndOfRow();
					break;
				default:
					break;
			}
		} else if (evt.shiftKey === true && evt.metaKey === false) {
			// Handle Shift key combinations for selection
			switch (keyCode) {
				case 37: // Shift+Left
					evt.preventDefault();
					State.cursor.shiftLeft();
					break;
				case 38: // Shift+Up
					evt.preventDefault();
					State.cursor.shiftUp();
					break;
				case 39: // Shift+Right
					evt.preventDefault();
					State.cursor.shiftRight();
					break;
				case 40: // Shift+Down
					evt.preventDefault();
					State.cursor.shiftDown();
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
		panel.style.display = "flex";

		// Add click handlers for the buttons
		flipHButton.addEventListener("click", flipHorizontal);
		flipVButton.addEventListener("click", flipVertical);
		moveButton.addEventListener("click", toggleMoveMode);
	}

	function disable() {
		State.selectionCursor.hide();
		document.removeEventListener("onTextCanvasDown", canvasDown);
		document.removeEventListener("onTextCanvasDrag", canvasDrag);
		document.removeEventListener("onTextCanvasUp", canvasUp);
		document.removeEventListener("keydown", keyDown);
		panel.style.display = "none";

		// Reset move mode if it was active and finalize any pending move
		if (moveMode) {
			// Finalize the move by clearing original position if different
			const currentSelection = State.selectionCursor.getSelection();
			if (originalPosition && currentSelection &&
				(currentSelection.x !== originalPosition.x || currentSelection.y !== originalPosition.y)) {
				State.textArtCanvas.startUndo();
				State.textArtCanvas.deleteArea(originalPosition.x, originalPosition.y, originalPosition.width, originalPosition.height, 0);
			}

			moveMode = false;
			moveButton.classList.remove("enabled");
			State.selectionCursor.getElement().classList.remove("move-mode");
			selectionData = null;
			originalPosition = null;
			underlyingData = null;
		}

		// Remove click handlers
		flipHButton.removeEventListener("click", flipHorizontal);
		flipVButton.removeEventListener("click", flipVertical);
		moveButton.removeEventListener("click", toggleMoveMode);
		State.pasteTool.disable();
	}

	return {
		"enable": enable,
		"disable": disable,
		"flipHorizontal": flipHorizontal,
		"flipVertical": flipVertical
	};
}

function createAttributeBrushController() {
	let isActive = false;
	let lastCoord = null;
	const bar = $("brush-toolbar");

	function paintAttribute(x, y, altKey) {
		const block = State.textArtCanvas.getBlock(x, y);
		const currentForeground = State.palette.getForegroundColor();
		const currentBackground = State.palette.getBackgroundColor();
		let newForeground, newBackground;

		if (altKey) {
			// Alt+click modifies background color only
			newForeground = block.foregroundColor;
			newBackground = currentForeground > 7 ? currentForeground - 8 : currentForeground;
		} else {
			// Normal click modifies both foreground and background colors
			newForeground = currentForeground;
			newBackground = currentBackground;
		}

		// Only update if something changes
		if (block.foregroundColor !== newForeground || block.backgroundColor !== newBackground) {
			State.textArtCanvas.draw((callback) => {
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

			if (x === toX && y === toY) { break; }

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
		State.textArtCanvas.startUndo();
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

	function canvasUp(_) {
		isActive = false;
	}

	function enable() {
		document.addEventListener("onTextCanvasDown", canvasDown);
		document.addEventListener("onTextCanvasDrag", canvasDrag);
		document.addEventListener("onTextCanvasUp", canvasUp);
		bar.style.display = "flex";
	}

	function disable() {
		document.removeEventListener("onTextCanvasDown", canvasDown);
		document.removeEventListener("onTextCanvasDrag", canvasDrag);
		document.removeEventListener("onTextCanvasUp", canvasUp);
		bar.style.display = "none";
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
	createPanelCursor,
	createFloatingPanelPalette,
	createFloatingPanel,
	createBrushController,
	createHalfBlockController,
	createShadingController,
	createShadingPanel,
	createCharacterBrushPanel,
	createFillController,
	createLineController,
	createShapesController,
	createSquareController,
	createCircleController,
	createAttributeBrushController,
	createSelectionTool,
	createSampleTool
};
