function imageStamp(editor, toolbar) {
    "use strict";
    var canvas, ctx, stampImageData, stampCanvas, stampX, stampY;

    canvas = ElementHelper.create("canvas", {"width": 80 * editor.codepage.fontWidth, "height": editor.height * editor.codepage.fontHeight, "style": {"opacity": "0.8"}});
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

    function canvasMove(evt) {
        redrawStamp(evt.detail.textX, evt.detail.textY);
    }

    function canvasDown(evt) {
        if (stampCanvas) {
            editor.takeUndoSnapshot();
            editor.putImageData(stampImageData, evt.detail.textX - Math.floor(stampImageData.width / 2), evt.detail.textY - Math.floor(stampImageData.height / 2), !evt.detail.altKey);
        }
    }

    function canvasOut() {
        clearStamp();
    }

    editor.canvas.addEventListener("canvasStamp", function (evt) {
        clearStamp();
        stampImageData = evt.detail;
        if (stampImageData) {
            stampCanvas = editor.renderImageData(stampImageData);
            toolbar.giveFocus("imagestamp");
        } else {
            stampCanvas = undefined;
        }
    }, false);

    function init() {
        editor.canvas.addEventListener("canvasMove", canvasMove, false);
        editor.canvas.addEventListener("canvasDown", canvasDown, false);
        editor.canvas.addEventListener("canvasOut", canvasOut, false);
        editor.addOverlay(canvas, "imagestamp");
        return true;
    }

    function remove() {
        editor.canvas.removeEventListener("canvasMove", canvasMove);
        editor.canvas.removeEventListener("canvasDown", canvasDown);
        editor.canvas.removeEventListener("canvasOut", canvasOut);
        editor.removeOverlay("imagestamp");
    }

    function toString() {
        return "Image Stamp";
    }

    return {
        "init": init,
        "remove": remove,
        "toString": toString,
        "uid": "imagestamp"
    };
}

AnsiEditController.addTool(imageStamp, "tools-right", 112);