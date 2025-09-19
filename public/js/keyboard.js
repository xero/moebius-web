import State from './state.js';
import Toolbar from './toolbar.js';
import { $, createCanvas } from './ui.js';

const createFKeyShorcut = (canvas, charCode) => {
	const update = () => {
		// Set actual canvas dimensions for proper rendering
		canvas.width = State.font.getWidth();
		canvas.height = State.font.getHeight();
		// Set CSS dimensions for display
		canvas.style.width = State.font.getWidth() + 'px';
		canvas.style.height = State.font.getHeight() + 'px';
		State.font.draw(
			charCode,
			State.palette.getForegroundColor(),
			State.palette.getBackgroundColor(),
			canvas.getContext('2d'),
			0,
			0,
		);
	};
	document.addEventListener('onPaletteChange', update);
	document.addEventListener('onForegroundChange', update);
	document.addEventListener('onBackgroundChange', update);
	document.addEventListener('onFontChange', update);

	update();
};

const createFKeysShortcut = () => {
	const shortcuts = [176, 177, 178, 219, 223, 220, 221, 222, 254, 249, 7, 0];

	for (let i = 0; i < 12; i++) {
		createFKeyShorcut($('fkey' + i), shortcuts[i]);
	}

	const keyDown = e => {
		// Handle F1-F12 function keys (F1=112, F2=113, ..., F12=123)
		const fKeyMatch = e.code.match(/^F(\d+)$/);
		if (
			e.altKey === false &&
			e.ctrlKey === false &&
			e.metaKey === false &&
			fKeyMatch &&
			fKeyMatch[1] >= 1 &&
			fKeyMatch[1] <= 12
		) {
			e.preventDefault();
			State.textArtCanvas.startUndo();
			State.textArtCanvas.draw(callback => {
				callback(
					shortcuts[fKeyMatch[1] - 1],
					State.palette.getForegroundColor(),
					State.palette.getBackgroundColor(),
					State.cursor.getX(),
					State.cursor.getY(),
				);
			}, false);
			State.cursor.right();
		}
	};

	const enable = () => {
		document.addEventListener('keydown', keyDown);
	};

	const disable = () => {
		document.removeEventListener('keydown', keyDown);
	};

	return {
		enable: enable,
		disable: disable,
	};
};

