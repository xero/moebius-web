// Global reference using state management
import { State } from './state.js';


function getUnicode(charCode) {
	switch (charCode) {
		case 1: return 0x263A;
		case 2: return 0x263B;
		case 3: return 0x2665;
		case 4: return 0x2666;
		case 5: return 0x2663;
		case 6: return 0x2660;
		case 7: return 0x2022;
		case 8: return 0x25D8;
		case 9: return 0x25CB;
		case 10: return 0x25D9;
		case 11: return 0x2642;
		case 12: return 0x2640;
		case 13: return 0x266A;
		case 14: return 0x266B;
		case 15: return 0x263C;
		case 16: return 0x25BA;
		case 17: return 0x25C4;
		case 18: return 0x2195;
		case 19: return 0x203C;
		case 20: return 0x00B6;
		case 21: return 0x00A7;
		case 22: return 0x25AC;
		case 23: return 0x21A8;
		case 24: return 0x2191;
		case 25: return 0x2193;
		case 26: return 0x2192;
		case 27: return 0x2190;
		case 28: return 0x221F;
		case 29: return 0x2194;
		case 30: return 0x25B2;
		case 31: return 0x25BC;
		case 127: return 0x2302;
		case 128: return 0x00C7;
		case 129: return 0x00FC;
		case 130: return 0x00E9;
		case 131: return 0x00E2;
		case 132: return 0x00E4;
		case 133: return 0x00E0;
		case 134: return 0x00E5;
		case 135: return 0x00E7;
		case 136: return 0x00EA;
		case 137: return 0x00EB;
		case 138: return 0x00E8;
		case 139: return 0x00EF;
		case 140: return 0x00EE;
		case 141: return 0x00EC;
		case 142: return 0x00C4;
		case 143: return 0x00C5;
		case 144: return 0x00C9;
		case 145: return 0x00E6;
		case 146: return 0x00C6;
		case 147: return 0x00F4;
		case 148: return 0x00F6;
		case 149: return 0x00F2;
		case 150: return 0x00FB;
		case 151: return 0x00F9;
		case 152: return 0x00FF;
		case 153: return 0x00D6;
		case 154: return 0x00DC;
		case 155: return 0x00A2;
		case 156: return 0x00A3;
		case 157: return 0x00A5;
		case 158: return 0x20A7;
		case 159: return 0x0192;
		case 160: return 0x00E1;
		case 161: return 0x00ED;
		case 162: return 0x00F3;
		case 163: return 0x00FA;
		case 164: return 0x00F1;
		case 165: return 0x00D1;
		case 166: return 0x00AA;
		case 167: return 0x00BA;
		case 168: return 0x00BF;
		case 169: return 0x2310;
		case 170: return 0x00AC;
		case 171: return 0x00BD;
		case 172: return 0x00BC;
		case 173: return 0x00A1;
		case 174: return 0x00AB;
		case 175: return 0x00BB;
		case 176: return 0x2591;
		case 177: return 0x2592;
		case 178: return 0x2593;
		case 179: return 0x2502;
		case 180: return 0x2524;
		case 181: return 0x2561;
		case 182: return 0x2562;
		case 183: return 0x2556;
		case 184: return 0x2555;
		case 185: return 0x2563;
		case 186: return 0x2551;
		case 187: return 0x2557;
		case 188: return 0x255D;
		case 189: return 0x255C;
		case 190: return 0x255B;
		case 191: return 0x2510;
		case 192: return 0x2514;
		case 193: return 0x2534;
		case 194: return 0x252C;
		case 195: return 0x251C;
		case 196: return 0x2500;
		case 197: return 0x253C;
		case 198: return 0x255E;
		case 199: return 0x255F;
		case 200: return 0x255A;
		case 201: return 0x2554;
		case 202: return 0x2569;
		case 203: return 0x2566;
		case 204: return 0x2560;
		case 205: return 0x2550;
		case 206: return 0x256C;
		case 207: return 0x2567;
		case 208: return 0x2568;
		case 209: return 0x2564;
		case 210: return 0x2565;
		case 211: return 0x2559;
		case 212: return 0x2558;
		case 213: return 0x2552;
		case 214: return 0x2553;
		case 215: return 0x256B;
		case 216: return 0x256A;
		case 217: return 0x2518;
		case 218: return 0x250C;
		case 219: return 0x2588;
		case 220: return 0x2584;
		case 221: return 0x258C;
		case 222: return 0x2590;
		case 223: return 0x2580;
		case 224: return 0x03B1;
		case 225: return 0x00DF;
		case 226: return 0x0393;
		case 227: return 0x03C0;
		case 228: return 0x03A3;
		case 229: return 0x03C3;
		case 230: return 0x00B5;
		case 231: return 0x03C4;
		case 232: return 0x03A6;
		case 233: return 0x0398;
		case 234: return 0x03A9;
		case 235: return 0x03B4;
		case 236: return 0x221E;
		case 237: return 0x03C6;
		case 238: return 0x03B5;
		case 239: return 0x2229;
		case 240: return 0x2261;
		case 241: return 0x00B1;
		case 242: return 0x2265;
		case 243: return 0x2264;
		case 244: return 0x2320;
		case 245: return 0x2321;
		case 246: return 0x00F7;
		case 247: return 0x2248;
		case 248: return 0x00B0;
		case 249: return 0x2219;
		case 250: return 0x00B7;
		case 251: return 0x221A;
		case 252: return 0x207F;
		case 253: return 0x00B2;
		case 254: return 0x25A0;
		case 0:
		case 255:
			return 0x00A0;
		default:
			return charCode;
	}
}

