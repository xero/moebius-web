function copyTool(editor) {
    "use strict";
    var canvas, ctx, startX, startY, oldEndX, oldEndY, imageData;

    function selectionPattern() {
        var patternCanvas, patternCtx, halfWidth, halfHeight;
        patternCanvas = ElementHelper.create("canvas", {"width": editor.codepage.fontHeight, "height": editor.codepage.fontHeight});
        halfWidth = patternCanvas.width / 2;
        halfHeight = patternCanvas.height / 2;
        patternCtx = patternCanvas.getContext("2d");
        patternCtx.fillStyle = "rgb(255, 255, 255)";
        patternCtx.fillRect(0, 0, halfWidth, halfHeight);
        patternCtx.fillRect(halfWidth, halfHeight, halfWidth, halfHeight);
        patternCtx.fillStyle = "rgb(0, 0, 0)";
        patternCtx.fillRect(halfWidth, 0, halfWidth, halfHeight);
        patternCtx.fillRect(0, halfHeight, halfWidth, halfHeight);
        return patternCanvas;
    }

    canvas = ElementHelper.create("canvas", {"width": 80 * editor.codepage.fontWidth, "height": editor.height * editor.codepage.fontHeight, "style": {"opacity": "0.8"}});
    ctx = canvas.getContext("2d");
    ctx.strokeStyle = ctx.createPattern(selectionPattern(), "repeat");
    ctx.lineWidth = editor.codepage.fontWidth / 2;

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

    function canvasDown(evt) {
        startX = evt.detail.textX;
        startY = evt.detail.textY;
    }

    function clearSelection() {
        var coords;
        if (oldEndX !== undefined && oldEndY !== undefined) {
            coords = translateCoords(startX, startY, oldEndX, oldEndY);
            ctx.clearRect(coords.textX * editor.codepage.fontWidth, coords.textY * editor.codepage.fontHeight, coords.width * editor.codepage.fontWidth, coords.height * editor.codepage.fontHeight);
        }
    }

    function canvasDrag(evt) {
        var coords;
        clearSelection();
        coords = translateCoords(startX, startY, evt.detail.textX, evt.detail.textY);
        ctx.strokeRect(coords.textX * editor.codepage.fontWidth + ctx.lineWidth, coords.textY * editor.codepage.fontHeight + ctx.lineWidth, coords.width * editor.codepage.fontWidth - ctx.lineWidth * 2, coords.height * editor.codepage.fontHeight - ctx.lineWidth * 2);
        oldEndX = evt.detail.textX;
        oldEndY = evt.detail.textY;
    }

    function canvasUp(evt) {
        var coords, pasteY, pasteX, block, canvasStampEvt;
        clearSelection();
        coords = translateCoords(startX, startY, evt.detail.textX, evt.detail.textY);
        canvasStampEvt = new CustomEvent("canvasStamp", {"detail": editor.getImageData(coords.textX, coords.textY, coords.width, coords.height, !evt.detail.shiftKey)});
        editor.canvas.dispatchEvent(canvasStampEvt);
        if (evt.detail.altKey) {
            editor.takeUndoSnapshot();
            for (pasteY = 0; pasteY < coords.height; ++pasteY) {
                for (pasteX = 0; pasteX < coords.width; ++pasteX) {
                    block = editor.getTextBlock(coords.textX + pasteX, coords.textY + pasteY);
                    editor.setTextBlock(block, editor.codepage.NULL, block.foreground, 0);
                }
            }
        }
    }

    function canvasOut() {
        clearSelection();
    }

    function init() {
        editor.canvas.addEventListener("canvasDown", canvasDown, false);
        editor.canvas.addEventListener("canvasDrag", canvasDrag, false);
        editor.canvas.addEventListener("canvasUp", canvasUp, false);
        editor.canvas.addEventListener("canvasOut", canvasOut, false);
        editor.addOverlay(canvas, "copy");
        return true;
    }

    function remove() {
        editor.canvas.removeEventListener("canvasDown", canvasDown);
        editor.canvas.removeEventListener("canvasDrag", canvasDrag);
        editor.canvas.removeEventListener("canvasUp", canvasUp);
        editor.canvas.removeEventListener("canvasOut", canvasOut);
        editor.removeOverlay("copy");
    }

    function toString() {
        return "Copy";
    }

    return {
        "init": init,
        "remove": remove,
        "toString": toString,
        "uid": "copy"
    };
}

AnsiEditController.addTool(copyTool, "tools-right", 99);