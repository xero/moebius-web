// Global reference using state management
import { State } from './state.js';

function createPalette(RGB6Bit) {
	console.log("createPalette called");
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
	console.log("createDefaultPalette called");
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
	function updatePreview() {
		const ctx = canvas.getContext("2d");
		const w = canvas.width, h = canvas.height;
		const squareSize = Math.floor(Math.min(w, h) * 0.6);
		const offset = Math.floor(squareSize * 0.66) + 1;
		ctx.clearRect(0, 0, w, h);
		ctx.fillStyle = `rgba(${State.palette.getRGBAColor(State.palette.getBackgroundColor()).join(",")})`;
		ctx.fillRect(offset, 0, squareSize, squareSize);
		ctx.fillStyle = `rgba(${State.palette.getRGBAColor(State.palette.getForegroundColor()).join(",")})`;
		ctx.fillRect(0, offset, squareSize, squareSize);
	}

	canvas.getContext("2d").createImageData(canvas.width, canvas.height);
	updatePreview();
	document.addEventListener("onForegroundChange", updatePreview);
	document.addEventListener("onBackgroundChange", updatePreview);
	document.addEventListener("onPaletteChange", updatePreview);

	return {
		"updatePreview": updatePreview,
		"setForegroundColor": updatePreview,
		"setBackgroundColor": updatePreview,
	};
}

function createPalettePicker(canvas) {
	const imageData = [];

	function updateColor(index) {
		const color = State.palette.getRGBAColor(index);
		for (let y = 0, i = 0; y < imageData[index].height; y++) {
			for (let x = 0; x < imageData[index].width; x++, i += 4) {
				imageData[index].data.set(color, i);
			}
		}
		canvas.getContext("2d").putImageData(imageData[index], (index > 7) ? (canvas.width / 2) : 0, (index % 8) * imageData[index].height);
	}

	function updatePalette(_) {
		for (let i = 0; i < 16; i++) {
			updateColor(i);
		}
	}

	function touchEnd(evt) {
		const rect = canvas.getBoundingClientRect();
		const x = Math.floor((evt.touches[0].pageX - rect.left) / (canvas.width / 2));
		const y = Math.floor((evt.touches[0].pageY - rect.top) / (canvas.height / 8));
		const colorIndex = y + ((x === 0) ? 0 : 8);
		State.palette.setForegroundColor(colorIndex);
		State.palette.setForegroundColor(colorIndex);
	}

	function mouseEnd(evt) {
		const rect = canvas.getBoundingClientRect();
		const x = Math.floor((evt.clientX - rect.left) / (canvas.width / 2));
		const y = Math.floor((evt.clientY - rect.top) / (canvas.height / 8));
		const colorIndex = y + ((x === 0) ? 0 : 8);
		if (evt.altKey === false && evt.ctrlKey === false) {
			State.palette.setForegroundColor(colorIndex);
			State.palette.setForegroundColor(colorIndex);
		} else {
			State.palette.setBackgroundColor(colorIndex);
			State.palette.setBackgroundColor(colorIndex);
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
				if (State.palette.getForegroundColor() === num) {
					State.palette.setForegroundColor(num + 8);
				} else {
					State.palette.setForegroundColor(num);
				}
			} else if (evt.altKey) {
				evt.preventDefault();
				if (State.palette.getBackgroundColor() === num) {
					State.palette.setBackgroundColor(num + 8);
				} else {
					State.palette.setBackgroundColor(num);
				}
			}
			// ctrl + arrows
		} else if (keyCode >= 37 && keyCode <= 40 && evt.ctrlKey === true) {
			evt.preventDefault();
			let color;
			switch (keyCode) {
				case 37:
					color = State.palette.getBackgroundColor();
					color = (color === 0) ? 15 : (color - 1);
					State.palette.setBackgroundColor(color);
					break;
				case 38:
					color = State.palette.getForegroundColor();
					color = (color === 0) ? 15 : (color - 1);
					State.palette.setForegroundColor(color);
					break;
				case 39:
					color = State.palette.getBackgroundColor();
					color = (color === 15) ? 0 : (color + 1);
					State.palette.setBackgroundColor(color);
					break;
				case 40:
					color = State.palette.getForegroundColor();
					color = (color === 15) ? 0 : (color + 1);
					State.palette.setForegroundColor(color);
					break;
				default:
					break;
			}
		}
	}

	updatePalette();
	canvas.addEventListener("touchend", touchEnd);
	canvas.addEventListener("touchcancel", touchEnd);
	canvas.addEventListener("mouseup", mouseEnd);
	canvas.addEventListener("contextmenu", (evt) => {
		evt.preventDefault();
	});
	document.addEventListener("keydown", keydown);
	document.addEventListener("onPaletteChange", updatePalette);

	return {
		"updatePalette": updatePalette
	};
}

export {
	createPalette,
	createDefaultPalette,
	createPalettePreview,
	createPalettePicker,
};