function unicodeToArray(unicode) {
	if (unicode < 0x80) {
		return [unicode];
	} else if (unicode < 0x800) {
		return [(unicode >> 6) | 192, (unicode & 63) | 128];
	}
	return [(unicode >> 12) | 224, ((unicode >> 6) & 63) | 128, (unicode & 63) | 128];
}

function getUTF8(charCode) {
	return unicodeToArray(getUnicode(charCode));
}

function createPalette(RGB6Bit) {
	const RGBAColors = RGB6Bit.map(RGB6Bit=>{
		return new Uint8Array(
			[
				RGB6Bit[0] << 2 | RGB6Bit[0] >> 4,
				RGB6Bit[1] << 2 | RGB6Bit[1] >> 4,
				RGB6Bit[2] << 2 | RGB6Bit[2] >> 4,
				255,
			],
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
		document.dispatchEvent(new CustomEvent('onForegroundChange', { detail: foreground }));
	}

	function setBackgroundColor(newBackground) {
		background = newBackground;
		document.dispatchEvent(new CustomEvent('onBackgroundChange', { detail: background }));
	}

	return {
		getRGBAColor: getRGBAColor,
		getForegroundColor: getForegroundColor,
		getBackgroundColor: getBackgroundColor,
		setForegroundColor: setForegroundColor,
		setBackgroundColor: setBackgroundColor,
	};
}

function createDefaultPalette() {
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
		[63, 63, 63],
	]);
}

function createPalettePreview(canvas) {
	function updatePreview() {
		const ctx = canvas.getContext('2d');
		const w = canvas.width,
					h = canvas.height;
		const squareSize = Math.floor(Math.min(w, h) * 0.6);
		const offset = Math.floor(squareSize * 0.66) + 1;
		ctx.clearRect(0, 0, w, h);
		ctx.fillStyle = `rgba(${State.palette.getRGBAColor(State.palette.getBackgroundColor()).join(',')})`;
		ctx.fillRect(offset, 0, squareSize, squareSize);
		ctx.fillStyle = `rgba(${State.palette.getRGBAColor(State.palette.getForegroundColor()).join(',')})`;
		ctx.fillRect(0, offset, squareSize, squareSize);
	}

	canvas.getContext('2d').createImageData(canvas.width, canvas.height);
	updatePreview();
	document.addEventListener('onForegroundChange', updatePreview);
	document.addEventListener('onBackgroundChange', updatePreview);
	document.addEventListener('onPaletteChange', updatePreview);

	return {
		updatePreview: updatePreview,
		setForegroundColor: updatePreview,
		setBackgroundColor: updatePreview,
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
		canvas.getContext('2d').putImageData(imageData[index], (index > 7) ? (canvas.width / 2) : 0, (index % 8) * imageData[index].height);
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
		imageData[i] = canvas.getContext('2d').createImageData(canvas.width / 2, canvas.height / 8);
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
	canvas.addEventListener('touchend', touchEnd);
	canvas.addEventListener('touchcancel', touchEnd);
	canvas.addEventListener('mouseup', mouseEnd);
	canvas.addEventListener('contextmenu', evt=>{
		evt.preventDefault();
	});
	document.addEventListener('keydown', keydown);
	document.addEventListener('onPaletteChange', updatePalette);

	return { updatePalette: updatePalette };
}

export {
	createPalette,
	createDefaultPalette,
	createPalettePreview,
	createPalettePicker,
	getUTF8,
	getUnicode,
};
