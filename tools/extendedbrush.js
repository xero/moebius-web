function extendedBrushTool(editor, palette, codepage, retina) {
    "use strict";
    var currentColor, lastPoint, canvas, fontImageDataDull, fontImageDataBright, selected, mouseButton;

    function colorChange(evt) {
        currentColor = evt.detail;
    }

    function paintChar(coord) {
        editor.setChar(128 + selected, currentColor, coord);
        editor.resolveConflict(coord);
    }

    function canvasDown(evt) {
        if (selected !== undefined) {
            editor.takeUndoSnapshot();
            if (evt.detail.shiftKey && lastPoint) {
                editor.chunkLine(lastPoint, evt.detail, paintChar);
            } else {
                editor.setChar(128 + selected, currentColor, evt.detail);
                editor.resolveConflict(evt.detail);
            }
            lastPoint = evt.detail;
        }
    }

    function canvasDrag(evt) {
        if (selected !== undefined && lastPoint) {
            editor.chunkLine(lastPoint, evt.detail, paintChar);
            lastPoint = evt.detail;
        }
    }

    function generateFontImages(rgba) {
        var i, ctx, images;
        ctx = canvas.getContext("2d");
        images = [];
        for (i = 0; i < 128; i++) {
            images[i] = ctx.createImageData(codepage.fontWidth, codepage.fontHeight);
            images[i].data.set(codepage.bigFontRGBA(i + 128, rgba), 0);
        }
        return images;
    }

    function drawGlyphs(images) {
        var i, y, ctx;
        ctx = canvas.getContext("2d");
        for (i = 0, y = 0; i < 128; ++i) {
            ctx.putImageData(images[i], (i % 16) * (codepage.fontWidth + (retina ? 2 : 1)), y * (codepage.fontHeight + (retina ? 2 : 1)));
            if ((i + 1) % 16 === 0) {
                ++y;
            }
        }
    }

    function drawGlyph(index, images) {
        var ctx;
        ctx = canvas.getContext("2d");
        ctx.putImageData(images[index], (index % 16) * (codepage.fontWidth + (retina ? 2 : 1)), Math.floor(index / 16) * (codepage.fontHeight + (retina ? 2 : 1)));
    }

    canvas = ElementHelper.create("canvas", {"width": 16 * (codepage.fontWidth + (retina ? 2 : 1)), "height": 8 * (codepage.fontHeight + (retina ? 2 : 1))});
    fontImageDataDull = generateFontImages(new Uint8Array([255, 255, 255, 64]));
    fontImageDataBright = generateFontImages(new Uint8Array([255, 255, 255, 255]));

    drawGlyphs(fontImageDataDull);

    function selectFromEvent(evt) {
        var x, y, index;
        x = (evt.offsetX !== undefined) ? evt.offsetX : (evt.layerX - evt.currentTarget.offsetLeft);
        y = (evt.offsetY !== undefined) ? evt.offsetY : (evt.layerY - evt.currentTarget.offsetTop);
        x = Math.floor(x / (codepage.fontWidth + (retina ? 2 : 1)) * (retina ? 2 : 1));
        y = Math.floor(y / (codepage.fontHeight + (retina ? 2 : 1)) * (retina ? 2 : 1));
        index = y * 16 + x;
        if (index !== selected) {
            if (selected !== undefined) {
                drawGlyph(selected, fontImageDataDull);
            }
            drawGlyph(index, fontImageDataBright);
            selected = index;
        }
    }

    function mousedown(evt) {
        selectFromEvent(evt);
        mouseButton = true;
    }

    function mouseup() {
        mouseButton = false;
    }

    function mousemove(evt) {
        if (mouseButton) {
            evt.preventDefault();
            selectFromEvent(evt);
        }
    }

    canvas.addEventListener("mousedown", mousedown, false);
    canvas.addEventListener("mouseup", mouseup, false);
    canvas.addEventListener("mousemove", mousemove, false);

    function init() {
        editor.canvas.addEventListener("canvasDown", canvasDown, false);
        editor.canvas.addEventListener("canvasDrag", canvasDrag, false);
        palette.canvas.addEventListener("colorChange", colorChange, false);
        currentColor = palette.getCurrentColor();
        drawGlyphs(fontImageDataDull);
        if (selected !== undefined) {
            drawGlyph(selected, fontImageDataBright);
        }
        return true;
    }

    function remove() {
        editor.canvas.removeEventListener("canvasDown", canvasDown);
        editor.canvas.removeEventListener("canvasDrag", canvasDrag);
        palette.canvas.removeEventListener("colorChange", colorChange);
        drawGlyphs(fontImageDataDull);
    }

    function toString() {
        return "Extended Brush";
    }

    return {
        "init": init,
        "remove": remove,
        "toString": toString,
        "canvas": canvas,
        "uid": "brushpalette"
    };
}