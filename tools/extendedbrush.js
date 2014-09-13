function extendedBrushTool(editor, toolbar) {
    "use strict";
    var retina, currentColor, lastPoint, canvas, fontImageDataDull, fontImageDataBright, selected;

    selected = 0;

    function colorChange(col) {
        currentColor = col;
    }

    function extendedBrush(block) {
        editor.setChar(block, (selected < 32) ? selected : (selected + 128 - 32), currentColor);
    }

    function canvasDown(coord) {
        if (coord.ctrlKey) {
            toolbar.sampleBlock(coord);
        } else {
            if (selected !== undefined) {
                if (coord.shiftKey && lastPoint) {
                    editor.startOfChunk();
                    editor.blockLine(lastPoint, coord, extendedBrush);
                    editor.endOfChunk();
                } else {
                    editor.startOfFreehand();
                    extendedBrush(coord);
                }
                lastPoint = coord;
            }
        }
    }

    function canvasDrag(coord) {
        if (selected !== undefined && lastPoint) {
            editor.blockLine(lastPoint, coord, extendedBrush);
            lastPoint = coord;
        }
    }

    function generateFontImages(rgba) {
        var i, ctx, images;
        ctx = canvas.getContext("2d");
        images = [];
        for (i = 0; i < 160; i++) {
            if (retina) {
                images[i] = ctx.createImageData(editor.codepage.getFontWidth() * 2, editor.codepage.getFontHeight() * 2);
            } else {
                images[i] = ctx.createImageData(editor.codepage.getFontWidth(), editor.codepage.getFontHeight());
            }
            images[i].data.set(editor.codepage.bigFontRGBA((i < 32) ? i : (i + 128 - 32), rgba), 0);
        }
        return images;
    }

    function drawGlyphs(images) {
        var i, y, ctx;
        ctx = canvas.getContext("2d");
        for (i = 0, y = 0; i < 160; ++i) {
            if (retina) {
                ctx.putImageData(images[i], (i % 16) * (editor.codepage.getFontWidth() + 1) * 2, y * (editor.codepage.getFontHeight() + 1) * 2);
            } else {
                ctx.putImageData(images[i], (i % 16) * (editor.codepage.getFontWidth() + 1), y * (editor.codepage.getFontHeight() + 1));
            }
            if ((i + 1) % 16 === 0) {
                ++y;
            }
        }
    }

    function drawGlyph(index, images) {
        var ctx;
        ctx = canvas.getContext("2d");
        if (retina) {
            ctx.putImageData(images[index], (index % 16) * (editor.codepage.getFontWidth() + 1) * 2, Math.floor(index / 16) * (editor.codepage.getFontHeight() + 1) * 2);
        } else {
            ctx.putImageData(images[index], (index % 16) * (editor.codepage.getFontWidth() + 1), Math.floor(index / 16) * (editor.codepage.getFontHeight() + 1));
        }
    }

    retina = editor.getRetina();
    if (retina) {
        canvas = ElementHelper.create("canvas", {"width": 16 * (editor.codepage.getFontWidth() + 1) * 2, "height": 10 * (editor.codepage.getFontHeight() + 1) * 2, "style": {"cursor": "crosshair"}});
    } else {
        canvas = ElementHelper.create("canvas", {"width": 16 * (editor.codepage.getFontWidth() + 1), "height": 10 * (editor.codepage.getFontHeight() + 1), "style": {"cursor": "crosshair"}});
    }
    fontImageDataDull = generateFontImages(new Uint8Array([255, 255, 255, 63]));
    fontImageDataBright = generateFontImages(new Uint8Array([255, 255, 255, 255]));

    drawGlyphs(fontImageDataDull);

    function selectFromEvent(evt) {
        var x, y, index, pos;
        pos = evt.currentTarget.getBoundingClientRect();
        x = Math.floor((evt.clientX - pos.left) / (editor.codepage.getFontWidth() + 1));
        y = Math.floor((evt.clientY - pos.top) / (editor.codepage.getFontHeight() + 1));
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
        editor.addMouseDownListener(canvasDown);
        editor.addMouseDragListener(canvasDrag);
        editor.addColorChangeListener(colorChange);
        currentColor = editor.getCurrentColor();
        return true;
    }

    function remove() {
        editor.removeMouseDownListener(canvasDown);
        editor.removeMouseDragListener(canvasDrag);
        editor.removeColorChangeListener(colorChange);
    }

    function getState() {
        return [selected];
    }

    function setState(bytes) {
        selected = bytes[0];
        drawGlyphs(fontImageDataDull);
        drawGlyph(selected, fontImageDataBright);
    }

    function sampleBlock(block) {
        if (!block.isBlocky && (block.charCode <= 31 || (block.charCode >= 128 && (block.charCode < editor.codepage.LIGHT_SHADE || block.charCode > editor.codepage.DARK_SHADE)))) {
            editor.setCurrentColor(block.foreground);
            selected = (block.charCode <= 31) ? block.charCode : block.charCode - 128 + 32;
            drawGlyphs(fontImageDataDull);
            drawGlyph(selected, fontImageDataBright);
            return true;
        }
        return false;
    }

    function toString() {
        return "Extended Brush";
    }

    function quickChoose(asciiCode) {
        drawGlyphs(fontImageDataDull);
        selected = asciiCode + 32 - 128;
        drawGlyph(selected, fontImageDataBright);
    }

    function lightShade() {
        quickChoose(editor.codepage.LIGHT_SHADE);
    }

    function mediumShade() {
        quickChoose(editor.codepage.MEDIUM_SHADE);
    }

    function darkShade() {
        quickChoose(editor.codepage.DARK_SHADE);
    }

    function fullBlock() {
        quickChoose(editor.codepage.FULL_BLOCK);
    }

    function upperHalfBlock() {
        quickChoose(editor.codepage.UPPER_HALF_BLOCK);
    }

    function lowerHalfBlock() {
        quickChoose(editor.codepage.LOWER_HALF_BLOCK);
    }

    function leftHalfBlock() {
        quickChoose(editor.codepage.LEFT_HALF_BLOCK);
    }

    function rightHalfBlock() {
        quickChoose(editor.codepage.RIGHT_HALF_BLOCK);
    }

    function middleBlock() {
        quickChoose(editor.codepage.MIDDLE_BLOCK);
    }

    function middleDot() {
        quickChoose(editor.codepage.MIDDLE_DOT);
    }

    return {
        "init": init,
        "remove": remove,
        "toString": toString,
        "canvas": canvas,
        "getState": getState,
        "setState": setState,
        "sampleBlock": sampleBlock,
        "lightShade": lightShade,
        "mediumShade": mediumShade,
        "darkShade": darkShade,
        "fullBlock": fullBlock,
        "upperHalfBlock": upperHalfBlock,
        "lowerHalfBlock": lowerHalfBlock,
        "leftHalfBlock": leftHalfBlock,
        "rightHalfBlock": rightHalfBlock,
        "middleBlock": middleBlock,
        "middleDot": middleDot,
        "uid": "extended-brush"
    };
}

AnsiEditController.addTool(extendedBrushTool, "tools-right", 101, {"lightShade": 112, "mediumShade": 113, "darkShade": 114, "fullBlock": 115, "upperHalfBlock": 116, "lowerHalfBlock": 117, "leftHalfBlock": 118, "rightHalfBlock": 119, "middleBlock": 120, "middleDot": 121});