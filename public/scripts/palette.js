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
        document.dispatchEvent(new CustomEvent("onForegroundChange", {"detail": foreground}));
    }

    function setBackgroundColour(newBackground) {
        background = newBackground;
        document.dispatchEvent(new CustomEvent("onBackgroundChange", {"detail": background}));
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

    function mouseDown(evt) {
        var rect = canvas.getBoundingClientRect();
        var x = Math.floor((evt.clientX - rect.left) / (canvas.width / 2));
        var y = Math.floor((evt.clientY - rect.top) / (canvas.height / 8));
        var colourIndex = y + ((x === 0) ? 0 : 8);
        if (evt.ctrlKey === false && evt.which != 3) {
            palette.setForegroundColour(colourIndex);
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
        } else if (keyCode >= 37 && keyCode <= 40 && evt.ctrlKey === true){
            evt.preventDefault();
            switch(keyCode) {
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
    canvas.addEventListener("mousedown", mouseDown);
    canvas.addEventListener("contextmenu", (evt) => {
        evt.preventDefault();
    });
    document.addEventListener("keydown", keydown);
}
