function shadedPaletteTool(editor, toolbar) {
    "use strict";
    var currentColor, lastPoint, canvas, quickAccess, quickAccessCtx, selectionCanvas, ctx, imageData, shadedPaletteCanvases, selection;

    function updateCanvas() {
        ctx.drawImage(shadedPaletteCanvases[currentColor], 0, 0);
        quickAccessCtx.drawImage(shadedPaletteCanvases[currentColor], 0, 0);
        if (selection !== undefined) {
            if (selection.color === currentColor) {
                ctx.drawImage(selectionCanvas, selection.x * editor.codepage.getFontWidth() * 4, selection.y * editor.codepage.getFontHeight());
                quickAccessCtx.drawImage(selectionCanvas, selection.x * editor.codepage.getFontWidth() * 4, selection.y * editor.codepage.getFontHeight());
            }
        }
    }

    function colorChange(col) {
        var noblink, fontWidth, fontHeight, extendedPaletteCtx, imageData, i, bg, y;
        noblink = editor.getBlinkStatus();
        fontWidth = editor.codepage.getFontWidth();
        fontHeight = editor.codepage.getFontHeight();
        if (shadedPaletteCanvases[col] === undefined) {
            shadedPaletteCanvases[col] = ElementHelper.create("canvas", {"width": canvas.width, "height": canvas.height});
            extendedPaletteCtx = shadedPaletteCanvases[col].getContext("2d");
            imageData = extendedPaletteCtx.createImageData(fontWidth, fontHeight);
            for (bg = 0, y = 0; bg < 8; bg += 1) {
                if (col !== bg) {
                    imageData.data.set(editor.codepage.fontData(editor.codepage.FULL_BLOCK, col, bg));
                    for (i = 0; i < 4; i += 1) {
                        extendedPaletteCtx.putImageData(imageData, i * fontWidth, y);
                    }
                    imageData.data.set(editor.codepage.fontData(editor.codepage.DARK_SHADE, col, bg));
                    for (i = 4; i < 8; i += 1) {
                        extendedPaletteCtx.putImageData(imageData, i * fontWidth, y);
                    }
                    imageData.data.set(editor.codepage.fontData(editor.codepage.MEDIUM_SHADE, col, bg));
                    for (i = 8; i < 12; i += 1) {
                        extendedPaletteCtx.putImageData(imageData, i * fontWidth, y);
                    }
                    imageData.data.set(editor.codepage.fontData(editor.codepage.LIGHT_SHADE, col, bg));
                    for (i = 12; i < 16; i += 1) {
                        extendedPaletteCtx.putImageData(imageData, i * fontWidth, y);
                    }
                    imageData.data.set(editor.codepage.fontData(editor.codepage.FULL_BLOCK, bg, col));
                    for (i = 16; i < 20; i += 1) {
                        extendedPaletteCtx.putImageData(imageData, i * fontWidth, y);
                    }
                    y += fontHeight;
                }
            }
            if (col < 8 || noblink) {
                for (bg = 8; bg < 16; bg += 1) {
                    if (col !== bg) {
                        imageData.data.set(editor.codepage.fontData(editor.codepage.FULL_BLOCK, col, bg - 8));
                        for (i = 0; i < 4; i += 1) {
                            extendedPaletteCtx.putImageData(imageData, i * fontWidth, y);
                        }
                        imageData.data.set(editor.codepage.fontData(editor.codepage.LIGHT_SHADE, bg, col));
                        for (i = 4; i < 8; i += 1) {
                            extendedPaletteCtx.putImageData(imageData, i * fontWidth, y);
                        }
                        imageData.data.set(editor.codepage.fontData(editor.codepage.MEDIUM_SHADE, bg, col));
                        for (i = 8; i < 12; i += 1) {
                            extendedPaletteCtx.putImageData(imageData, i * fontWidth, y);
                        }
                        imageData.data.set(editor.codepage.fontData(editor.codepage.DARK_SHADE, bg, col));
                        for (i = 12; i < 16; i += 1) {
                            extendedPaletteCtx.putImageData(imageData, i * fontWidth, y);
                        }
                        imageData.data.set(editor.codepage.fontData(editor.codepage.FULL_BLOCK, bg, col));
                        for (i = 16; i < 20; i += 1) {
                            extendedPaletteCtx.putImageData(imageData, i * fontWidth, y);
                        }
                        y += fontHeight;
                    }
                }
            } else {
                extendedPaletteCtx.fillStyle = "black";
                extendedPaletteCtx.fillRect(0, y, shadedPaletteCanvases[col].width, shadedPaletteCanvases[col].height - y);
            }
        }
        currentColor = col;
        updateCanvas();
    }

    function createSelectionCanvas() {
        var canvas, ctx;
        canvas = ElementHelper.create("canvas", {"width": editor.codepage.getFontWidth() * 4, "height": editor.codepage.getFontHeight()});
        ctx = canvas.getContext("2d");
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, canvas.width, 1);
        ctx.fillRect(0, canvas.height - 1, canvas.width, 1);
        ctx.fillRect(0, 0, 1, canvas.height);
        ctx.fillRect(canvas.width - 1, 0, 1, canvas.height);
        return canvas;
    }

    function getShading(value) {
        switch (value) {
        case 1:
            return editor.codepage.DARK_SHADE;
        case 2:
            return editor.codepage.MEDIUM_SHADE;
        case 3:
            return editor.codepage.LIGHT_SHADE;
        default:
            return editor.codepage.FULL_BLOCK;
        }
    }

    function selectFromEvent(evt) {
        var noblink, pos, x, y, otherCol, tempCurrentColor;
        noblink = editor.getBlinkStatus();
        pos = evt.currentTarget.getBoundingClientRect();
        x = Math.min(Math.floor((evt.clientX - pos.left + 1) / (editor.codepage.getFontWidth() * 4)), 4);
        y = Math.min(Math.floor((evt.clientY - pos.top + 1) / editor.codepage.getFontHeight()), 14);
        otherCol = (y < currentColor) ? y : y + 1;
        if (x === 0 && ((currentColor < 8) || (noblink))) {
            if (otherCol >= 8) {
                otherCol -= 8;
            }
            selection = {"color": currentColor, "x": x, "y": y, "fg": currentColor, "bg": otherCol, "code": editor.codepage.FULL_BLOCK};
            updateCanvas();
        } else if (x === 4 && ((currentColor < 8) || (noblink))) {
            if (!noblink && currentColor >= 8) {
                if (currentColor === otherCol || currentColor === otherCol + 8) {
                    tempCurrentColor = 0;
                } else {
                    tempCurrentColor = currentColor - 8;
                }
            } else {
                tempCurrentColor = currentColor;
            }
            selection = {"color": currentColor, "x": x, "y": y, "fg": otherCol, "bg": tempCurrentColor, "code": editor.codepage.FULL_BLOCK};
            updateCanvas();
        } else if (x === 4 && otherCol < 8) {
            selection = {"color": currentColor, "x": x, "y": y, "fg": otherCol, "bg": tempCurrentColor, "code": editor.codepage.FULL_BLOCK};
            updateCanvas();
        } else if (otherCol < 8) {
            selection = {"color": currentColor, "x": x, "y": y, "fg": currentColor, "bg": otherCol, "code": getShading((otherCol < 8) ? x : (4 - x))};
            updateCanvas();
        } else if (noblink || currentColor < 8) {
            selection = {"color": currentColor, "x": x, "y": y, "fg": otherCol, "bg": currentColor, "code": getShading((otherCol < 8) ? x : (4 - x))};
            updateCanvas();
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

    function createCanvases() {
        canvas = ElementHelper.create("canvas", {"width": editor.codepage.getFontWidth() * 20, "height": editor.codepage.getFontHeight() * 15, "style": {"cursor": "crosshair"}});
        quickAccess = ElementHelper.create("canvas", {"width": editor.codepage.getFontWidth() * 20, "height": editor.codepage.getFontHeight() * 15, "style": {"cursor": "crosshair"}});
        selectionCanvas = createSelectionCanvas();
        ctx = canvas.getContext("2d");
        quickAccessCtx = quickAccess.getContext("2d");
        imageData = ctx.createImageData(canvas.width, canvas.height);
        shadedPaletteCanvases = new Array(16);
        canvas.addEventListener("mousedown", mousedown, false);
        canvas.addEventListener("mousemove", mousemove, false);
        quickAccess.addEventListener("mousedown", function (evt) {
            mousedown(evt);
            toolbar.giveFocus("shaded-palette");
        }, false);
        quickAccess.addEventListener("mousemove", mousemove, false);
    }

    function extendedPaletteBrush(block) {
        editor.setTextBlock(block, selection.code, selection.fg, selection.bg);
    }

    function sampleBlock(coord) {
        if (coord.charCode >= editor.codepage.LIGHT_SHADE && coord.charCode <= editor.codepage.DARK_SHADE) {
            if (coord.foreground < 8) {
                editor.setCurrentColor(coord.foreground);
                selection = {"color": coord.foreground, "x": editor.codepage.DARK_SHADE - coord.charCode + 1, "y": coord.background - ((coord.background > coord.foreground) ? 1 : 0), "fg": coord.foreground, "bg": coord.background, "code": coord.charCode};
            } else {
                editor.setCurrentColor(coord.background);
                selection = {"color": coord.background, "x": coord.charCode - editor.codepage.LIGHT_SHADE + 1, "y": coord.foreground - ((coord.foreground > coord.background) ? 1 : 0), "fg": coord.foreground, "bg": coord.background, "code": coord.charCode};
            }
            updateCanvas();
            return true;
        }
        return false;
    }

    function canvasDown(coord) {
        if (coord.ctrlKey) {
            toolbar.sampleBlock(coord);
        } else if (selection !== undefined) {
            if (coord.shiftKey && lastPoint) {
                editor.startOfChunk();
                editor.blockLine(lastPoint, coord, extendedPaletteBrush);
                editor.endOfChunk();
            } else {
                editor.startOfFreehand();
                extendedPaletteBrush(coord);
            }
            lastPoint = coord;
        }
    }

    function canvasDrag(coord) {
        if (selection !== undefined) {
            editor.blockLine(lastPoint, coord, extendedPaletteBrush);
            lastPoint = coord;
        }
    }

    function onload() {
        colorChange(editor.getCurrentColor());
    }

    function iceColorChange() {
        var i;
        for (i = 8; i < 16; i += 1) {
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

    function rehashTool() {
        createCanvases();
        colorChange(editor.getCurrentColor());
        toolbar.replaceCanvas("shaded-palette", canvas);
        toolbar.replaceQuickAccess("shaded-palette", quickAccess);
    }

    createCanvases();
    editor.addBlinkModeChangeListener(iceColorChange);
    editor.addColorChangeListener(colorChange, false);
    editor.addFontChangeListener(rehashTool);
    editor.addPaletteChangeListener(rehashTool);

    function init() {
        editor.addMouseDownListener(canvasDown);
        editor.addMouseDragListener(canvasDrag);
        return true;
    }

    function remove() {
        editor.removeMouseDownListener(canvasDown);
        editor.removeMouseDragListener(canvasDrag);
    }

    function getState() {
        if (selection !== undefined) {
            return [selection.color, selection.x, selection.y, selection.fg, selection.bg, selection.code];
        }
        return [];
    }

    function setState(bytes) {
        selection = {"color": bytes[0], "x": bytes[1], "y": bytes[2], "fg": bytes[3], "bg": bytes[4], "code": bytes[5]};
        updateCanvas();
    }

    function toString() {
        return "Shaded Palette";
    }

    return {
        "onload": onload,
        "init": init,
        "remove": remove,
        "getState": getState,
        "setState": setState,
        "sampleBlock": sampleBlock,
        "toString": toString,
        "canvas": canvas,
        "quickAccess": quickAccess,
        "uid": "shaded-palette"
    };
}

AnsiEditController.addTool(shadedPaletteTool, "tools-left", 32);