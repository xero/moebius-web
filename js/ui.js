function createSettingToggle(divButton, getter, setter) {
	"use strict";
	var currentSetting;

	function update() {
		currentSetting = getter();
		if (currentSetting === true) {
			divButton.classList.add("enabled");
		} else {
			divButton.classList.remove("enabled");
		}
	}

	function changeSetting(evt) {
		evt.preventDefault();
		currentSetting = !currentSetting;
		setter(currentSetting);
		update();
	}

	divButton.addEventListener("click", changeSetting);
	update();

	return {
		"update": update
	};
}

var Toolbar = (function() {
	"use strict";
	var currentButton;
	var currentOnBlur;

	function add(divButton, onFocus, onBlur) {
		function enable() {
			if (currentButton !== divButton) {
				if (currentButton !== undefined) {
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
			}
		}
		divButton.addEventListener("click", (evt) => {
			evt.preventDefault();
			enable();
		});
		return {
			"enable": enable
		};
	}

	return {
		"add": add
	};
}());

function onReturn(divElement, divTarget) {
	"use strict";
	divElement.addEventListener("keypress", (evt) => {
		var keyCode = (evt.keyCode || evt.which);
		if (evt.altKey === false && evt.ctrlKey === false && evt.metaKey === false && keyCode === 13) {
			evt.preventDefault();
			evt.stopPropagation();
			divTarget.click();
		}
	});
}

function onClick(divElement, func) {
	"use strict";
	divElement.addEventListener("click", (evt) => {
		evt.preventDefault();
		func(divElement);
	});
}

function onFileChange(divElement, func) {
	"use strict";
	divElement.addEventListener("change", (evt) => {
		if (evt.target.files.length > 0) {
			func(evt.target.files[0]);
		}
	});
}

function onSelectChange(divElement, func) {
	"use strict";
	divElement.addEventListener("change", (evt) => {
		func(divElement.value);
	});
}

function createPositionInfo(divElement) {
	"use strict";
	function update(x, y) {
		divElement.textContent = (x + 1) + ", " + (y + 1);
	}

	return {
		"update": update
	};
}

function showOverlay(divElement) {
	"use strict";
	divElement.classList.add("enabled");
}

function hideOverlay(divElement) {
	"use strict";
	divElement.classList.remove("enabled");
}

function undoAndRedo(evt) {
	"use strict";
	var keyCode = (evt.keyCode || evt.which);
	if ((evt.ctrlKey === true || (evt.metaKey === true && evt.shiftKey === false)) && keyCode === 90) {
		evt.preventDefault();
		textArtCanvas.undo();
	} else if ((evt.ctrlKey === true && evt.keyCode === 89) || (evt.metaKey === true && evt.shiftKey === true && keyCode === 90)) {
		evt.preventDefault();
		textArtCanvas.redo();
	}
}

function createTitleHandler(inputElement, onFocusCallback, onBlurCallback) {
	"use strict";
	function updateTitle() {
		document.title = inputElement.value + " - moebius";
	}

	function onFocus() {
		onFocusCallback();
	}

	function onBlur() {
		onBlurCallback();
		updateTitle();
	}

	function keyPress(evt) {
		var keyCode = (evt.keyCode || evt.which);
		if (keyCode === 13) {
			evt.preventDefault();
			evt.stopPropagation();
			if (inputElement.value === "") {
				inputElement.value = "untitled";
			}
			inputElement.blur();
		}
	}

	function setName(newName) {
		inputElement.value = newName;
		updateTitle();
	}

	function getName() {
		return inputElement.value;
	}

	function reset() {
		setName("untitled");
	}

	inputElement.addEventListener("focus", onFocus);
	inputElement.addEventListener("blur", onBlur);
	inputElement.addEventListener("keypress", keyPress);
	reset();

	return {
		"getName": getName,
		"setName": setName,
		"reset": reset
	};
}

function createPaintShortcuts(keyPair) {
	"use strict";
	var ignored = false;

	function keyDown(evt) {
		if (ignored === false) {
			var keyCode = (evt.keyCode || evt.which);
			if (evt.ctrlKey === false && evt.altKey === false && evt.shiftKey === false && evt.metaKey === false) {
				if (keyCode >= 48 && keyCode <= 55) {
					var colour = keyCode - 48;
					var currentColour = palette.getForegroundColour();
					if (currentColour === colour) {
						palette.setForegroundColour(colour + 8);
					} else {
						palette.setForegroundColour(colour);
					}
				} else {
					var charCode = String.fromCharCode(keyCode);
					if (keyPair[charCode] !== undefined) {
						if (worker.isConnected() === false || keyPair[charCode].classList.contains("excluded-for-websocket") === false) {
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
			var keyCode = (evt.keyCode || evt.which);
			if (evt.ctrlKey === true && evt.altKey === false && evt.shiftKey === false && evt.metaKey === false) {
				var charCode = String.fromCharCode(keyCode);
				if (keyPair[charCode] !== undefined) {
					if (worker.isConnected() === false || keyPair[charCode].classList.contains("excluded-for-websocket") === false) {
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
	"use strict";
	var divContainer = document.createElement("DIV");
	divContainer.classList.add("toggle-button-container");
	var stateOne = document.createElement("DIV");
	stateOne.classList.add("toggle-button");
	stateOne.classList.add("left");
	stateOne.textContent = stateOneName;
	var stateTwo = document.createElement("DIV");
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
	"use strict";
	var canvases = [];
	var enabled = false;

	function createCanvases() {
		var fontWidth = font.getWidth();
		var fontHeight = font.getHeight();
		var columns = textArtCanvas.getColumns();
		var rows = textArtCanvas.getRows();
		var canvasWidth = fontWidth * columns;
		var canvasHeight = fontHeight * 25;
		canvases = [];
		for (var i = 0; i < Math.floor(rows / 25); i++) {
			var canvas = createCanvas(canvasWidth, canvasHeight);
			canvases.push(canvas);
		}
		if (rows % 25 !== 0) {
			var canvas = createCanvas(canvasWidth, fontHeight * (rows % 25));
			canvases.push(canvas);
		}
	}

	function renderGrid(canvas) {
		var columns = textArtCanvas.getColumns();
		var rows = Math.min(textArtCanvas.getRows(), 25);
		var fontWidth = canvas.width / columns;
		var fontHeight = font.getHeight();
		var ctx = canvas.getContext("2d");
		var imageData = ctx.createImageData(canvas.width, canvas.height);
		var byteWidth = canvas.width * 4;
		var darkGray = new Uint8Array([63, 63, 63, 255]);
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
		for (var i = 1; i < canvases.length; i++) {
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
	"use strict";
	var canvases = [];
	var ctxs = [];

	function createCanvases() {
		var fontWidth = font.getWidth();
		var fontHeight = font.getHeight();
		var columns = textArtCanvas.getColumns();
		var rows = textArtCanvas.getRows();
		var canvasWidth = fontWidth * columns;
		var canvasHeight = fontHeight * 25;
		canvases = new Array();
		ctxs = new Array();
		for (var i = 0; i < Math.floor(rows / 25); i++) {
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
		var halfBlockY = y % 2;
		var textY = Math.floor(y / 2);
		var ctxIndex = Math.floor(textY / 25);
		if (ctxIndex >= 0 && ctxIndex < ctxs.length) {
			font.drawWithAlpha((halfBlockY === 0) ? 223 : 220, foreground, ctxs[ctxIndex], x, textY % 25);
		}
	}

	function clear() {
		for (var i = 0; i < ctxs.length; i++) {
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
	$("view-menu").classList.remove("hover");
}
