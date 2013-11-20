function undoTool(toolbar) {
    "use strict";

    function init() {
        toolbar.editor.undo();
        return false;
    }

    function toString() {
        return "Undo";
    }

    return {
        "init": init,
        "toString": toString,
        "uid": "undo"
    };
}

AnsiEditController.addTool(undoTool, 122);