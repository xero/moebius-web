function paletteWidget(divPalette) {
    "use strict";
    var COLORS, paletteCanvas, editorCanvas, lastColor, currentColor;

    function egaRGB(value) {
        return new Uint8Array([
            (((value & 32) >> 5) + ((value & 4) >> 1)) * 0x55,
            (((value & 16) >> 4) + ((value & 2))) * 0x55,
            (((value & 8) >> 3) + ((value & 1) << 1)) * 0x55,
            255
        ]);
    }

    COLORS = [0, 1, 2, 3, 4, 5, 20, 7, 56, 57, 58, 59, 60, 61, 62, 63].map(egaRGB);

    function styleRGBA(col, alpha) {
        return "rgba(" + COLORS[col][0] + ", " + COLORS[col][1] + ", " + COLORS[col][2] + ", " + alpha + ")";
    }

    function setColor(col) {
        var paletteCtx;
        if (col !== currentColor) {
            lastColor = currentColor;
            paletteCtx = paletteCanvas.getContext("2d");
            paletteCtx.fillStyle = styleRGBA(col, 1);
            paletteCtx.fillRect(0, 0, paletteCanvas.width, paletteCanvas.height / 2);
            currentColor = col;
            editorCanvas.dispatchEvent(new CustomEvent("colorChange", {"detail": currentColor}));
        }
    }

    function keydown(evt) {
        var keyCode, modifier;
        keyCode = evt.keyCode || evt.which;
        modifier = evt.metaKey || evt.altKey || evt.ctrlKey;
        if (!modifier) {
            if (keyCode >= 49 && keyCode <= 56) {
                evt.preventDefault();
                setColor(keyCode - 49 + (evt.shiftKey ? 8 : 0));
            } else if (keyCode >= 112 && keyCode <= 119) {
                evt.preventDefault();
                setColor(keyCode - 112 + 8);
            } else {
                switch (keyCode) {
                case 9:
                    evt.preventDefault();
                    if (lastColor !== undefined) {
                        setColor(lastColor);
                    }
                    break;
                case 81:
                    evt.preventDefault();
                    setColor((currentColor === 0) ? 15 : currentColor - 1);
                    break;
                case 87:
                    evt.preventDefault();
                    setColor((currentColor === 15) ? 0 : currentColor + 1);
                    break;
                }
            }
        }
    }

    function mousedown(evt) {
        var col;
        col = 24 - (Math.floor(evt.layerY / 20)) * 8 + Math.floor(evt.layerX / 20);
        if (col >= 0 && col <= 15) {
            setColor(col);
        }
    }

    function startListening() {
        document.addEventListener("keydown", keydown, false);
        paletteCanvas.addEventListener("mousedown", mousedown, false);
    }

    function stopListening() {
        document.removeEventListener("keydown", keydown);
        paletteCanvas.removeEventListener("mousedown", mousedown);
    }

    function init(canvas, retina) {
        var paletteCtx, i;

        paletteCanvas = ElementHelper.create("canvas", {"width": retina ? 320 : 160, "height": retina ? 160 : 80, "style": {"width": "160px", "height": "80px", "verticalAlign": "bottom"}});
        paletteCtx = paletteCanvas.getContext("2d");
        editorCanvas = canvas;

        for (i = 0; i < 16; ++i) {
            paletteCtx.fillStyle = styleRGBA(i, 1);
            paletteCtx.fillRect((i % 8) * paletteCanvas.width / 8, (i < 8) ? (paletteCanvas.height / 4 * 3) : (paletteCanvas.height / 2), paletteCanvas.width / 8, paletteCanvas.height / 4);
        }

        setColor(7);
        divPalette.appendChild(paletteCanvas);

        startListening();
    }

    function getCurrentColor() {
        return currentColor;
    }

    return {
        "init": init,
        "COLORS": COLORS,
        "styleRGBA": styleRGBA,
        "canvas": paletteCanvas,
        "getCurrentColor": getCurrentColor,
        "startListening": startListening,
        "stopListening": stopListening
    };
}