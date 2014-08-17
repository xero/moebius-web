function paletteWidget(divPalette, colors, retina) {
    "use strict";
    var paletteCanvas, extendedPalettes, editorCanvas, lastColor, currentColor;

    function styleRGBA(col, alpha) {
        return "rgba(" + colors[col][0] + ", " + colors[col][1] + ", " + colors[col][2] + ", " + alpha + ")";
    }

    function setColor(col) {
        var paletteCtx;
        if (col !== currentColor) {
            lastColor = currentColor;
            paletteCtx = paletteCanvas.getContext("2d");
            paletteCtx.fillStyle = styleRGBA(col, 1);
            paletteCtx.fillRect(0, 0, paletteCanvas.width, retina ? 80 : 40);
            currentColor = col;
            editorCanvas.dispatchEvent(new CustomEvent("colorChange", {"detail": currentColor}));
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
                if (newColor === currentColor) {
                    newColor += 8;
                }
                setColor(newColor);
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
        col = 24 - (Math.floor((evt.layerY - document.body.scrollTop) / 20)) * 8 + Math.floor(evt.layerX / 20);
        if (col >= 0 && col <= 15) {
            setColor(col);
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
        paletteCanvas.addEventListener("mousedown", mousedown, false);
        paletteCanvas.addEventListener("mousemove", mousemove, false);
    }

    function stopListening() {
        document.removeEventListener("keydown", keydown);
        paletteCanvas.removeEventListener("mousedown", mousedown);
        paletteCanvas.removeEventListener("mousemove", mousemove);
    }

    function init(canvas) {
        var paletteCtx, i, width, height;

        width = retina ? 320 : 160;
        height = retina ? 160 : 80;
        paletteCanvas = ElementHelper.create("canvas", {"width": width, "height": height, "style": {"width": "160px", "height": (retina ? (height / 2) : height) + "px", "verticalAlign": "bottom"}});
        paletteCtx = paletteCanvas.getContext("2d");
        extendedPalettes = new Array(16);
        editorCanvas = canvas;

        for (i = 0; i < 16; ++i) {
            paletteCtx.fillStyle = styleRGBA(i, 1);
            paletteCtx.fillRect(
                (i % 8) * paletteCanvas.width / 8,
                (i < 8) ? (retina ? 120 : 60) : (retina ? 80 : 40),
                paletteCanvas.width / 8,
                retina ? 40 : 20
            );
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
        "colors": colors,
        "styleRGBA": styleRGBA,
        "canvas": paletteCanvas,
        "getCurrentColor": getCurrentColor,
        "startListening": startListening,
        "stopListening": stopListening
    };
}