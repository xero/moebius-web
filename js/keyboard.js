function createFKeyShorcut(canvas, charCode) {
	"use strict";
	function update() {
		canvas.style.width = font.getWidth() + "px";
		canvas.style.height = font.getHeight() + "px";
		font.draw(charCode, palette.getForegroundColour(), palette.getBackgroundColour(), canvas.getContext("2d"), 0, 0);
	}
	document.addEventListener("onForegroundChange", update);
	document.addEventListener("onBackgroundChange", update);
	document.addEventListener("onFontChange", update);

	update();
}

function createFKeysShortcut() {
	"use strict";
	var shortcuts = [176, 177, 178, 219, 223, 220, 221, 222, 254, 249, 7, 0];

	for (var i = 0; i < 12; i++) {
		createFKeyShorcut($("fkey" + i), shortcuts[i]);
	}

	function keyDown(evt) {
		var keyCode = (evt.keyCode || evt.which);
		if (evt.altKey === false && evt.ctrlKey === false && evt.metaKey === false && keyCode >= 112 && keyCode <= 124) {
			evt.preventDefault();
			textArtCanvas.startUndo();
			textArtCanvas.draw((callback) => {
				callback(shortcuts[keyCode - 112], palette.getForegroundColour(), palette.getBackgroundColour(), cursor.getX(), cursor.getY());
			}, false);
			cursor.right();
		}
	}

	function enable() {
		document.addEventListener("keydown", keyDown);

	}

	function disable() {
		document.removeEventListener("keydown", keyDown);
	}

	return {
		"enable": enable,
		"disable": disable
	};
}

