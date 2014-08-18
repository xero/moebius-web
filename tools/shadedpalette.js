function shadedPaletteTool(editor) {
    "use strict";

    var currentColor, lastPoint, canvas, selectionCanvas, ctx, imageData, shadedPaletteCanvases, selection;

    function updateCanvas(activated) {
        ctx.drawImage(shadedPaletteCanvases[currentColor], 0, 0);
        if (selection !== undefined) {
            if (activated && selection.color === currentColor) {
                ctx.drawImage(selectionCanvas, selection.x * editor.codepage.fontWidth * 6, selection.y * editor.codepage.fontHeight);
            }
        }
    }

    function colorChange(col) {
        var extendedPaletteCtx, imageData, i, bg, y, noblink;
        noblink = editor.getBlinkStatus();
        if (shadedPaletteCanvases[col] === undefined) {
            shadedPaletteCanvases[col] = ElementHelper.create("canvas", {"width": canvas.width, "height": canvas.height});
            extendedPaletteCtx = shadedPaletteCanvases[col].getContext("2d");
            imageData = extendedPaletteCtx.createImageData(editor.codepage.fontWidth, editor.codepage.fontHeight);
            for (bg = 0, y = 0; bg < 8; bg++) {
                if (col !== bg) {
                    imageData.data.set(editor.codepage.bigFont(editor.codepage.DARK_SHADE, col, bg));
                    for (i = 0; i < 6; i++) {
                        extendedPaletteCtx.putImageData(imageData, i * editor.codepage.fontWidth, y);
                    }
                    imageData.data.set(editor.codepage.bigFont(editor.codepage.MEDIUM_SHADE, col, bg));
                    for (i = 6; i < 12; i++) {
                        extendedPaletteCtx.putImageData(imageData, i * editor.codepage.fontWidth, y);
                    }
                    imageData.data.set(editor.codepage.bigFont(editor.codepage.LIGHT_SHADE, col, bg));
                    for (i = 12; i < 18; i++) {
                        extendedPaletteCtx.putImageData(imageData, i * editor.codepage.fontWidth, y);
                    }
                    y += editor.codepage.fontHeight;
                }
            }
            if (col < 8 || noblink) {
                for (bg = 8; bg < 16; bg++) {
                    if (col !== bg) {
                        imageData.data.set(editor.codepage.bigFont(editor.codepage.LIGHT_SHADE, bg, col));
                        for (i = 0; i < 6; i++) {
                            extendedPaletteCtx.putImageData(imageData, i * editor.codepage.fontWidth, y);
                        }
                        imageData.data.set(editor.codepage.bigFont(editor.codepage.MEDIUM_SHADE, bg, col));
                        for (i = 6; i < 12; i++) {
                            extendedPaletteCtx.putImageData(imageData, i * editor.codepage.fontWidth, y);
                        }
                        imageData.data.set(editor.codepage.bigFont(editor.codepage.DARK_SHADE, bg, col));
                        for (i = 12; i < 18; i++) {
                            extendedPaletteCtx.putImageData(imageData, i * editor.codepage.fontWidth, y);
                        }
                        y += editor.codepage.fontHeight;
                    }
                }
            } else {
                extendedPaletteCtx.fillStyle = "black";
                extendedPaletteCtx.fillRect(0, y, shadedPaletteCanvases[col].width, shadedPaletteCanvases[col].height - y);
            }
        }
        currentColor = col;
        updateCanvas(true);
    }

    function createSelectionCanvas() {
        var retina, canvas, ctx;
        retina = editor.getRetina();
        canvas = ElementHelper.create("canvas", {"width": editor.codepage.fontWidth * 6, "height": editor.codepage.fontHeight});
        ctx = canvas.getContext("2d");
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, canvas.width, retina ? 2 : 1);
        ctx.fillRect(0, canvas.height - (retina ? 2 : 1), canvas.width, retina ? 2 : 1);
        ctx.fillRect(0, 0, retina ? 2 : 1, canvas.height);
        ctx.fillRect(canvas.width - (retina ? 2 : 1), 0, retina ? 2 : 1, canvas.height);
        return canvas;
    }

    canvas = ElementHelper.create("canvas", {"width": editor.codepage.fontWidth * 18, "height": editor.codepage.fontHeight * 15, "style": {"border": "1px solid #444", "cursor": "crosshair"}});
    selectionCanvas = createSelectionCanvas();
    ctx = canvas.getContext("2d");
    imageData = ctx.createImageData(canvas.width, canvas.height);
    shadedPaletteCanvases = new Array(16);

    editor.addColorChangeListener(colorChange, false);

    function extendedPaletteBrush(block) {
        editor.setTextBlock(block, selection.code, selection.fg, selection.bg);
    }

    function canvasDown(coord) {
        if (selection !== undefined) {
            editor.takeUndoSnapshot();
            if (coord.shiftKey && lastPoint) {
                editor.blockLine(lastPoint, coord, extendedPaletteBrush);
            } else {
                extendedPaletteBrush(coord);
            }
            lastPoint = coord;
        }
    }

    function canvasDrag(coord) {
        if (selection !== undefined && lastPoint) {
            editor.blockLine(lastPoint, coord, extendedPaletteBrush);
            lastPoint = coord;
        }
    }

    function onload() {
        colorChange(editor.getCurrentColor());
    }

    function getShading(value) {
        switch (value) {
        case 0:
            return editor.codepage.DARK_SHADE;
        case 1:
            return editor.codepage.MEDIUM_SHADE;
        case 2:
            return editor.codepage.LIGHT_SHADE;
        default:
            return undefined;
        }
    }

    function selectFromEvent(evt) {
        var retina, x, y, otherCol;
        retina = editor.getRetina();
        x = (evt.offsetX !== undefined) ? evt.offsetX : (evt.layerX - evt.currentTarget.offsetLeft);
        y = (evt.offsetY !== undefined) ? evt.offsetY : (evt.layerY - evt.currentTarget.offsetTop);
        x = Math.floor(x / (editor.codepage.fontWidth * 6 / (retina ? 2 : 1)));
        y = Math.floor(y / (editor.codepage.fontHeight / (retina ? 2 : 1)));
        otherCol = (y < currentColor) ? y : y + 1;
        if (otherCol < 8) {
            selection = {"color": currentColor, "x": x, "y": y, "fg": currentColor, "bg": otherCol, "code": getShading((otherCol < 8) ? x : (2 - x))};
            updateCanvas(true);
        } else if (editor.getBlinkStatus() || currentColor < 8) {
            selection = {"color": currentColor, "x": x, "y": y, "fg": otherCol, "bg": currentColor, "code": getShading((otherCol < 8) ? x : (2 - x))};
            updateCanvas(true);
        }
    }

    function mousedown(evt) {
        evt.preventDefault();
        selectFromEvent(evt);
    }

    function mousemove(evt) {
        var mouseButton;
        evt.preventDefault();
        mouseButton = (evt.buttons !== undefined) ? evt.buttons : evt.which;
        if (mouseButton) {
            evt.preventDefault();
            selectFromEvent(evt);
        }
    }

    function iceColorChange() {
        var i;
        for (i = 8; i < 16; i++) {
            delete shadedPaletteCanvases[i];
        }
        if (currentColor >= 8) {
            if (selection !== undefined) {
                if (selection.bg >= 8) {
                    selection = undefined;
                }
            }
            colorChange(currentColor);
        }
    }

    canvas.addEventListener("mousedown", mousedown, false);
    canvas.addEventListener("mousemove", mousemove, false);
    editor.addBlinkModeChangeListener(iceColorChange);

    function init() {
        editor.addMouseDownListener(canvasDown);
        editor.addMouseDragListener(canvasDrag);
        updateCanvas(true);
        return true;
    }

    function remove() {
        editor.removeMouseDownListener(canvasDown);
        editor.removeMouseDragListener(canvasDrag);
        updateCanvas(false);
    }

    function toString() {
        return "Shaded Palette";
    }

    return {
        "onload": onload,
        "init": init,
        "remove": remove,
        "toString": toString,
        "canvas": canvas,
        "uid": "shadedpalette"
    };
}

AnsiEditController.addTool(shadedPaletteTool, "tools-left", 32);