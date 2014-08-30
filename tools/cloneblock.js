function cloneBlockTool(editor) {
    "use strict";

    var blockBrush, lastPoint, canvas, ctx, imageData;

    function cloneBrush(block) {
        editor.setTextBlock(block, blockBrush.charCode, blockBrush.foreground, blockBrush.background);
    }

    canvas = ElementHelper.create("canvas", {"width": editor.codepage.fontWidth, "height": editor.codepage.fontHeight, "style": {"border": "1px solid #444"}});
    ctx = canvas.getContext("2d");
    imageData = ctx.createImageData(canvas.width, canvas.height);

    function sampleTextBlock(textX, textY) {
        blockBrush = editor.getTextBlock(textX, textY);
        imageData.data.set(editor.codepage.bigFont(blockBrush.charCode, blockBrush.foreground, blockBrush.background));
        ctx.putImageData(imageData, 0, 0);
    }

    function canvasDown(coord) {
        if (coord.ctrlKey || coord.altKey) {
            sampleTextBlock(coord.textX, coord.textY);
            if (coord.altKey) {
                editor.startOfDrawing();
            }
        } else if (blockBrush !== undefined) {
            editor.startOfDrawing();
            if (coord.shiftKey && lastPoint) {
                editor.blockLine(lastPoint, coord, cloneBrush);
            } else {
                cloneBrush(coord);
            }
        }
        if (!coord.ctrlKey || coord.altlKey) {
            lastPoint = coord;
        }
    }

    function canvasDrag(coord) {
        if (blockBrush !== undefined && lastPoint) {
            editor.blockLine(lastPoint, coord, cloneBrush);
            lastPoint = coord;
        }
    }

    function init() {
        editor.addMouseDownListener(canvasDown);
        editor.addMouseDragListener(canvasDrag);
        editor.addMouseUpListener(editor.endOfDrawing);
        editor.addMouseOutListener(editor.endOfDrawing);
        return true;
    }

    function remove() {
        editor.removeMouseDownListener(canvasDown);
        editor.removeMouseDragListener(canvasDrag);
        editor.removeMouseUpListener(editor.endOfDrawing);
        editor.removeMouseOutListener(editor.endOfDrawing);
    }

    function getState() {
        if (blockBrush !== undefined) {
            return [blockBrush.charCode, blockBrush.foreground, blockBrush.background];
        }
        return [];
    }

    function setState(bytes) {
        blockBrush = {"charCode": bytes[0], "foreground": bytes[1], "background": bytes[2]};
        imageData.data.set(editor.codepage.bigFont(blockBrush.charCode, blockBrush.foreground, blockBrush.background));
        ctx.putImageData(imageData, 0, 0);
    }

    function toString() {
        return "Clone Block";
    }

    return {
        "init": init,
        "remove": remove,
        "getState": getState,
        "setState": setState,
        "toString": toString,
        "canvas": canvas,
        "uid": "clone-block"
    };
}

AnsiEditController.addTool(cloneBlockTool, "tools-right", 44);