const createCursor = canvasContainer => {
	const canvas = createCanvas(State.font.getWidth(), State.font.getHeight());
	let x = 0;
	let y = 0;
	let dx = 0;
	let dy = 0;
	let visible = false;

	const show = () => {
		canvas.style.display = 'block';
		visible = true;
	};

	const hide = () => {
		canvas.style.display = 'none';
		visible = false;
	};

	const startSelection = () => {
		State.selectionCursor.setStart(x, y);
		dx = x;
		dy = y;
		hide();
	};

	const endSelection = () => {
		State.selectionCursor.hide();
		show();
	};

	const move = (newX, newY) => {
		if (State.selectionCursor.isVisible() === true) {
			endSelection();
		}
		x = Math.min(Math.max(newX, 0), State.textArtCanvas.getColumns() - 1);
		y = Math.min(Math.max(newY, 0), State.textArtCanvas.getRows() - 1);
		const canvasWidth = State.font.getWidth();
		canvas.style.left = x * canvasWidth - 1 + 'px';
		canvas.style.top = y * State.font.getHeight() - 1 + 'px';
		State.positionInfo.update(x, y);
		State.pasteTool.setSelection(x, y, 1, 1);
	};

	const updateDimensions = () => {
		canvas.width = State.font.getWidth() + 1;
		canvas.height = State.font.getHeight() + 1;
		move(x, y);
	};

	const getX = () => {
		return x;
	};

	const getY = () => {
		return y;
	};

	const left = () => {
		move(x - 1, y);
	};

	const right = () => {
		move(x + 1, y);
	};

	const up = () => {
		move(x, y - 1);
	};

	const down = () => {
		move(x, y + 1);
	};

	const newLine = () => {
		move(0, y + 1);
	};

	const startOfCurrentRow = () => {
		move(0, y);
	};

	const endOfCurrentRow = () => {
		move(State.textArtCanvas.getColumns() - 1, y);
	};

	const shiftLeft = () => {
		if (State.selectionCursor.isVisible() === false) {
			startSelection();
			if (Toolbar.getCurrentTool() === 'keyboard') {
				Toolbar.switchTool('selection');
			}
		}
		dx = Math.max(dx - 1, 0);
		State.selectionCursor.setEnd(dx, dy);
	};

	const shiftRight = () => {
		if (State.selectionCursor.isVisible() === false) {
			startSelection();
			if (Toolbar.getCurrentTool() === 'keyboard') {
				Toolbar.switchTool('selection');
			}
		}
		dx = Math.min(dx + 1, State.textArtCanvas.getColumns() - 1);
		State.selectionCursor.setEnd(dx, dy);
	};

	const shiftUp = () => {
		if (State.selectionCursor.isVisible() === false) {
			startSelection();
			if (Toolbar.getCurrentTool() === 'keyboard') {
				Toolbar.switchTool('selection');
			}
		}
		dy = Math.max(dy - 1, 0);
		State.selectionCursor.setEnd(dx, dy);
	};

	const shiftDown = () => {
		if (State.selectionCursor.isVisible() === false) {
			startSelection();
			if (Toolbar.getCurrentTool() === 'keyboard') {
				Toolbar.switchTool('selection');
			}
		}
		dy = Math.min(dy + 1, State.textArtCanvas.getRows() - 1);
		State.selectionCursor.setEnd(dx, dy);
	};

	const shiftToStartOfRow = () => {
		if (State.selectionCursor.isVisible() === false) {
			startSelection();
			if (Toolbar.getCurrentTool() === 'keyboard') {
				Toolbar.switchTool('selection');
			}
		}
		dx = 0;
		State.selectionCursor.setEnd(dx, dy);
	};

	const shiftToEndOfRow = () => {
		if (State.selectionCursor.isVisible() === false) {
			startSelection();
			if (Toolbar.getCurrentTool() === 'keyboard') {
				Toolbar.switchTool('selection');
			}
		}
		dx = State.textArtCanvas.getColumns() - 1;
		State.selectionCursor.setEnd(dx, dy);
	};

	const keyDown = e => {
		if (e.ctrlKey === false && e.altKey === false) {
			if (e.shiftKey === false && e.metaKey === false) {
				switch (e.code) {
					case 'Enter': // Enter key
						e.preventDefault();
						newLine();
						break;
					case 'End': // End key
						e.preventDefault();
						endOfCurrentRow();
						break;
					case 'Home': // Home key
						e.preventDefault();
						startOfCurrentRow();
						break;
					case 'ArrowLeft': // Left arrow
						e.preventDefault();
						left();
						break;
					case 'ArrowUp': // Up arrow
						e.preventDefault();
						up();
						break;
					case 'ArrowRight': // Right arrow
						e.preventDefault();
						right();
						break;
					case 'ArrowDown': // Down arrow
						e.preventDefault();
						down();
						break;
					default:
						break;
				}
			} else if (e.metaKey === true && e.shiftKey === false) {
				switch (e.code) {
					case 'ArrowLeft': // Cmd/Meta + Left arrow
						e.preventDefault();
						startOfCurrentRow();
						break;
					case 'ArrowRight': // Cmd/Meta + Right arrow
						e.preventDefault();
						endOfCurrentRow();
						break;
					default:
						break;
				}
			} else if (e.shiftKey === true && e.metaKey === false) {
				switch (e.code) {
					case 'ArrowLeft': // Shift + Left arrow
						e.preventDefault();
						shiftLeft();
						break;
					case 'ArrowUp': // Shift + Up arrow
						e.preventDefault();
						shiftUp();
						break;
					case 'ArrowRight': // Shift + Right arrow
						e.preventDefault();
						shiftRight();
						break;
					case 'ArrowDown': // Shift + Down arrow
						e.preventDefault();
						shiftDown();
						break;
					default:
						break;
				}
			}
		}
	};

	const enable = () => {
		document.addEventListener('keydown', keyDown);
		show();
		State.pasteTool.setSelection(x, y, 1, 1);
	};

	const disable = () => {
		document.removeEventListener('keydown', keyDown);
		hide();
		State.pasteTool.disable();
	};

	const isVisible = () => {
		return visible;
	};

	canvas.classList.add('cursor');
	hide();
	canvasContainer.insertBefore(canvas, canvasContainer.firstChild);
	document.addEventListener('onLetterSpacingChange', updateDimensions);
	document.addEventListener('onTextCanvasSizeChange', updateDimensions);
	document.addEventListener('onFontChange', updateDimensions);
	document.addEventListener('onOpenedFile', updateDimensions);
	move(x, y);

	return {
		show: show,
		hide: hide,
		move: move,
		getX: getX,
		getY: getY,
		left: left,
		right: right,
		up: up,
		down: down,
		newLine: newLine,
		startOfCurrentRow: startOfCurrentRow,
		endOfCurrentRow: endOfCurrentRow,
		shiftLeft: shiftLeft,
		shiftRight: shiftRight,
		shiftUp: shiftUp,
		shiftDown: shiftDown,
		shiftToStartOfRow: shiftToStartOfRow,
		shiftToEndOfRow: shiftToEndOfRow,
		enable: enable,
		disable: disable,
		isVisible: isVisible,
	};
};