function createCursor(canvasContainer) {
	"use strict";
	var canvas = createCanvas(font.getWidth(), font.getHeight());
	var x = 0;
	var y = 0;
	var dx = 0;
	var dy = 0;
	var visible = false;

	function show() {
		canvas.style.display = "block";
		visible = true;
	}

	function hide() {
		canvas.style.display = "none";
		visible = false;
	}

	function startSelection() {
		selectionCursor.setStart(x, y);
		dx = x;
		dy = y;
		hide();
	}

	function endSelection() {
		selectionCursor.hide();
		show();
	}

	function move(newX, newY) {
		if (selectionCursor.isVisible() === true) {
			endSelection();
		}
		x = Math.min(Math.max(newX, 0), textArtCanvas.getColumns() - 1);
		y = Math.min(Math.max(newY, 0), textArtCanvas.getRows() - 1);
		var canvasWidth = font.getWidth();
		canvas.style.left = (x * canvasWidth) - 1 + "px";
		canvas.style.top = (y * font.getHeight()) - 1 + "px";
		positionInfo.update(x, y);
		pasteTool.setSelection(x, y, 1, 1);
	}

	function updateDimensions() {
		canvas.width = font.getWidth() + 1;
		canvas.height = font.getHeight() + 1;
		move(x, y);
	}

	function getX() {
		return x;
	}

	function getY() {
		return y;
	}

	function left() {
		move(x - 1, y);
	}

	function right() {
		move(x + 1, y);
	}

	function up() {
		move(x, y - 1);
	}

	function down() {
		move(x, y + 1);
	}

	function newLine() {
		move(0, y + 1);
	}

	function startOfCurrentRow() {
		move(0, y);
	}

	function endOfCurrentRow() {
		move(textArtCanvas.getColumns() - 1, y);
	}

	function shiftLeft() {
		if (selectionCursor.isVisible() === false) {
			startSelection();
		}
		dx = Math.max(dx - 1, 0);
		selectionCursor.setEnd(dx, dy);
	}

	function shiftRight() {
		if (selectionCursor.isVisible() === false) {
			startSelection();
		}
		dx = Math.min(dx + 1, textArtCanvas.getColumns() - 1);
		selectionCursor.setEnd(dx, dy);
	}

	function shiftUp() {
		if (selectionCursor.isVisible() === false) {
			startSelection();
		}
		dy = Math.max(dy - 1, 0);
		selectionCursor.setEnd(dx, dy);
	}

	function shiftDown() {
		if (selectionCursor.isVisible() === false) {
			startSelection();
		}
		dy = Math.min(dy + 1, textArtCanvas.getRows() - 1);
		selectionCursor.setEnd(dx, dy);
	}

	function keyDown(evt) {
		var keyCode = (evt.keyCode || evt.which);
		if (evt.ctrlKey === false && evt.altKey === false) {
			if (evt.shiftKey === false && evt.metaKey === false) {
				switch (keyCode) {
					case 13:
						evt.preventDefault();
						newLine();
						break;
					case 35:
						evt.preventDefault();
						endOfCurrentRow();
						break;
					case 36:
						evt.preventDefault();
						startOfCurrentRow();
						break;
					case 37:
						evt.preventDefault();
						left();
						break;
					case 38:
						evt.preventDefault();
						up();
						break;
					case 39:
						evt.preventDefault();
						right();
						break;
					case 40:
						evt.preventDefault();
						down();
						break;
					default:
						break;
				}
			} else if (evt.metaKey === true && evt.shiftKey === false) {
				switch (keyCode) {
					case 37:
						evt.preventDefault();
						startOfCurrentRow();
						break;
					case 39:
						evt.preventDefault();
						endOfCurrentRow();
						break;
					default:
						break;
				}
			} else if (evt.shiftKey === true && evt.metaKey === false) {
				switch (keyCode) {
					case 37:
						evt.preventDefault();
						shiftLeft();
						break;
					case 38:
						evt.preventDefault();
						shiftUp();
						break;
					case 39:
						evt.preventDefault();
						shiftRight();
						break;
					case 40:
						evt.preventDefault();
						shiftDown();
						break;
					default:
						break;
				}
			}
		}
	}

	function enable() {
		document.addEventListener("keydown", keyDown);
		show();
		pasteTool.setSelection(x, y, 1, 1);
	}

	function disable() {
		document.removeEventListener("keydown", keyDown);
		hide();
		pasteTool.disable();
	}

	function isVisible() {
		return visible;
	}

	canvas.classList.add("cursor");
	hide();
	canvasContainer.insertBefore(canvas, canvasContainer.firstChild);
	document.addEventListener("onLetterSpacingChange", updateDimensions);
	document.addEventListener("onTextCanvasSizeChange", updateDimensions);
	document.addEventListener("onFontChange", updateDimensions);
	document.addEventListener("onOpenedFile", updateDimensions);
	move(x, y);

	return {
		"show": show,
		"hide": hide,
		"move": move,
		"getX": getX,
		"getY": getY,
		"left": left,
		"right": right,
		"up": up,
		"down": down,
		"newLine": newLine,
		"startOfCurrentRow": startOfCurrentRow,
		"endOfCurrentRow": endOfCurrentRow,
		"shiftLeft": shiftLeft,
		"shiftRight": shiftRight,
		"enable": enable,
		"disable": disable,
		"isVisible": isVisible
	};
}

