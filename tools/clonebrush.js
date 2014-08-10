function cloneBrushTool(editor) {
    "use strict";

    var blockBrush, lastPoint, canvas;

    function cloneBrush(block) {
        editor.setTextBlock(block, blockBrush.charCode, blockBrush.foreground, blockBrush.background);
    }

    canvas = ElementHelper.create("canvas", {"width": editor.codepage.fontWidth, "height": editor.codepage.fontHeight, "style": {"border": "1px solid #444"}});

    function canvasDown(evt) {
        var ctx, imageData;
        if (evt.detail.altKey) {
            blockBrush = editor.getTextBlock(evt.detail.textX, evt.detail.textY);
            ctx = canvas.getContext("2d");
            imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            imageData.data.set(editor.codepage.bigFont(blockBrush.charCode, blockBrush.foreground, blockBrush.background));
            ctx.putImageData(imageData, 0, 0);
        } else if (blockBrush !== undefined) {
            editor.takeUndoSnapshot();
            if (evt.detail.shiftKey && lastPoint) {
                editor.blockLine(lastPoint, evt.detail, cloneBrush);
            } else {
                cloneBrush(evt.detail);
            }
            lastPoint = evt.detail;
        }
    }

    function canvasDrag(evt) {
        if (blockBrush !== undefined && lastPoint) {
            editor.blockLine(lastPoint, evt.detail, cloneBrush);
            lastPoint = evt.detail;
        }
    }

    function init() {
        editor.canvas.addEventListener("canvasDown", canvasDown, false);
        editor.canvas.addEventListener("canvasDrag", canvasDrag, false);
        return true;
    }

    function remove() {
        editor.canvas.removeEventListener("canvasDown", canvasDown);
        editor.canvas.removeEventListener("canvasDrag", canvasDrag);
    }

    function toString() {
        return "Clone Brush";
    }

    return {
        "init": init,
        "remove": remove,
        "toString": toString,
        "canvas": canvas,
        "uid": "clonebrush"
    };
}

AnsiEditController.addTool(cloneBrushTool, "tools-right", 44);