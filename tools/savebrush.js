function saveBrush(editor, toolbar) {
    "use strict";
    var stampImageData;

    editor.addCustomEventListener("custom-brush", function (evt) {
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
            Savers.saveXBinData(stampImageData, editor.getBlinkStatus(), editor.codepage.getFontHeight(), editor.codepage.getFontBytes(), editor.codepage.getPalette(), "", "", "", toolbar.getTitleText() + "-stamp.xb");
        }

        return false;
    }

    function toString() {
        return "Save Brush";
    }

    return {
        "init": init,
        "toString": toString,
        "uid": "save-brush"
    };
}

AnsiEditController.addTool(saveBrush, "tools-left");