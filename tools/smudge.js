function smudgeTool(editor, toolbar) {
    "use strict";

    var blockBrush, lastPoint, canvas, ctx, imageData;

    function smudgeBrush(block) {
        editor.setTextBlock(block, blockBrush.charCode, blockBrush.foreground, blockBrush.background);
    }

    function redrawBlockBrush() {
        imageData.data.set(editor.codepage.bigFont(blockBrush.charCode, blockBrush.foreground, blockBrush.background));
        ctx.putImageData(imageData, 0, 0);
    }

    function iceColorChange(noblink) {
        if (!noblink && blockBrush) {
            if (blockBrush.background >= 8) {
                blockBrush.background -= 8;
            }
            redrawBlockBrush();
        }
    }

    if (editor.getRetina()) {
        canvas = ElementHelper.create("canvas", {"width": editor.codepage.getFontWidth() * 2, "height": editor.codepage.getFontHeight() * 2, "style": {"border": "1px solid #444"}});
    } else {
        canvas = ElementHelper.create("canvas", {"width": editor.codepage.getFontWidth(), "height": editor.codepage.getFontHeight(), "style": {"border": "1px solid #444"}});
    }
    ctx = canvas.getContext("2d");
    imageData = ctx.createImageData(canvas.width, canvas.height);

    editor.addBlinkModeChangeListener(iceColorChange);

    function canvasDown(coord) {
        if (coord.ctrlKey) {
            toolbar.sampleBlock(coord);
        } else {
            if (coord.shiftKey && lastPoint) {
                editor.startOfChunk();
                editor.blockLine(lastPoint, coord, smudgeBrush);
                editor.endOfChunk();
            } else {
                blockBrush = coord;
                redrawBlockBrush();
                editor.startOfFreehand();
                smudgeBrush(coord);
            }
            lastPoint = coord;
        }
    }

    function canvasDrag(coord) {
        if (blockBrush !== undefined && lastPoint) {
            editor.blockLine(lastPoint, coord, smudgeBrush);
            lastPoint = coord;
        }
    }

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
        if (blockBrush !== undefined) {
            return [blockBrush.charCode, blockBrush.foreground, blockBrush.background];
        }
        return [];
    }

    function setState(bytes) {
        blockBrush = {"charCode": bytes[0], "foreground": bytes[1], "background": bytes[2]};
        redrawBlockBrush();
    }

    function toString() {
        return "Smudge";
    }

    return {
        "init": init,
        "remove": remove,
        "getState": getState,
        "setState": setState,
        "toString": toString,
        "canvas": canvas,
        "uid": "smudge"
    };
}

AnsiEditController.addTool(smudgeTool, "tools-right", 119);