function createSelectionCursor(divElement) {
	"use strict";
	var cursor = createCanvas(0, 0);
	var sx, sy, dx, dy, x, y, width, height;
	var visible = false;

	function processCoords() {
		x = Math.min(sx, dx);
		y = Math.min(sy, dy);
		x = Math.max(x, 0);
		y = Math.max(y, 0);
		var columns = textArtCanvas.getColumns();
		var rows = textArtCanvas.getRows();
		width = Math.abs(dx - sx) + 1;
		height = Math.abs(dy - sy) + 1;
		width = Math.min(width, columns - x);
		height = Math.min(height, rows - y);
	}

	function show() {
		cursor.style.display = "block";
	}

	function hide() {
		cursor.style.display = "none";
		visible = false;
		pasteTool.disable();
	}

	function updateCursor() {
		var fontWidth = font.getWidth();
		var fontHeight = font.getHeight();
		cursor.style.left = x * fontWidth - 1 + "px";
		cursor.style.top = y * fontHeight - 1 + "px";
		cursor.width = width * fontWidth + 1;
		cursor.height = height * fontHeight + 1;
	}

	function setStart(startX, startY) {
		sx = startX;
		sy = startY;
		processCoords();
		x = startX;
		y = startY;
		width = 1;
		height = 1;
		updateCursor();
	}

	function setEnd(endX, endY) {
		show();
		dx = endX;
		dy = endY;
		processCoords();
		updateCursor();
		pasteTool.setSelection(x, y, width, height);
		visible = true;
	}

	function isVisible() {
		return visible;
	}

	cursor.classList.add("selection-cursor");
	cursor.style.display = "none";
	divElement.appendChild(cursor);

	function getSelection() {
		if (visible) {
			return {
				x: x,
				y: y,
				width: width,
				height: height
			};
		}
		return null;
	}

	return {
		"show": show,
		"hide": hide,
		"setStart": setStart,
		"setEnd": setEnd,
		"isVisible": isVisible,
		"getSelection": getSelection,
		"getElement": () => cursor
	};
}

