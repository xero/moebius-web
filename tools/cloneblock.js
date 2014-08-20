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
        if (coord.altKey || coord.ctrlKey) {
            sampleTextBlock(coord.textX, coord.textY);
            if (coord.ctrlKey) {
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
        if (!coord.altKey || coord.ctrlKey) {
            lastPoint = coord;
        }
    }

    function canvasDrag(coord) {
        if (coord.altKey) {
            sampleTextBlock(coord.textX, coord.textY);
        } else {
            if (blockBrush !== undefined && lastPoint) {
                editor.blockLine(lastPoint, coord, cloneBrush);
                lastPoint = coord;
            }
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

    function toString() {
        return "Clone Block";
    }

    return {
        "init": init,
        "remove": remove,
        "toString": toString,
        "canvas": canvas,
        "uid": "cloneblock"
    };
}

AnsiEditController.addTool(cloneBlockTool, "tools-right", 44);