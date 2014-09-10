function paletteWidget(divPalette, colors, retina) {
    "use strict";
    var paletteCanvas, extendedPalettes, colorChangeCaller, lastColor, currentColor;

    function styleRGBA(col, alpha) {
        return "rgba(" + colors[col][0] + ", " + colors[col][1] + ", " + colors[col][2] + ", " + alpha + ")";
    }

    function setCurrentColor(col) {
        var paletteCtx;
        if (col !== currentColor) {
            lastColor = currentColor;
            paletteCtx = paletteCanvas.getContext("2d");
            paletteCtx.fillStyle = styleRGBA(col, 1);
            paletteCtx.fillRect(0, 0, paletteCanvas.width, retina ? 80 : 40);
            currentColor = col;
            colorChangeCaller(currentColor);
        }
    }

    function keydown(evt) {
        var keyCode, modifier, newColor;
        keyCode = evt.keyCode || evt.which;
        modifier = evt.metaKey || evt.altKey || evt.ctrlKey;
        if (!modifier) {
            if (keyCode >= 49 && keyCode <= 56) {
                evt.preventDefault();
                newColor = keyCode - 49 + (evt.shiftKey ? 8 : 0);
                if ((newColor === currentColor) && (currentColor < 8)) {
                    newColor += 8;
                }
                setCurrentColor(newColor);
            } else {
                switch (keyCode) {
                case 9:
                    evt.preventDefault();
                    if (lastColor !== undefined) {
                        setCurrentColor(lastColor);
                    }
                    break;
                default:
                }
            }
        }
    }

    function mousedown(evt) {
        var col;
        col = 24 - (Math.floor(evt.clientY / 20)) * 8 + Math.floor(evt.clientX / 25);
        if (col >= 0 && col <= 15) {
            setCurrentColor(col);
        }
    }

    function mousemove(evt) {
        var mouseButton;
        evt.preventDefault();
        mouseButton = (evt.buttons !== undefined) ? evt.buttons : evt.which;
        if (mouseButton) {
            mousedown(evt);
        }
    }

    function startListening() {
        document.addEventListener("keydown", keydown, false);
    }

    function stopListening() {
        document.removeEventListener("keydown", keydown);
    }

    function init(editorColorChangeCalller) {
        var paletteCtx, i, width, height;

        width = retina ? 400 : 200;
        height = retina ? 160 : 80;
        paletteCanvas = ElementHelper.create("canvas", {"width": width, "height": height, "style": {"width": (retina ? (width / 2) : width) + "px", "height": (retina ? (height / 2) : height) + "px", "verticalAlign": "bottom", "cursor": "crosshair"}});
        paletteCtx = paletteCanvas.getContext("2d");
        extendedPalettes = new Array(16);
        colorChangeCaller = editorColorChangeCalller;

        for (i = 0; i < 16; ++i) {
            paletteCtx.fillStyle = styleRGBA(i, 1);
            paletteCtx.fillRect(
                (i % 8) * paletteCanvas.width / 8,
                (i < 8) ? (retina ? 120 : 60) : (retina ? 80 : 40),
                paletteCanvas.width / 8,
                retina ? 40 : 20
            );
        }

        setCurrentColor(7);
        divPalette.appendChild(paletteCanvas);

        paletteCanvas.addEventListener("mousedown", mousedown, false);
        paletteCanvas.addEventListener("mousemove", mousemove, false);
        startListening();
    }

    function getCurrentColor() {
        return currentColor;
    }

    return {
        "init": init,
        "colors": colors,
        "styleRGBA": styleRGBA,
        "canvas": paletteCanvas,
        "setCurrentColor": setCurrentColor,
        "getCurrentColor": getCurrentColor,
        "startListening": startListening,
        "stopListening": stopListening
    };
}