function createKeyboardController() {
	"use strict";
	var fkeys = createFKeysShortcut();
	var enabled = false;
	var ignored = false;

	function draw(charCode) {
		textArtCanvas.startUndo();
		textArtCanvas.draw((callback) => {
			callback(charCode, palette.getForegroundColour(), palette.getBackgroundColour(), cursor.getX(), cursor.getY());
		}, false);
		cursor.right();
	}

	function deleteText() {
		textArtCanvas.startUndo();
		textArtCanvas.draw((callback) => {
			callback(0, 7, 0, cursor.getX() - 1, cursor.getY());
		}, false);
		cursor.left();
	}

	// Edit action functions for insert, delete, and erase operations
	function insertRow() {
		var currentRows = textArtCanvas.getRows();
		var currentColumns = textArtCanvas.getColumns();
		var cursorY = cursor.getY();
		
		textArtCanvas.startUndo();
		
		// Create new image data with one additional row
		var newImageData = new Uint16Array(currentColumns * (currentRows + 1));
		var oldImageData = textArtCanvas.getImageData();
		
		// Copy rows before cursor position
		for (var y = 0; y < cursorY; y++) {
			for (var x = 0; x < currentColumns; x++) {
				newImageData[y * currentColumns + x] = oldImageData[y * currentColumns + x];
			}
		}
		
		// Insert blank row at cursor position (filled with spaces and default colors)
		for (var x = 0; x < currentColumns; x++) {
			newImageData[cursorY * currentColumns + x] = (32 << 8) + 7; // space character with white on black
		}
		
		// Copy rows after cursor position
		for (var y = cursorY; y < currentRows; y++) {
			for (var x = 0; x < currentColumns; x++) {
				newImageData[(y + 1) * currentColumns + x] = oldImageData[y * currentColumns + x];
			}
		}
		
		// Use the setImageData method with correct parameters
		textArtCanvas.setImageData(currentColumns, currentRows + 1, newImageData, textArtCanvas.getIceColours());
	}

	function deleteRow() {
		var currentRows = textArtCanvas.getRows();
		var currentColumns = textArtCanvas.getColumns();
		var cursorY = cursor.getY();
		
		if (currentRows <= 1) return; // Don't delete if only one row
		
		textArtCanvas.startUndo();
		
		// Create new image data with one less row
		var newImageData = new Uint16Array(currentColumns * (currentRows - 1));
		var oldImageData = textArtCanvas.getImageData();
		
		// Copy rows before cursor position
		for (var y = 0; y < cursorY; y++) {
			for (var x = 0; x < currentColumns; x++) {
				newImageData[y * currentColumns + x] = oldImageData[y * currentColumns + x];
			}
		}
		
		// Skip the row at cursor position (delete it)
		// Copy rows after cursor position
		for (var y = cursorY + 1; y < currentRows; y++) {
			for (var x = 0; x < currentColumns; x++) {
				newImageData[(y - 1) * currentColumns + x] = oldImageData[y * currentColumns + x];
			}
		}
		
		// Use the setImageData method with correct parameters
		textArtCanvas.setImageData(currentColumns, currentRows - 1, newImageData, textArtCanvas.getIceColours());
		
		// Adjust cursor position if needed
		if (cursor.getY() >= currentRows - 1) {
			cursor.move(cursor.getX(), currentRows - 2);
		}
	}

	function insertColumn() {
		var currentRows = textArtCanvas.getRows();
		var currentColumns = textArtCanvas.getColumns();
		var cursorX = cursor.getX();
		
		textArtCanvas.startUndo();
		
		// Create new image data with one additional column
		var newImageData = new Uint16Array((currentColumns + 1) * currentRows);
		var oldImageData = textArtCanvas.getImageData();
		
		for (var y = 0; y < currentRows; y++) {
			// Copy columns before cursor position
			for (var x = 0; x < cursorX; x++) {
				newImageData[y * (currentColumns + 1) + x] = oldImageData[y * currentColumns + x];
			}
			
			// Insert blank column at cursor position
			newImageData[y * (currentColumns + 1) + cursorX] = (32 << 8) + 7; // space character with white on black
			
			// Copy columns after cursor position
			for (var x = cursorX; x < currentColumns; x++) {
				newImageData[y * (currentColumns + 1) + x + 1] = oldImageData[y * currentColumns + x];
			}
		}
		
		// Use the setImageData method with correct parameters
		textArtCanvas.setImageData(currentColumns + 1, currentRows, newImageData, textArtCanvas.getIceColours());
	}

	function deleteColumn() {
		var currentRows = textArtCanvas.getRows();
		var currentColumns = textArtCanvas.getColumns();
		var cursorX = cursor.getX();
		
		if (currentColumns <= 1) return; // Don't delete if only one column
		
		textArtCanvas.startUndo();
		
		// Create new image data with one less column
		var newImageData = new Uint16Array((currentColumns - 1) * currentRows);
		var oldImageData = textArtCanvas.getImageData();
		
		for (var y = 0; y < currentRows; y++) {
			// Copy columns before cursor position
			for (var x = 0; x < cursorX; x++) {
				newImageData[y * (currentColumns - 1) + x] = oldImageData[y * currentColumns + x];
			}
			
			// Skip the column at cursor position (delete it)
			// Copy columns after cursor position
			for (var x = cursorX + 1; x < currentColumns; x++) {
				newImageData[y * (currentColumns - 1) + x - 1] = oldImageData[y * currentColumns + x];
			}
		}
		
		// Use the setImageData method with correct parameters
		textArtCanvas.setImageData(currentColumns - 1, currentRows, newImageData, textArtCanvas.getIceColours());
		
		// Adjust cursor position if needed
		if (cursor.getX() >= currentColumns - 1) {
			cursor.move(currentColumns - 2, cursor.getY());
		}
	}

	function eraseRow() {
		var currentColumns = textArtCanvas.getColumns();
		var cursorY = cursor.getY();
		
		textArtCanvas.startUndo();
		
		// Clear the entire row at cursor position
		for (var x = 0; x < currentColumns; x++) {
			textArtCanvas.draw((callback) => {
				callback(32, 7, 0, x, cursorY); // space character with white on black
			}, false);
		}
	}

	function eraseToStartOfRow() {
		var cursorX = cursor.getX();
		var cursorY = cursor.getY();
		
		textArtCanvas.startUndo();
		
		// Clear from start of row to cursor position (inclusive)
		for (var x = 0; x <= cursorX; x++) {
			textArtCanvas.draw((callback) => {
				callback(32, 7, 0, x, cursorY); // space character with white on black
			}, false);
		}
	}

	function eraseToEndOfRow() {
		var currentColumns = textArtCanvas.getColumns();
		var cursorX = cursor.getX();
		var cursorY = cursor.getY();
		
		textArtCanvas.startUndo();
		
		// Clear from cursor position to end of row
		for (var x = cursorX; x < currentColumns; x++) {
			textArtCanvas.draw((callback) => {
				callback(32, 7, 0, x, cursorY); // space character with white on black
			}, false);
		}
	}

	function eraseColumn() {
		var currentRows = textArtCanvas.getRows();
		var cursorX = cursor.getX();
		
		textArtCanvas.startUndo();
		
		// Clear the entire column at cursor position
		for (var y = 0; y < currentRows; y++) {
			textArtCanvas.draw((callback) => {
				callback(32, 7, 0, cursorX, y); // space character with white on black
			}, false);
		}
	}

	function eraseToStartOfColumn() {
		var cursorX = cursor.getX();
		var cursorY = cursor.getY();
		
		textArtCanvas.startUndo();
		
		// Clear from start of column to cursor position (inclusive)
		for (var y = 0; y <= cursorY; y++) {
			textArtCanvas.draw((callback) => {
				callback(32, 7, 0, cursorX, y); // space character with white on black
			}, false);
		}
	}

	function eraseToEndOfColumn() {
		var currentRows = textArtCanvas.getRows();
		var cursorX = cursor.getX();
		var cursorY = cursor.getY();
		
		textArtCanvas.startUndo();
		
		// Clear from cursor position to end of column
		for (var y = cursorY; y < currentRows; y++) {
			textArtCanvas.draw((callback) => {
				callback(32, 7, 0, cursorX, y); // space character with white on black
			}, false);
		}
	}

	function keyDown(evt) {
		var keyCode = (evt.keyCode || evt.which);
		if (ignored === false) {
			if (evt.altKey === false && evt.ctrlKey === false && evt.metaKey === false) {
				if (keyCode === 9) {
					evt.preventDefault();
					draw(keyCode);
				} else if (keyCode === 8) {
					evt.preventDefault();
					if (cursor.getX() > 0) {
						deleteText();
					}
				}
			} else if (evt.altKey === true && evt.ctrlKey === false && evt.metaKey === false) {
				// Alt key combinations for edit actions
				switch (keyCode) {
					case 38: // Alt+Up Arrow - Insert Row
						evt.preventDefault();
						insertRow();
						break;
					case 40: // Alt+Down Arrow - Delete Row
						evt.preventDefault();
						deleteRow();
						break;
					case 39: // Alt+Right Arrow - Insert Column
						evt.preventDefault();
						insertColumn();
						break;
					case 37: // Alt+Left Arrow - Delete Column
						evt.preventDefault();
						deleteColumn();
						break;
					case 69: // Alt+E - Erase Row (or Alt+Shift+E for Erase Column)
						evt.preventDefault();
						if (evt.shiftKey) {
							eraseColumn();
						} else {
							eraseRow();
						}
						break;
					case 36: // Alt+Home - Erase to Start of Row
						evt.preventDefault();
						eraseToStartOfRow();
						break;
					case 35: // Alt+End - Erase to End of Row
						evt.preventDefault();
						eraseToEndOfRow();
						break;
					case 33: // Alt+Page Up - Erase to Start of Column
						evt.preventDefault();
						eraseToStartOfColumn();
						break;
					case 34: // Alt+Page Down - Erase to End of Column
						evt.preventDefault();
						eraseToEndOfColumn();
						break;
				}
			}
		}
	}

	function convertUnicode(keyCode) {
		switch (keyCode) {
			case 0x2302: return 127;
			case 0x00C7: return 128;
			case 0x00FC: return 129;
			case 0x00E9: return 130;
			case 0x00E2: return 131;
			case 0x00E4: return 132;
			case 0x00E0: return 133;
			case 0x00E5: return 134;
			case 0x00E7: return 135;
			case 0x00EA: return 136;
			case 0x00EB: return 137;
			case 0x00E8: return 138;
			case 0x00EF: return 139;
			case 0x00EE: return 140;
			case 0x00EC: return 141;
			case 0x00C4: return 142;
			case 0x00C5: return 143;
			case 0x00C9: return 144;
			case 0x00E6: return 145;
			case 0x00C6: return 146;
			case 0x00F4: return 147;
			case 0x00F6: return 148;
			case 0x00F2: return 149;
			case 0x00FB: return 150;
			case 0x00F9: return 151;
			case 0x00FF: return 152;
			case 0x00D6: return 153;
			case 0x00DC: return 154;
			case 0x00A2: return 155;
			case 0x00A3: return 156;
			case 0x00A5: return 157;
			case 0x20A7: return 158;
			case 0x0192: return 159;
			case 0x00E1: return 160;
			case 0x00ED: return 161;
			case 0x00F3: return 162;
			case 0x00FA: return 163;
			case 0x00F1: return 164;
			case 0x00D1: return 165;
			case 0x00AA: return 166;
			case 0x00BA: return 167;
			case 0x00BF: return 168;
			case 0x2310: return 169;
			case 0x00AC: return 170;
			case 0x00BD: return 171;
			case 0x00BC: return 172;
			case 0x00A1: return 173;
			case 0x00AB: return 174;
			case 0x00BB: return 175;
			case 0x2591: return 176;
			case 0x2592: return 177;
			case 0x2593: return 178;
			case 0x2502: return 179;
			case 0x2524: return 180;
			case 0x2561: return 181;
			case 0x2562: return 182;
			case 0x2556: return 183;
			case 0x2555: return 184;
			case 0x2563: return 185;
			case 0x2551: return 186;
			case 0x2557: return 187;
			case 0x255D: return 188;
			case 0x255C: return 189;
			case 0x255B: return 190;
			case 0x2510: return 191;
			case 0x2514: return 192;
			case 0x2534: return 193;
			case 0x252C: return 194;
			case 0x251C: return 195;
			case 0x2500: return 196;
			case 0x253C: return 197;
			case 0x255E: return 198;
			case 0x255F: return 199;
			case 0x255A: return 200;
			case 0x2554: return 201;
			case 0x2569: return 202;
			case 0x2566: return 203;
			case 0x2560: return 204;
			case 0x2550: return 205;
			case 0x256C: return 206;
			case 0x2567: return 207;
			case 0x2568: return 208;
			case 0x2564: return 209;
			case 0x2565: return 210;
			case 0x2559: return 211;
			case 0x2558: return 212;
			case 0x2552: return 213;
			case 0x2553: return 214;
			case 0x256B: return 215;
			case 0x256A: return 216;
			case 0x2518: return 217;
			case 0x250C: return 218;
			case 0x2588: return 219;
			case 0x2584: return 220;
			case 0x258C: return 221;
			case 0x2590: return 222;
			case 0x2580: return 223;
			case 0x03B1: return 224;
			case 0x00DF: return 225;
			case 0x0393: return 226;
			case 0x03C0: return 227;
			case 0x03A3: return 228;
			case 0x03C3: return 229;
			case 0x00B5: return 230;
			case 0x03C4: return 231;
			case 0x03A6: return 232;
			case 0x0398: return 233;
			case 0x03A9: return 234;
			case 0x03B4: return 235;
			case 0x221E: return 236;
			case 0x03C6: return 237;
			case 0x03B5: return 238;
			case 0x2229: return 239;
			case 0x2261: return 240;
			case 0x00B1: return 241;
			case 0x2265: return 242;
			case 0x2264: return 243;
			case 0x2320: return 244;
			case 0x2321: return 245;
			case 0x00F7: return 246;
			case 0x2248: return 247;
			case 0x00B0: return 248;
			case 0x2219: return 249;
			case 0x00B7: return 250;
			case 0x221A: return 251;
			case 0x207F: return 252;
			case 0x00B2: return 253;
			case 0x25A0: return 254;
			case 0x00A0: return 255;
			default: return keyCode;
		}
	}

	function keyPress(evt) {
		var keyCode = (evt.keyCode || evt.which);
		if (ignored === false) {
			if (evt.altKey === false && evt.ctrlKey === false && evt.metaKey === false) {
				if (keyCode >= 32) {
					evt.preventDefault();
					draw(convertUnicode(keyCode));
				} else if (keyCode === 13) {
					evt.preventDefault();
					cursor.newLine();
				} else if (keyCode === 8) {
					evt.preventDefault();
					if (cursor.getX() > 0) {
						deleteText();
					}
				} else if (keyCode === 167) {
					evt.preventDefault();
					draw(21);
				}
			} else if (evt.ctrlKey === true) {
				if (keyCode === 21) {
					evt.preventDefault();
					var block = textArtCanvas.getBlock(cursor.getX(), cursor.getY());
					palette.setForegroundColour(block.foregroundColour);
					palette.setBackgroundColour(block.backgroundColour);
				}
			}
		}
	}

	function textCanvasDown(evt) {
		cursor.move(evt.detail.x, evt.detail.y);
		selectionCursor.setStart(evt.detail.x, evt.detail.y);
	}

	function textCanvasDrag(evt) {
		cursor.hide();
		selectionCursor.setEnd(evt.detail.x, evt.detail.y);
	}

	function enable() {
		document.addEventListener("keydown", keyDown);
		document.addEventListener("keypress", keyPress);
		document.addEventListener("onTextCanvasDown", textCanvasDown);
		document.addEventListener("onTextCanvasDrag", textCanvasDrag);
		cursor.enable();
		fkeys.enable();
		positionInfo.update(cursor.getX(), cursor.getY());
		enabled = true;
	}

	function disable() {
		document.removeEventListener("keydown", keyDown);
		document.removeEventListener("keypress", keyPress);
		document.removeEventListener("onTextCanvasDown", textCanvasDown);
		document.removeEventListener("onTextCanvasDrag", textCanvasDrag);
		selectionCursor.hide();
		cursor.disable();
		fkeys.disable();
		enabled = false;
	}

	function ignore() {
		ignored = true;
		if (enabled === true) {
			cursor.disable();
			fkeys.disable();
		}
	}

	function unignore() {
		ignored = false;
		if (enabled === true) {
			cursor.enable();
			fkeys.enable();
		}
	}

	return {
		"enable": enable,
		"disable": disable,
		"ignore": ignore,
		"unignore": unignore,
		"insertRow": insertRow,
		"deleteRow": deleteRow,
		"insertColumn": insertColumn,
		"deleteColumn": deleteColumn,
		"eraseRow": eraseRow,
		"eraseToStartOfRow": eraseToStartOfRow,
		"eraseToEndOfRow": eraseToEndOfRow,
		"eraseColumn": eraseColumn,
		"eraseToStartOfColumn": eraseToStartOfColumn,
		"eraseToEndOfColumn": eraseToEndOfColumn
	};
}

