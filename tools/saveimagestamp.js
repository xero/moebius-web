function saveImageStampTool(editor) {
    "use strict";
    var stampImageData;

    editor.canvas.addEventListener("canvasStamp", function (evt) {
        stampImageData = evt.detail;
    }, false);

    function init() {
        if (stampImageData) {
            Savers.saveXBinData(stampImageData, editor.noblink, "imagestamp.xb");
        }

        return false;
    }

    function toString() {
        return "Save Image Stamp";
    }

    return {
        "init": init,
        "toString": toString,
        "uid": "saveimagestamp"
    };
}

AnsiEditController.addTool(saveImageStampTool, "tools-left");