function saveAsXbinTool(editor, toolbar) {
    "use strict";

    function init() {
        var metadata;
        metadata = editor.getMetadata();
        Savers.saveXBinData(editor.getImageData(0, 0, editor.getColumns(), editor.getRows()), editor.getBlinkStatus(), metadata.title, metadata.author, metadata.group, toolbar.getTitleText() + ".xb");

        return false;
    }

    function toString() {
        return "Save as XBin";
    }

    return {
        "init": init,
        "toString": toString,
        "uid": "save-xbin"
    };
}

AnsiEditController.addTool(saveAsXbinTool, "tools-left");