function extendedBrushTool(editor) {
    "use strict";
    var currentColor, lastPoint, canvas, fontImageDataDull, fontImageDataBright, selected;

    function colorChange(evt) {
        currentColor = evt.detail;
    }

    function extendedBrush(block) {
        editor.setChar(block, (selected < 32) ? selected : (selected + 128 - 32), currentColor);
    }

    function canvasDown(evt) {
        if (selected !== undefined) {
            editor.takeUndoSnapshot();
            if (evt.detail.shiftKey && lastPoint) {
                editor.blockLine(lastPoint, evt.detail, extendedBrush);
            } else {
                extendedBrush(evt.detail);
            }
            lastPoint = evt.detail;
        }
    }

    function canvasDrag(evt) {
        if (selected !== undefined && lastPoint) {
            editor.blockLine(lastPoint, evt.detail, extendedBrush);
            lastPoint = evt.detail;
        }
    }

    function generateFontImages(rgba) {
        var i, ctx, images;
        ctx = canvas.getContext("2d");
        images = [];
        for (i = 0; i < 160; i++) {
            images[i] = ctx.createImageData(editor.codepage.fontWidth, editor.codepage.fontHeight);
            images[i].data.set(editor.codepage.bigFontRGBA((i < 32) ? i : (i + 128 - 32), rgba), 0);
        }
        return images;
    }

    function drawGlyphs(images) {
        var i, y, ctx;
        ctx = canvas.getContext("2d");
        for (i = 0, y = 0; i < 160; ++i) {
            ctx.putImageData(images[i], (i % 16) * (editor.codepage.fontWidth + (editor.retina ? 2 : 1)), y * (editor.codepage.fontHeight + (editor.retina ? 2 : 1)));
            if ((i + 1) % 16 === 0) {
                ++y;
            }
        }
    }

    function drawGlyph(index, images) {
        var ctx;
        ctx = canvas.getContext("2d");
        ctx.putImageData(images[index], (index % 16) * (editor.codepage.fontWidth + (editor.retina ? 2 : 1)), Math.floor(index / 16) * (editor.codepage.fontHeight + (editor.retina ? 2 : 1)));
    }

    canvas = ElementHelper.create("canvas", {"width": 16 * (editor.codepage.fontWidth + (editor.retina ? 2 : 1)), "height": 10 * (editor.codepage.fontHeight + (editor.retina ? 2 : 1))});
    fontImageDataDull = generateFontImages(new Uint8Array([255, 255, 255, 63]));
    fontImageDataBright = generateFontImages(new Uint8Array([255, 255, 255, 255]));

    drawGlyphs(fontImageDataDull);

    function selectFromEvent(evt) {
        var x, y, index;
        x = (evt.offsetX !== undefined) ? evt.offsetX : (evt.layerX - evt.currentTarget.offsetLeft);
        y = (evt.offsetY !== undefined) ? evt.offsetY : (evt.layerY - evt.currentTarget.offsetTop);
        x = Math.floor(x / (editor.codepage.fontWidth + (editor.retina ? 2 : 1)) * (editor.retina ? 2 : 1));
        y = Math.floor(y / (editor.codepage.fontHeight + (editor.retina ? 2 : 1)) * (editor.retina ? 2 : 1));
        index = y * 16 + x;
        if (index !== selected && index < 160) {
            if (selected !== undefined) {
                drawGlyph(selected, fontImageDataDull);
            }
            drawGlyph(index, fontImageDataBright);
            selected = index;
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

    canvas.addEventListener("mousedown", mousedown, false);
    canvas.addEventListener("mousemove", mousemove, false);

    function init() {
        editor.canvas.addEventListener("canvasDown", canvasDown, false);
        editor.canvas.addEventListener("canvasDrag", canvasDrag, false);
        editor.canvas.addEventListener("colorChange", colorChange, false);
        currentColor = editor.getCurrentColor();
        drawGlyphs(fontImageDataDull);
        if (selected !== undefined) {
            drawGlyph(selected, fontImageDataBright);
        }
        return true;
    }

    function remove() {
        editor.canvas.removeEventListener("canvasDown", canvasDown);
        editor.canvas.removeEventListener("canvasDrag", canvasDrag);
        editor.canvas.removeEventListener("colorChange", colorChange);
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

AnsiEditController.addTool(extendedBrushTool, "tools-right", 101);