import { State, $, createCanvas } from './state.js';

function createSettingToggle(divButton, getter, setter) {
	let currentSetting;
	let g = getter;
	let s = setter;

	function update() {
		currentSetting = g();
		if (currentSetting === true) {
			divButton.classList.add("enabled");
		} else {
			divButton.classList.remove("enabled");
		}
	}

	function sync(getter, setter) {
		g=getter;
		s=setter;
		update();
	}

	function changeSetting(evt) {
		evt.preventDefault();
		currentSetting = !currentSetting;
		s(currentSetting);
		update();
	}

	divButton.addEventListener("click", changeSetting);
	update();

	return {
		"sync": sync,
		"update": update
	};
}

const Toolbar = (function() {
	let currentButton;
	let currentOnBlur;
	let previousButton;
	let previousOnBlur;
	const tools = {};

	function add(divButton, onFocus, onBlur) {
		function enable() {
			if (currentButton !== divButton) {
				// Store previous tool before switching
				if (currentButton !== undefined) {
					previousButton = currentButton;
					previousOnBlur = currentOnBlur;
					currentButton.classList.remove("toolbar-displayed");
				}
				if (currentOnBlur !== undefined) {
					currentOnBlur();
				}
				divButton.classList.add("toolbar-displayed");
				currentButton = divButton;
				currentOnBlur = onBlur;
				if (onFocus !== undefined) {
					onFocus();
				}
			} else {
				onFocus();
			}
		}

		divButton.addEventListener("click", (evt) => {
			evt.preventDefault();
			enable();
		});

		// Store tool reference for programmatic access
		tools[divButton.id] = {
			"button": divButton,
			"enable": enable,
			"onFocus": onFocus,
			"onBlur": onBlur
		};

		return {
			"enable": enable
		};
	}

	function switchTool(toolId) {
		if (tools[toolId]) {
			tools[toolId].enable();
		}
	}

	function returnToPreviousTool() {
		if (previousButton && tools[previousButton.id]) {
			tools[previousButton.id].enable();
		}
	}

	function getCurrentTool() {
		return currentButton ? currentButton.id : null;
	}

	return {
		"add": add,
		"switchTool": switchTool,
		"returnToPreviousTool": returnToPreviousTool,
		"getCurrentTool": getCurrentTool
	};
}());

function onReturn(divElement, divTarget) {
	divElement.addEventListener("keypress", (evt) => {
		const keyCode = (evt.keyCode || evt.which);
		if (evt.altKey === false && evt.ctrlKey === false && evt.metaKey === false && keyCode === 13) {
			evt.preventDefault();
			evt.stopPropagation();
			divTarget.click();
		}
	});
}

function onClick(divElement, func) {
	divElement.addEventListener("click", (evt) => {
		evt.preventDefault();
		func(divElement);
	});
}

function onFileChange(divElement, func) {
	divElement.addEventListener("change", (evt) => {
		if (evt.target.files.length > 0) {
			func(evt.target.files[0]);
		}
	});
}

function onSelectChange(divElement, func) {
	divElement.addEventListener("change", (evt) => {
		func(divElement.value);
	});
}

function createPositionInfo(divElement) {
	function update(x, y) {
		divElement.textContent = (x + 1) + ", " + (y + 1);
	}

	return {
		"update": update
	};
}

function showOverlay(divElement) {
	divElement.classList.add("enabled");
}

function hideOverlay(divElement) {
	divElement.classList.remove("enabled");
}

function undoAndRedo(evt) {
	const keyCode = (evt.keyCode || evt.which);
	if ((evt.ctrlKey === true || (evt.metaKey === true && evt.shiftKey === false)) && keyCode === 90) {
		evt.preventDefault();
		State.textArtCanvas.undo();
	} else if ((evt.ctrlKey === true && evt.keyCode === 89) || (evt.metaKey === true && evt.shiftKey === true && keyCode === 90)) {
		evt.preventDefault();
		State.textArtCanvas.redo();
	}
}

