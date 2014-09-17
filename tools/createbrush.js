function createBrushTool(editor, toolbar) {
    "use strict";
    var canvas, ctx, startX, startY, oldEndX, oldEndY;

    function selectionPattern() {
        var patternCanvas, patternCtx, halfWidth, halfHeight;
        patternCanvas = ElementHelper.create("canvas", {"width": editor.codepage.getFontHeight(), "height": editor.codepage.getFontHeight()});
        halfWidth = patternCanvas.width / 2;
        halfHeight = patternCanvas.height / 2;
        patternCtx = patternCanvas.getContext("2d");
        patternCtx.fillStyle = "white";
        patternCtx.fillRect(0, 0, halfWidth, halfHeight);
        patternCtx.fillRect(halfWidth, halfHeight, halfWidth, halfHeight);
        patternCtx.fillStyle = "black";
        patternCtx.fillRect(halfWidth, 0, halfWidth, halfHeight);
        patternCtx.fillRect(0, halfHeight, halfWidth, halfHeight);
        return patternCanvas;
    }

    function createCanvas() {
        canvas = ElementHelper.create("canvas", {"width": editor.getColumns() * editor.codepage.getFontWidth(), "height": editor.getRows() * editor.codepage.getFontHeight(), "style": {"opacity": "0.8"}});
        ctx = canvas.getContext("2d");
        ctx.strokeStyle = ctx.createPattern(selectionPattern(), "repeat");
        ctx.lineWidth = editor.codepage.getFontWidth() / 2;
    }

    function translateCoords(fromTextX, fromTextY, toTextX, toTextY) {
        var textX, textY, width, height;

        if (toTextX < fromTextX) {
            textX = toTextX;
            width = (fromTextX - toTextX + 1);
        } else {
            textX = fromTextX;
            width = (toTextX - fromTextX + 1);
        }
        if (toTextY < fromTextY) {
            textY = toTextY;
            height = (fromTextY - toTextY + 1);
        } else {
            textY = fromTextY;
            height = (toTextY - fromTextY + 1);
        }

        return {
            "textX": textX,
            "textY": textY,
            "width": width,
            "height": height
        };
    }

    function canvasDown(coord) {
        if (coord.ctrlKey) {
            toolbar.sampleBlock(coord);
        } else {
            startX = coord.textX;
            startY = coord.textY;
        }
    }

    function clearSelection() {
        var coords, fontWidth, fontHeight;
        if (oldEndX !== undefined && oldEndY !== undefined) {
            coords = translateCoords(startX, startY, oldEndX, oldEndY);
            fontWidth = editor.codepage.getFontWidth();
            fontHeight = editor.codepage.getFontHeight();
            ctx.clearRect(coords.textX * fontWidth, coords.textY * fontHeight, coords.width * fontWidth, coords.height * fontHeight);
        }
    }

    function canvasDrag(coord) {
        var coords, fontWidth, fontHeight;
        clearSelection();
        coords = translateCoords(startX, startY, coord.textX, coord.textY);
        fontWidth = editor.codepage.getFontWidth();
        fontHeight = editor.codepage.getFontHeight();
        ctx.strokeRect(coords.textX * fontWidth + ctx.lineWidth, coords.textY * fontHeight + ctx.lineWidth, coords.width * fontWidth - ctx.lineWidth * 2, coords.height * fontHeight - ctx.lineWidth * 2);
        oldEndX = coord.textX;
        oldEndY = coord.textY;
    }

    function canvasUp(coord) {
        var coords, pasteY, pasteX, block;
        clearSelection();
        coords = translateCoords(startX, startY, coord.textX, coord.textY);
        editor.fireCustomEvent("custom-brush", {"operation": "load", "imageData": editor.getImageData(coords.textX, coords.textY, coords.width, coords.height)});
        if (coord.altKey) {
            editor.startOfChunk();
            for (pasteY = 0; pasteY < coords.height; pasteY += 1) {
                for (pasteX = 0; pasteX < coords.width; pasteX += 1) {
                    block = editor.getTextBlock(coords.textX + pasteX, coords.textY + pasteY);
                    editor.setTextBlock(block, editor.codepage.NULL, block.foreground, 0);
                }
            }
            editor.endOfChunk();
        }
    }

    function canvasOut() {
        clearSelection();
    }

    createCanvas();

    editor.addOverlayChangeListener(createCanvas);

    function init() {
        editor.addMouseDownListener(canvasDown);
        editor.addMouseDragListener(canvasDrag);
        editor.addMouseUpListener(canvasUp);
        editor.addMouseOutListener(canvasOut);
        editor.addOverlay(canvas, "create-brush", function () {
            return canvas;
        }, 1);
        return true;
    }

    function remove() {
        editor.removeMouseDownListener(canvasDown);
        editor.removeMouseDragListener(canvasDrag);
        editor.removeMouseUpListener(canvasUp);
        editor.removeMouseOutListener(canvasOut);
        editor.removeOverlay("create-brush");
    }

    function toString() {
        return "Create Custom Brush";
    }

    return {
        "init": init,
        "remove": remove,
        "toString": toString,
        "uid": "create-brush"
    };
}

AnsiEditController.addTool(createBrushTool, "tools-right", 99);