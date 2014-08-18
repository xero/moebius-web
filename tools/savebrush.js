function saveBrush(editor, toolbar, title) {
    "use strict";
    var stampImageData;

    editor.addCustomEventListener("custombrush", function (evt) {
        switch (evt.operation) {
        case "load":
            stampImageData = evt.imageData;
            break;
        case "changed":
            stampImageData = evt.imageData;
            break;
        default:
        }
    });

    function init() {
        if (stampImageData) {
            Savers.saveXBinData(stampImageData, editor.getBlinkStatus(), title.getText() + "-stamp.xb");
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