function createPaintShortcuts(keyPair) {
	let ignored = false;

	function keyDown(evt) {
		if (ignored === false) {
			const keyCode = (evt.keyCode || evt.which);
			if (evt.ctrlKey === false && evt.altKey === false && evt.shiftKey === false && evt.metaKey === false) {
				if (keyCode >= 48 && keyCode <= 55) {
					const color = keyCode - 48;
					const currentColor = palette.getForegroundColor();
					if (currentColor === color) {
						palette.setForegroundColor(color + 8);
					} else {
						palette.setForegroundColor(color);
					}
				} else {
					const charCode = String.fromCharCode(keyCode);
					if (keyPair[charCode] !== undefined) {
						if (!State.worker || State.worker.isConnected() === false || keyPair[charCode].classList.contains("excluded-for-websocket") === false) {
							evt.preventDefault();
							keyPair[charCode].click();
						}
					}
				}
			}
		}
	}

	function keyDownWithCtrl(evt) {
		if (ignored === false) {
			const keyCode = (evt.keyCode || evt.which);
			if (evt.ctrlKey === true && evt.altKey === false && evt.shiftKey === false && evt.metaKey === false) {
				const charCode = String.fromCharCode(keyCode);
				if (keyPair[charCode] !== undefined) {
					if (!State.worker || State.worker.isConnected() === false || keyPair[charCode].classList.contains("excluded-for-websocket") === false) {
						evt.preventDefault();
						keyPair[charCode].click();
					}
				}
			}
		}
	}

	document.addEventListener("keydown", keyDownWithCtrl);

	function enable() {
		document.addEventListener("keydown", keyDown);
	}

	function disable() {
		document.removeEventListener("keydown", keyDown);
	}

	function ignore() {
		ignored = true;
	}

	function unignore() {
		ignored = false;
	}

	enable();

	return {
		"enable": enable,
		"disable": disable,
		"ignore": ignore,
		"unignore": unignore
	};
}

function createToggleButton(stateOneName, stateTwoName, stateOneClick, stateTwoClick) {
	const divContainer = document.createElement("DIV");
	divContainer.classList.add("toggle-button-container");
	const stateOne = document.createElement("DIV");
	stateOne.classList.add("toggle-button");
	stateOne.classList.add("left");
	stateOne.textContent = stateOneName;
	const stateTwo = document.createElement("DIV");
	stateTwo.classList.add("toggle-button");
	stateTwo.classList.add("right");
	stateTwo.textContent = stateTwoName;
	divContainer.appendChild(stateOne);
	divContainer.appendChild(stateTwo);

	function getElement() {
		return divContainer;
	}

	function setStateOne() {
		stateOne.classList.add("enabled");
		stateTwo.classList.remove("enabled");
	}

	function setStateTwo() {
		stateTwo.classList.add("enabled");
		stateOne.classList.remove("enabled");
	}

	stateOne.addEventListener("click", (evt) => {
		setStateOne();
		stateOneClick();
	});

	stateTwo.addEventListener("click", (evt) => {
		setStateTwo();
		stateTwoClick();
	});

	return {
		"getElement": getElement,
		"setStateOne": setStateOne,
		"setStateTwo": setStateTwo
	};
}

function createGrid(divElement) {
	let canvases = [];
	let enabled = false;

	function createCanvases() {
		const fontWidth = State.font.getWidth();
		const fontHeight = State.font.getHeight();
		const columns = State.textArtCanvas.getColumns();
		const rows = State.textArtCanvas.getRows();
		const canvasWidth = fontWidth * columns;
		const canvasHeight = fontHeight * 25;
		canvases = [];
		for (let i = 0; i < Math.floor(rows / 25); i++) {
			var canvas = createCanvas(canvasWidth, canvasHeight);
			canvases.push(canvas);
		}
		if (rows % 25 !== 0) {
			var canvas = createCanvas(canvasWidth, fontHeight * (rows % 25));
			canvases.push(canvas);
		}
	}

	function renderGrid(canvas) {
		const columns = State.textArtCanvas.getColumns();
		const rows = Math.min(State.textArtCanvas.getRows(), 25);
		const fontWidth = canvas.width / columns;
		const fontHeight = State.font.getHeight();
		const ctx = canvas.getContext("2d");
		const imageData = ctx.createImageData(canvas.width, canvas.height);
		const byteWidth = canvas.width * 4;
		const darkGray = new Uint8Array([63, 63, 63, 255]);
		for (var y = 0; y < rows; y += 1) {
			for (var x = 0, i = y * fontHeight * byteWidth; x < canvas.width; x += 1, i += 4) {
				imageData.data.set(darkGray, i);
			}
		}
		for (var x = 0; x < columns; x += 1) {
			for (var y = 0, i = x * fontWidth * 4; y < canvas.height; y += 1, i += byteWidth) {
				imageData.data.set(darkGray, i);
			}
		}
		ctx.putImageData(imageData, 0, 0);
	}

	function createGrid() {
		createCanvases();
		renderGrid(canvases[0]);
		divElement.appendChild(canvases[0]);
		for (let i = 1; i < canvases.length; i++) {
			canvases[i].getContext("2d").drawImage(canvases[0], 0, 0);
			divElement.appendChild(canvases[i]);
		}
	}

	function resize() {
		canvases.forEach((canvas) => {
			divElement.removeChild(canvas);
		});
		createGrid();
	}

	createGrid();

	document.addEventListener("onTextCanvasSizeChange", resize);
	document.addEventListener("onLetterSpacingChange", resize);
	document.addEventListener("onFontChange", resize);
	document.addEventListener("onOpenedFile", resize);

	function isShown() {
		return enabled;
	}

	function show(turnOn) {
		if (enabled === true && turnOn === false) {
			divElement.classList.remove("enabled");
			enabled = false;
		} else if (enabled === false && turnOn === true) {
			divElement.classList.add("enabled");
			enabled = true;
		}
	}

	return {
		"isShown": isShown,
		"show": show
	};
}

