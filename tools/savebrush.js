function saveBrush(editor, toolbar, title) {
    "use strict";
    var stampImageData;

    editor.canvas.addEventListener("canvasStamp", function (evt) {
        stampImageData = evt.detail;
    }, false);

    function init() {
        if (stampImageData) {
            Savers.saveXBinData(stampImageData, editor.noblink, title.getText() + "-stamp.xb");
        }

        return false;
    }

    function toString() {
        return "Save Brush";
    }

    return {
        "init": init,
        "toString": toString,
        "uid": "savebrush"
    };
}

AnsiEditController.addTool(saveBrush, "tools-left");