function createPasteTool(cutItem, copyItem, pasteItem, deleteItem) {
	"use strict";
	var buffer;
	var x = 0;
	var y = 0;
	var width = 0;
	var height = 0;
	var enabled = false;

	function setSelection(newX, newY, newWidth, newHeight) {
		x = newX;
		y = newY;
		width = newWidth;
		height = newHeight;
		if (buffer !== undefined) {
			pasteItem.classList.remove("disabled");
		}
		cutItem.classList.remove("disabled");
		copyItem.classList.remove("disabled");
		deleteItem.classList.remove("disabled");
		enabled = true;
	}

	function disable() {
		pasteItem.classList.add("disabled");
		cutItem.classList.add("disabled");
		copyItem.classList.add("disabled");
		deleteItem.classList.add("disabled");
		enabled = false;
	}

	function copy() {
		buffer = textArtCanvas.getArea(x, y, width, height);
		pasteItem.classList.remove("disabled");
	}

	function deleteSelection() {
		if (selectionCursor.isVisible() || cursor.isVisible()) {
			textArtCanvas.startUndo();
			textArtCanvas.deleteArea(x, y, width, height, palette.getBackgroundColour());
		}
	}

	function cut() {
		if (selectionCursor.isVisible() || cursor.isVisible()) {
			copy();
			deleteSelection();
		}
	}

	function paste() {
		if (buffer !== undefined && (selectionCursor.isVisible() || cursor.isVisible())) {
			textArtCanvas.startUndo();
			textArtCanvas.setArea(buffer, x, y);
		}
	}

	function systemPaste() {
		if (!navigator.clipboard || !navigator.clipboard.readText) {
			console.log("Clipboard API not available");
			return;
		}

		navigator.clipboard.readText().then(text => {
			if (text && (selectionCursor.isVisible() || cursor.isVisible())) {
				var columns = textArtCanvas.getColumns();
				var rows = textArtCanvas.getRows();
				
				// Check for oversized content
				var lines = text.split(/\r\n|\r|\n/);
				
				// Check single line width
				if (lines.length === 1 && lines[0].length > columns * 3) {
					alert("Paste buffer too large. Single line content exceeds " + (columns * 3) + " characters. Please copy smaller blocks.");
					return;
				}
				
				// Check multi-line height
				if (lines.length > rows * 3) {
					alert("Paste buffer too large. Content exceeds " + (rows * 3) + " lines. Please copy smaller blocks.");
					return;
				}
				
				textArtCanvas.startUndo();
				
				var currentX = x;
				var currentY = y;
				var startX = x; // Remember starting column for line breaks
				var foreground = palette.getForegroundColour();
				var background = palette.getBackgroundColour();

				textArtCanvas.draw(function(draw) {
					for (var i = 0; i < text.length; i++) {
						var char = text.charAt(i);
						
						// Handle newline characters
						if (char === '\n' || char === '\r') {
							currentY++;
							currentX = startX;
							// Skip \r\n combination
							if (char === '\r' && i + 1 < text.length && text.charAt(i + 1) === '\n') {
								i++;
							}
							continue;
						}
						
						// Check bounds - stop if we're beyond canvas vertically
						if (currentY >= rows) {
							break;
						}
						
						// Handle edge truncation - skip characters that exceed the right edge
						if (currentX >= columns) {
							// Skip this character and continue until we hit a newline
							continue;
						}
						
						// Handle non-printable characters
						var charCode = char.charCodeAt(0);
						
						// Convert tabs and other whitespace/non-printable characters to space
						if (char === '\t' || charCode < 32 || charCode === 127) {
							charCode = 32; // space
						}
						
						// Draw the character
						draw(charCode, foreground, background, currentX, currentY);
						
						currentX++;
					}
				}, false);
			}
		}).catch(err => {
			console.log("Failed to read clipboard:", err);
		});
	}

	function keyDown(evt) {
		var keyCode = (evt.keyCode || evt.which);
		if (enabled) {
			if ((evt.ctrlKey === true || evt.metaKey === true) && evt.altKey === false && evt.shiftKey === false) {
				switch (keyCode) {
					case 88:
						evt.preventDefault();
						cut();
						break;
					case 67:
						evt.preventDefault();
						copy();
						break;
					case 86:
						evt.preventDefault();
						paste();
						break;
					default:
						break;
				}
			}
			// System paste with Ctrl+Shift+V
			if ((evt.ctrlKey === true || evt.metaKey === true) && evt.shiftKey === true && evt.altKey === false && keyCode === 86) {
				evt.preventDefault();
				systemPaste();
			}
		}
		if ((evt.ctrlKey === true || evt.metaKey === true) && keyCode === 8) {
			evt.preventDefault();
			deleteSelection();
		}
	}


	document.addEventListener("keydown", keyDown);

	return {
		"setSelection": setSelection,
		"cut": cut,
		"copy": copy,
		"paste": paste,
		"systemPaste": systemPaste,
		"deleteSelection": deleteSelection,
		"disable": disable
	};
}
