function customBrushTool(editor, toolbar) {
    "use strict";
    var canvas, ctx, stampImageData, stampCanvas, stampX, stampY, lastPoint;

    canvas = ElementHelper.create("canvas", {"width": editor.columns * editor.codepage.fontWidth, "height": editor.height * editor.codepage.fontHeight, "style": {"opacity": "0.8"}});
    ctx = canvas.getContext("2d");

    function clearStamp() {
        if (stampCanvas) {
            ctx.clearRect((stampX - Math.floor(stampImageData.width / 2)) * editor.codepage.fontWidth, (stampY - Math.floor(stampImageData.height / 2)) * editor.codepage.fontHeight, stampCanvas.width, stampCanvas.height);
        }
    }

    function redrawStamp(textX, textY) {
        clearStamp();
        if (stampCanvas) {
            ctx.drawImage(stampCanvas, (textX - Math.floor(stampImageData.width / 2)) * editor.codepage.fontWidth, (textY - Math.floor(stampImageData.height / 2)) * editor.codepage.fontHeight);
        }
        stampX = textX;
        stampY = textY;
    }

    function useStamp(block, ignoreTransparency) {
        editor.putImageData(stampImageData, block.textX - Math.floor(stampImageData.width / 2), block.textY - Math.floor(stampImageData.height / 2), ignoreTransparency);
    }

    function canvasMove(evt) {
        redrawStamp(evt.detail.textX, evt.detail.textY);
    }

    function canvasDown(evt) {
        if (stampCanvas) {
            editor.takeUndoSnapshot();
            if (evt.detail.shiftKey && lastPoint) {
                editor.blockLine(lastPoint, evt.detail, function (block) {
                    useStamp(block, !evt.detail.altKey);
                });
            } else {
                useStamp(evt.detail, !evt.detail.altKey);
            }
            lastPoint = evt.detail;
        }
    }

    function canvasDrag(evt) {
        if (lastPoint) {
            editor.blockLine(lastPoint, evt.detail, function (block) {
                useStamp(block, !evt.detail.altKey);
            });
            lastPoint = evt.detail;
        }
    }

    function canvasOut() {
        clearStamp();
        stampX = undefined;
        stampY = undefined;
    }

    function flipBrushX() {
        var newStampImageData, x, y, block, index, newIndex;
        if (stampImageData) {
            newStampImageData = {"width": stampImageData.width, "height": stampImageData.height, "data": new Uint8Array(stampImageData.data.length)};
            for (y = 0; y < stampImageData.height; ++y) {
                for (x = 0; x < stampImageData.width; ++x) {
                    index = (y * stampImageData.width + x) * 3;
                    block = stampImageData.data.subarray(index, index + 3);
                    block[0] = editor.codepage.getFlippedTextX(block[0]);
                    newIndex = (y * stampImageData.width + (stampImageData.width - (x + 1))) * 3;
                    newStampImageData.data.set(block, newIndex);
                }
            }
            toolbar.giveFocus("custombrush");
            stampImageData = newStampImageData;
            stampCanvas = editor.renderImageData(stampImageData, true);
            if (stampX && stampY) {
                redrawStamp(stampX, stampY);
            }
        }
    }

    function flipBrushY() {
        var newStampImageData, x, y, block, index, newIndex;
        if (stampImageData) {
            newStampImageData = {"width": stampImageData.width, "height": stampImageData.height, "data": new Uint8Array(stampImageData.data.length)};
            for (x = 0; x < stampImageData.width; ++x) {
                for (y = 0; y < stampImageData.height; ++y) {
                    index = (y * stampImageData.width + x) * 3;
                    block = stampImageData.data.subarray(index, index + 3);
                    block[0] = editor.codepage.getFlippedTextY(block[0]);
                    newIndex = ((stampImageData.height - (y + 1)) * stampImageData.width + x) * 3;
                    newStampImageData.data.set(block, newIndex);
                }
            }
            toolbar.giveFocus("custombrush");
            stampImageData = newStampImageData;
            stampCanvas = editor.renderImageData(stampImageData, true);
            if (stampX && stampY) {
                redrawStamp(stampX, stampY);
            }
        }
    }

    editor.canvas.addEventListener("flipbrushx", flipBrushX, false);
    editor.canvas.addEventListener("flipbrushy", flipBrushY, false);

    editor.canvas.addEventListener("canvasStamp", function (evt) {
        clearStamp();
        stampImageData = evt.detail;
        if (stampImageData) {
            stampCanvas = editor.renderImageData(stampImageData, true);
            toolbar.giveFocus("custombrush");
        } else {
            stampCanvas = undefined;
        }
    }, false);

    function init() {
        editor.canvas.addEventListener("canvasMove", canvasMove, false);
        editor.canvas.addEventListener("canvasDown", canvasDown, false);
        editor.canvas.addEventListener("canvasDrag", canvasDrag, false);
        editor.canvas.addEventListener("canvasOut", canvasOut, false);
        editor.addOverlay(canvas, "custombrush");
        return true;
    }

    function remove() {
        editor.canvas.removeEventListener("canvasMove", canvasMove);
        editor.canvas.removeEventListener("canvasDrag", canvasDrag);
        editor.canvas.removeEventListener("canvasDown", canvasDown);
        editor.canvas.removeEventListener("canvasOut", canvasOut);
        editor.removeOverlay("custombrush");
    }

    function toString() {
        return "Custom Brush";
    }

    return {
        "init": init,
        "remove": remove,
        "toString": toString,
        "uid": "custombrush"
    };
}

AnsiEditController.addTool(customBrushTool, "tools-right", 112);