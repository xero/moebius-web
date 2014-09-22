function paletteWidget(divPalette, codepage) {
    "use strict";
    var paletteCanvas, colorChangeCaller, lastColor, currentColor;

    function redrawCurrentColor() {
        var paletteCtx;
        paletteCtx = paletteCanvas.getContext("2d");
        paletteCtx.fillStyle = codepage.styleRGBA(currentColor, 1);
        paletteCtx.fillRect(0, 0, paletteCanvas.width, 40);
    }

    function setCurrentColor(col) {
        if (col !== currentColor) {
            lastColor = currentColor;
            currentColor = col;
            redrawCurrentColor();
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
        col = 24 - (Math.floor(evt.clientY / 20)) * 8 + Math.floor(evt.clientX / 20);
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

    function redrawColors() {
        var paletteCtx, i;
        paletteCtx = paletteCanvas.getContext("2d");
        for (i = 0; i < 16; i += 1) {
            paletteCtx.fillStyle = codepage.styleRGBA(i, 1);
            paletteCtx.fillRect(
                (i % 8) * paletteCanvas.width / 8,
                (i < 8) ? 60 : 40,
                paletteCanvas.width / 8,
                paletteCanvas.height / 4
            );
        }
    }

    function paletteChange() {
        redrawColors();
        redrawCurrentColor();
    }

    function init(editorColorChangeCalller) {
        paletteCanvas = ElementHelper.create("canvas", {"width": 160, "height": 80, "style": {"verticalAlign": "bottom", "cursor": "crosshair"}});
        colorChangeCaller = editorColorChangeCalller;

        redrawColors();
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
        "canvas": paletteCanvas,
        "setCurrentColor": setCurrentColor,
        "getCurrentColor": getCurrentColor,
        "paletteChange": paletteChange,
        "startListening": startListening,
        "stopListening": stopListening
    };
}