const createSelectionCursor = divElement => {
	const cursor = createCanvas(0, 0);
	let sx, sy, dx, dy, x, y, width, height;
	let visible = false;

	const processCoords = () => {
		x = Math.min(sx, dx);
		y = Math.min(sy, dy);
		x = Math.max(x, 0);
		y = Math.max(y, 0);
		const columns = State.textArtCanvas.getColumns();
		const rows = State.textArtCanvas.getRows();
		width = Math.abs(dx - sx) + 1;
		height = Math.abs(dy - sy) + 1;
		width = Math.min(width, columns - x);
		height = Math.min(height, rows - y);
	};

	const show = () => {
		cursor.style.display = 'block';
	};

	const hide = () => {
		cursor.style.display = 'none';
		visible = false;
		State.pasteTool.disable();
	};

	const updateCursor = () => {
		const fontWidth = State.font.getWidth();
		const fontHeight = State.font.getHeight();
		cursor.style.left = x * fontWidth - 1 + 'px';
		cursor.style.top = y * fontHeight - 1 + 'px';
		cursor.width = width * fontWidth + 1;
		cursor.height = height * fontHeight + 1;
	};

	const setStart = (startX, startY) => {
		sx = startX;
		sy = startY;
		processCoords();
		x = startX;
		y = startY;
		width = 1;
		height = 1;
		updateCursor();
	};

	const setEnd = (endX, endY) => {
		show();
		dx = endX;
		dy = endY;
		processCoords();
		updateCursor();
		State.pasteTool.setSelection(x, y, width, height);
		visible = true;
	};

	const isVisible = () => {
		return visible;
	};

	const getSelection = () => {
		if (visible) {
			return {
				x: x,
				y: y,
				width: width,
				height: height,
			};
		}
		return null;
	};

	cursor.classList.add('selection-cursor');
	cursor.style.display = 'none';
	divElement.appendChild(cursor);

	return {
		show: show,
		hide: hide,
		setStart: setStart,
		setEnd: setEnd,
		isVisible: isVisible,
		getSelection: getSelection,
		getElement: () => cursor,
	};
};

