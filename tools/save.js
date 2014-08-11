function saveTool(editor, toolbar, title) {
    "use strict";

    function init() {
        Savers.saveXBinData(editor.getImageData(0, 0, editor.columns, editor.height), editor.noblink, title.getText() + ".xb");

        return false;
    }

    function toString() {
        return "Save";
    }

    return {
        "init": init,
        "toString": toString,
        "uid": "save"
    };
}

AnsiEditController.addTool(saveTool, "tools-left");