function createToolPreview(divElement) {
	let canvases = [];
	let ctxs = [];

	function createCanvases() {
		const fontWidth = State.font.getWidth();
		const fontHeight = State.font.getHeight();
		const columns = State.textArtCanvas.getColumns();
		const rows = State.textArtCanvas.getRows();
		const canvasWidth = fontWidth * columns;
		const canvasHeight = fontHeight * 25;
		canvases = new Array();
		ctxs = new Array();
		for (let i = 0; i < Math.floor(rows / 25); i++) {
			var canvas = createCanvas(canvasWidth, canvasHeight);
			canvases.push(canvas);
			ctxs.push(canvas.getContext("2d"));
		}
		if (rows % 25 !== 0) {
			var canvas = createCanvas(canvasWidth, fontHeight * (rows % 25));
			canvases.push(canvas);
			ctxs.push(canvas.getContext("2d"));
		}
		canvases.forEach((canvas) => {
			divElement.appendChild(canvas);
		});
	}

	function resize() {
		canvases.forEach((canvas) => {
			divElement.removeChild(canvas);
		});
		createCanvases();
	}

	function drawHalfBlock(foreground, x, y) {
		const halfBlockY = y % 2;
		const textY = Math.floor(y / 2);
		const ctxIndex = Math.floor(textY / 25);
		if (ctxIndex >= 0 && ctxIndex < ctxs.length) {
			State.font.drawWithAlpha((halfBlockY === 0) ? 223 : 220, foreground, ctxs[ctxIndex], x, textY % 25);
		}
	}

	function clear() {
		for (let i = 0; i < ctxs.length; i++) {
			ctxs[i].clearRect(0, 0, canvases[i].width, canvases[i].height);
		}
	}

	createCanvases();
	divElement.classList.add("enabled");

	document.addEventListener("onTextCanvasSizeChange", resize);
	document.addEventListener("onLetterSpacingChange", resize);
	document.addEventListener("onFontChange", resize);
	document.addEventListener("onOpenedFile", resize);

	return {
		"clear": clear,
		"drawHalfBlock": drawHalfBlock,
	};
}

function menuHover() {
	$("file-menu").classList.remove("hover");
	$("edit-menu").classList.remove("hover");
}

function getUtf8Bytes(str) {
  return new TextEncoder().encode(str).length;
}
function enforceMaxBytes() {
	const SAUCE_MAX_BYTES = 16320;
	const sauceComments = $('sauce-comments');
  let val = sauceComments.value;
  let bytes = getUtf8Bytes(val);
  while (bytes > SAUCE_MAX_BYTES) {
    val = val.slice(0, -1);
    bytes = getUtf8Bytes(val);
  }
  if (val !== sauceComments.value) {
    sauceComments.value = val;
  }
  $('sauce-bytes').value = `${bytes}/${SAUCE_MAX_BYTES} bytes`;
}

function createGenericController(panel, nav) {
	function enable() {
		panel.style.display="flex";
		nav.classList.add('enabled-parent');
	}
	function disable() {
		panel.style.display="none";
		nav.classList.remove('enabled-parent');
	}
	return {
		"enable": enable,
		"disable": disable
	};
}

export {
	createSettingToggle,
	onClick,
	onReturn,
	onFileChange,
	onSelectChange,
	createPositionInfo,
	showOverlay,
	hideOverlay,
	undoAndRedo,
	createGenericController,
	createPaintShortcuts,
	createToggleButton,
	createGrid,
	createToolPreview,
	menuHover,
	enforceMaxBytes,
	Toolbar
};
export default Toolbar;