const createKeyboardController = () => {
	const fkeys = createFKeysShortcut();
	let enabled = false;
	let ignored = false;

	const draw = charCode => {
		State.textArtCanvas.startUndo();
		State.textArtCanvas.draw(callback => {
			callback(
				charCode,
				State.palette.getForegroundColor(),
				State.palette.getBackgroundColor(),
				State.cursor.getX(),
				State.cursor.getY(),
			);
		}, false);
		State.cursor.right();
	};

	const deleteText = () => {
		State.textArtCanvas.startUndo();
		State.textArtCanvas.draw(callback => {
			callback(0, 7, 0, State.cursor.getX() - 1, State.cursor.getY());
		}, false);
		State.cursor.left();
	};

	// Edit actions for insert, delete, and erase operations
	const insertRow = () => {
		const currentRows = State.textArtCanvas.getRows();
		const currentColumns = State.textArtCanvas.getColumns();
		const cursorY = State.cursor.getY();

		State.textArtCanvas.startUndo();

		const newImageData = new Uint16Array(currentColumns * (currentRows + 1));
		const oldImageData = State.textArtCanvas.getImageData();

		for (let y = 0; y < cursorY; y++) {
			for (let x = 0; x < currentColumns; x++) {
				newImageData[y * currentColumns + x] = oldImageData[y * currentColumns + x];
			}
		}

		for (let x = 0; x < currentColumns; x++) {
			newImageData[cursorY * currentColumns + x] = (32 << 8) + 7; // space character with white on black
		}

		for (let y = cursorY; y < currentRows; y++) {
			for (let x = 0; x < currentColumns; x++) {
				newImageData[(y + 1) * currentColumns + x] = oldImageData[y * currentColumns + x];
			}
		}

		State.textArtCanvas.setImageData(currentColumns, currentRows + 1, newImageData, State.textArtCanvas.getIceColors());
	};

	const deleteRow = () => {
		const currentRows = State.textArtCanvas.getRows();
		const currentColumns = State.textArtCanvas.getColumns();
		const cursorY = State.cursor.getY();

		if (currentRows <= 1) {
			return;
		} // Don't delete if only one row

		State.textArtCanvas.startUndo();

		const newImageData = new Uint16Array(currentColumns * (currentRows - 1));
		const oldImageData = State.textArtCanvas.getImageData();

		for (let y = 0; y < cursorY; y++) {
			for (let x = 0; x < currentColumns; x++) {
				newImageData[y * currentColumns + x] = oldImageData[y * currentColumns + x];
			}
		}

		// Skip the row at cursor position (delete it)
		// Copy rows after cursor position
		for (let y = cursorY + 1; y < currentRows; y++) {
			for (let x = 0; x < currentColumns; x++) {
				newImageData[(y - 1) * currentColumns + x] = oldImageData[y * currentColumns + x];
			}
		}

		State.textArtCanvas.setImageData(currentColumns, currentRows - 1, newImageData, State.textArtCanvas.getIceColors());

		if (State.cursor.getY() >= currentRows - 1) {
			State.cursor.move(State.cursor.getX(), currentRows - 2);
		}
	};

	const insertColumn = () => {
		const currentRows = State.textArtCanvas.getRows();
		const currentColumns = State.textArtCanvas.getColumns();
		const cursorX = State.cursor.getX();

		State.textArtCanvas.startUndo();

		const newImageData = new Uint16Array((currentColumns + 1) * currentRows);
		const oldImageData = State.textArtCanvas.getImageData();

		for (let y = 0; y < currentRows; y++) {
			for (let x = 0; x < cursorX; x++) {
				newImageData[y * (currentColumns + 1) + x] = oldImageData[y * currentColumns + x];
			}

			newImageData[y * (currentColumns + 1) + cursorX] = (32 << 8) + 7;

			for (let x = cursorX; x < currentColumns; x++) {
				newImageData[y * (currentColumns + 1) + x + 1] = oldImageData[y * currentColumns + x];
			}
		}

		State.textArtCanvas.setImageData(currentColumns + 1, currentRows, newImageData, State.textArtCanvas.getIceColors());
	};

	const deleteColumn = () => {
		const currentRows = State.textArtCanvas.getRows();
		const currentColumns = State.textArtCanvas.getColumns();
		const cursorX = State.cursor.getX();

		if (currentColumns <= 1) {
			return;
		} // Don't delete if only one column

		State.textArtCanvas.startUndo();

		const newImageData = new Uint16Array((currentColumns - 1) * currentRows);
		const oldImageData = State.textArtCanvas.getImageData();

		for (let y = 0; y < currentRows; y++) {
			for (let x = 0; x < cursorX; x++) {
				newImageData[y * (currentColumns - 1) + x] = oldImageData[y * currentColumns + x];
			}

			// Skip the column at cursor position (delete it)
			for (let x = cursorX + 1; x < currentColumns; x++) {
				newImageData[y * (currentColumns - 1) + x - 1] = oldImageData[y * currentColumns + x];
			}
		}

		State.textArtCanvas.setImageData(currentColumns - 1, currentRows, newImageData, State.textArtCanvas.getIceColors());

		if (State.cursor.getX() >= currentColumns - 1) {
			State.cursor.move(currentColumns - 2, State.cursor.getY());
		}
	};

	const eraseRow = () => {
		const currentColumns = State.textArtCanvas.getColumns();
		const cursorY = State.cursor.getY();

		State.textArtCanvas.startUndo();

		for (let x = 0; x < currentColumns; x++) {
			State.textArtCanvas.draw(callback => {
				callback(32, 7, 0, x, cursorY);
			}, false);
		}
	};

	const eraseToStartOfRow = () => {
		const cursorX = State.cursor.getX();
		const cursorY = State.cursor.getY();

		State.textArtCanvas.startUndo();

		for (let x = 0; x <= cursorX; x++) {
			State.textArtCanvas.draw(callback => {
				callback(32, 7, 0, x, cursorY);
			}, false);
		}
	};

	const eraseToEndOfRow = () => {
		const currentColumns = State.textArtCanvas.getColumns();
		const cursorX = State.cursor.getX();
		const cursorY = State.cursor.getY();

		State.textArtCanvas.startUndo();

		for (let x = cursorX; x < currentColumns; x++) {
			State.textArtCanvas.draw(callback => {
				callback(32, 7, 0, x, cursorY);
			}, false);
		}
	};

	const eraseColumn = () => {
		const currentRows = State.textArtCanvas.getRows();
		const cursorX = State.cursor.getX();

		State.textArtCanvas.startUndo();

		for (let y = 0; y < currentRows; y++) {
			State.textArtCanvas.draw(callback => {
				callback(32, 7, 0, cursorX, y);
			}, false);
		}
	};

	const eraseToStartOfColumn = () => {
		const cursorX = State.cursor.getX();
		const cursorY = State.cursor.getY();

		State.textArtCanvas.startUndo();

		for (let y = 0; y <= cursorY; y++) {
			State.textArtCanvas.draw(callback => {
				callback(32, 7, 0, cursorX, y);
			}, false);
		}
	};

	const eraseToEndOfColumn = () => {
		const currentRows = State.textArtCanvas.getRows();
		const cursorX = State.cursor.getX();
		const cursorY = State.cursor.getY();

		State.textArtCanvas.startUndo();

		for (let y = cursorY; y < currentRows; y++) {
			State.textArtCanvas.draw(callback => {
				callback(32, 7, 0, cursorX, y);
			}, false);
		}
	};

	const keyDown = e => {
		if (ignored === false) {
			if (e.altKey === false && e.ctrlKey === false && e.metaKey === false) {
				if (e.code === 'Tab') {
					// Tab key
					e.preventDefault();
					draw(9); // Tab character code
				} else if (e.code === 'Backspace') {
					// Backspace key
					e.preventDefault();
					if (State.cursor.getX() > 0) {
						deleteText();
					}
				}
			} else if (e.altKey === true && e.ctrlKey === false && e.metaKey === false) {
				// Alt key combinations for edit actions
				switch (e.code) {
					case 'ArrowUp': // Alt+Up Arrow - Insert Row
						e.preventDefault();
						insertRow();
						break;
					case 'ArrowDown': // Alt+Down Arrow - Delete Row
						e.preventDefault();
						deleteRow();
						break;
					case 'ArrowRight': // Alt+Right Arrow - Insert Column
						e.preventDefault();
						insertColumn();
						break;
					case 'ArrowLeft': // Alt+Left Arrow - Delete Column
						e.preventDefault();
						deleteColumn();
						break;
					case 'KeyE': // Alt+E - Erase Row (or Alt+Shift+E for Erase Column)
						e.preventDefault();
						if (e.shiftKey) {
							eraseColumn();
						} else {
							eraseRow();
						}
						break;
					case 'Home': // Alt+Home - Erase to Start of Row
						e.preventDefault();
						eraseToStartOfRow();
						break;
					case 'End': // Alt+End - Erase to End of Row
						e.preventDefault();
						eraseToEndOfRow();
						break;
					case 'PageUp': // Alt+Page Up - Erase to Start of Column
						e.preventDefault();
						eraseToStartOfColumn();
						break;
					case 'PageDown': // Alt+Page Down - Erase to End of Column
						e.preventDefault();
						eraseToEndOfColumn();
						break;
				}
			}
		}
	};

	const convertUnicode = keyCode => {
		switch (keyCode) {
			case 0x2302:
				return 127;
			case 0x00c7:
				return 128;
			case 0x00fc:
				return 129;
			case 0x00e9:
				return 130;
			case 0x00e2:
				return 131;
			case 0x00e4:
				return 132;
			case 0x00e0:
				return 133;
			case 0x00e5:
				return 134;
			case 0x00e7:
				return 135;
			case 0x00ea:
				return 136;
			case 0x00eb:
				return 137;
			case 0x00e8:
				return 138;
			case 0x00ef:
				return 139;
			case 0x00ee:
				return 140;
			case 0x00ec:
				return 141;
			case 0x00c4:
				return 142;
			case 0x00c5:
				return 143;
			case 0x00c9:
				return 144;
			case 0x00e6:
				return 145;
			case 0x00c6:
				return 146;
			case 0x00f4:
				return 147;
			case 0x00f6:
				return 148;
			case 0x00f2:
				return 149;
			case 0x00fb:
				return 150;
			case 0x00f9:
				return 151;
			case 0x00ff:
				return 152;
			case 0x00d6:
				return 153;
			case 0x00dc:
				return 154;
			case 0x00a2:
				return 155;
			case 0x00a3:
				return 156;
			case 0x00a5:
				return 157;
			case 0x20a7:
				return 158;
			case 0x0192:
				return 159;
			case 0x00e1:
				return 160;
			case 0x00ed:
				return 161;
			case 0x00f3:
				return 162;
			case 0x00fa:
				return 163;
			case 0x00f1:
				return 164;
			case 0x00d1:
				return 165;
			case 0x00aa:
				return 166;
			case 0x00ba:
				return 167;
			case 0x00bf:
				return 168;
			case 0x2310:
				return 169;
			case 0x00ac:
				return 170;
			case 0x00bd:
				return 171;
			case 0x00bc:
				return 172;
			case 0x00a1:
				return 173;
			case 0x00ab:
				return 174;
			case 0x00bb:
				return 175;
			case 0x2591:
				return 176;
			case 0x2592:
				return 177;
			case 0x2593:
				return 178;
			case 0x2502:
				return 179;
			case 0x2524:
				return 180;
			case 0x2561:
				return 181;
			case 0x2562:
				return 182;
			case 0x2556:
				return 183;
			case 0x2555:
				return 184;
			case 0x2563:
				return 185;
			case 0x2551:
				return 186;
			case 0x2557:
				return 187;
			case 0x255d:
				return 188;
			case 0x255c:
				return 189;
			case 0x255b:
				return 190;
			case 0x2510:
				return 191;
			case 0x2514:
				return 192;
			case 0x2534:
				return 193;
			case 0x252c:
				return 194;
			case 0x251c:
				return 195;
			case 0x2500:
				return 196;
			case 0x253c:
				return 197;
			case 0x255e:
				return 198;
			case 0x255f:
				return 199;
			case 0x255a:
				return 200;
			case 0x2554:
				return 201;
			case 0x2569:
				return 202;
			case 0x2566:
				return 203;
			case 0x2560:
				return 204;
			case 0x2550:
				return 205;
			case 0x256c:
				return 206;
			case 0x2567:
				return 207;
			case 0x2568:
				return 208;
			case 0x2564:
				return 209;
			case 0x2565:
				return 210;
			case 0x2559:
				return 211;
			case 0x2558:
				return 212;
			case 0x2552:
				return 213;
			case 0x2553:
				return 214;
			case 0x256b:
				return 215;
			case 0x256a:
				return 216;
			case 0x2518:
				return 217;
			case 0x250c:
				return 218;
			case 0x2588:
				return 219;
			case 0x2584:
				return 220;
			case 0x258c:
				return 221;
			case 0x2590:
				return 222;
			case 0x2580:
				return 223;
			case 0x03b1:
				return 224;
			case 0x00df:
				return 225;
			case 0x0393:
				return 226;
			case 0x03c0:
				return 227;
			case 0x03a3:
				return 228;
			case 0x03c3:
				return 229;
			case 0x00b5:
				return 230;
			case 0x03c4:
				return 231;
			case 0x03a6:
				return 232;
			case 0x0398:
				return 233;
			case 0x03a9:
				return 234;
			case 0x03b4:
				return 235;
			case 0x221e:
				return 236;
			case 0x03c6:
				return 237;
			case 0x03b5:
				return 238;
			case 0x2229:
				return 239;
			case 0x2261:
				return 240;
			case 0x00b1:
				return 241;
			case 0x2265:
				return 242;
			case 0x2264:
				return 243;
			case 0x2320:
				return 244;
			case 0x2321:
				return 245;
			case 0x00f7:
				return 246;
			case 0x2248:
				return 247;
			case 0x00b0:
				return 248;
			case 0x2219:
				return 249;
			case 0x00b7:
				return 250;
			case 0x221a:
				return 251;
			case 0x207f:
				return 252;
			case 0x00b2:
				return 253;
			case 0x25a0:
				return 254;
			case 0x00a0:
				return 255;
			default:
				return keyCode;
		}
	};

	const keyPress = e => {
		if (ignored === false) {
			if (e.altKey === false && e.ctrlKey === false && e.metaKey === false) {
				// For keypress events, we use charCode for printable characters
				const charCode = e.charCode || e.which;
				if (charCode >= 32) {
					// Printable characters
					e.preventDefault();
					draw(convertUnicode(charCode));
				} else if (e.code === 'Enter') {
					// Enter key
					e.preventDefault();
					State.cursor.newLine();
				} else if (e.code === 'Backspace') {
					// Backspace key
					e.preventDefault();
					if (State.cursor.getX() > 0) {
						deleteText();
					}
				} else if (charCode === 167) {
					// Section sign (§)
					e.preventDefault();
					draw(21);
				}
			} else if (e.ctrlKey === true) {
				const charCode = e.charCode || e.which;
				if (charCode === 21) {
					// Ctrl+U - Pick up colors from current position
					e.preventDefault();
					const block = State.textArtCanvas.getBlock(State.cursor.getX(), State.cursor.getY());
					State.palette.setForegroundColor(block.foregroundColor);
					State.palette.setBackgroundColor(block.backgroundColor);
				}
			}
		}
	};

	const textCanvasDown = e => {
		State.cursor.move(e.detail.x, e.detail.y);
		State.selectionCursor.setStart(e.detail.x, e.detail.y);
	};

	const textCanvasDrag = e => {
		State.cursor.hide();
		State.selectionCursor.setEnd(e.detail.x, e.detail.y);
	};

	const enable = () => {
		document.addEventListener('keydown', keyDown);
		document.addEventListener('keypress', keyPress);
		document.addEventListener('onTextCanvasDown', textCanvasDown);
		document.addEventListener('onTextCanvasDrag', textCanvasDrag);
		State.cursor.enable();
		fkeys.enable();
		State.positionInfo.update(State.cursor.getX(), State.cursor.getY());
		enabled = true;
	};

	const disable = () => {
		document.removeEventListener('keydown', keyDown);
		document.removeEventListener('keypress', keyPress);
		document.removeEventListener('onTextCanvasDown', textCanvasDown);
		document.removeEventListener('onTextCanvasDrag', textCanvasDrag);
		State.selectionCursor.hide();
		State.cursor.disable();
		fkeys.disable();
		enabled = false;
	};

	const ignore = () => {
		ignored = true;
		if (enabled === true) {
			State.cursor.disable();
			fkeys.disable();
		}
	};

	const unignore = () => {
		ignored = false;
		if (enabled === true) {
			State.cursor.enable();
			fkeys.enable();
		}
	};

	return {
		enable: enable,
		disable: disable,
		ignore: ignore,
		unignore: unignore,
		insertRow: insertRow,
		deleteRow: deleteRow,
		insertColumn: insertColumn,
		deleteColumn: deleteColumn,
		eraseRow: eraseRow,
		eraseToStartOfRow: eraseToStartOfRow,
		eraseToEndOfRow: eraseToEndOfRow,
		eraseColumn: eraseColumn,
		eraseToStartOfColumn: eraseToStartOfColumn,
		eraseToEndOfColumn: eraseToEndOfColumn,
	};
};

