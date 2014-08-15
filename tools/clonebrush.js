function cloneBrushTool(editor) {
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

    function canvasDown(evt) {
        if (evt.detail.altKey || evt.detail.ctrlKey) {
            sampleTextBlock(evt.detail.textX, evt.detail.textY);
            if (evt.detail.ctrlKey) {
                editor.takeUndoSnapshot();
            }
        } else if (blockBrush !== undefined) {
            editor.takeUndoSnapshot();
            if (evt.detail.shiftKey && lastPoint) {
                editor.blockLine(lastPoint, evt.detail, cloneBrush);
            } else {
                cloneBrush(evt.detail);
            }
        }
        if (!evt.detail.altKey || evt.detail.ctrlKey) {
            lastPoint = evt.detail;
        }
    }

    function canvasDrag(evt) {
        if (evt.detail.altKey) {
            sampleTextBlock(evt.detail.textX, evt.detail.textY);
        } else {
            if (blockBrush !== undefined && lastPoint) {
                editor.blockLine(lastPoint, evt.detail, cloneBrush);
                lastPoint = evt.detail;
            }
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