const createPasteTool = (cutItem, copyItem, pasteItem, deleteItem) => {
	let buffer;
	let x = 0;
	let y = 0;
	let width = 0;
	let height = 0;
	let enabled = false;

	const setSelection = (newX, newY, newWidth, newHeight) => {
		x = newX;
		y = newY;
		width = newWidth;
		height = newHeight;
		if (buffer !== undefined) {
			pasteItem.classList.remove('disabled');
		}
		cutItem.classList.remove('disabled');
		copyItem.classList.remove('disabled');
		deleteItem.classList.remove('disabled');
		enabled = true;
	};

	const disable = () => {
		pasteItem.classList.add('disabled');
		cutItem.classList.add('disabled');
		copyItem.classList.add('disabled');
		deleteItem.classList.add('disabled');
		enabled = false;
	};

	const copy = () => {
		buffer = State.textArtCanvas.getArea(x, y, width, height);
		pasteItem.classList.remove('disabled');
	};

	const deleteSelection = () => {
		if (State.selectionCursor.isVisible() || State.cursor.isVisible()) {
			State.textArtCanvas.startUndo();
			State.textArtCanvas.deleteArea(x, y, width, height, State.palette.getBackgroundColor());
		}
	};

	const cut = () => {
		if (State.selectionCursor.isVisible() || State.cursor.isVisible()) {
			copy();
			deleteSelection();
		}
	};

	const paste = () => {
		if (buffer !== undefined && (State.selectionCursor.isVisible() || State.cursor.isVisible())) {
			State.textArtCanvas.startUndo();
			State.textArtCanvas.setArea(buffer, x, y);
		}
	};

	const systemPaste = () => {
		if (!navigator.clipboard || !navigator.clipboard.readText) {
			console.log('Clipboard API not available');
			return;
		}

		navigator.clipboard
			.readText()
			.then(text => {
				if (text && (State.selectionCursor.isVisible() || State.cursor.isVisible())) {
					const columns = State.textArtCanvas.getColumns();
					const rows = State.textArtCanvas.getRows();

					// Check for oversized content
					const lines = text.split(/\r\n|\r|\n/);

					// Check single line width
					if (lines.length === 1 && lines[0].length > columns * 3) {
						alert(
							'Paste buffer too large. Single line content exceeds ' +
								columns * 3 +
								' characters. Please copy smaller blocks.',
						);
						return;
					}

					// Check multi-line height
					if (lines.length > rows * 3) {
						alert('Paste buffer too large. Content exceeds ' + rows * 3 + ' lines. Please copy smaller blocks.');
						return;
					}

					State.textArtCanvas.startUndo();

					let currentX = x;
					let currentY = y;
					const startX = x; // Remember starting column for line breaks
					const foreground = State.palette.getForegroundColor();
					const background = State.palette.getBackgroundColor();

					State.textArtCanvas.draw(draw => {
						for (let i = 0; i < text.length; i++) {
							const char = text.charAt(i);

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
							let charCode = char.charCodeAt(0);

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
			})
			.catch(err => {
				console.log('Failed to read clipboard:', err);
			});
	};

	const keyDown = e => {
		if (enabled) {
			if ((e.ctrlKey === true || e.metaKey === true) && e.altKey === false && e.shiftKey === false) {
				switch (e.code) {
					case 'KeyX': // Ctrl/Cmd+X - Cut
						e.preventDefault();
						cut();
						break;
					case 'KeyC': // Ctrl/Cmd+C - Copy
						e.preventDefault();
						copy();
						break;
					case 'KeyV': // Ctrl/Cmd+V - Paste
						e.preventDefault();
						paste();
						break;
					default:
						break;
				}
			}
			// System paste with Ctrl+Shift+V
			if (
				(e.ctrlKey === true || e.metaKey === true) &&
				e.shiftKey === true &&
				e.altKey === false &&
				e.code === 'KeyV'
			) {
				e.preventDefault();
				systemPaste();
			}
		}
		if ((e.ctrlKey === true || e.metaKey === true) && e.code === 'Backspace') {
			// Ctrl/Cmd+Backspace - Delete selection
			e.preventDefault();
			deleteSelection();
		}
	};

	// add listener
	document.addEventListener('keydown', keyDown);

	return {
		setSelection: setSelection,
		cut: cut,
		copy: copy,
		paste: paste,
		systemPaste: systemPaste,
		deleteSelection: deleteSelection,
		disable: disable,
	};
};

export {
	createFKeyShorcut,
	createFKeysShortcut,
	createCursor,
	createSelectionCursor,
	createKeyboardController,
	createPasteTool,
};
