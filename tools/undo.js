function undoTool(editor, toolbar) {
    "use strict";

    function init() {
        editor.undo();
        toolbar.flash("undo");
        return false;
    }

    function shiftKey() {
        editor.redo();
        toolbar.flash("undo");
        return false;
    }

    function toString() {
        return "Undo / Redo";
    }

    return {
        "init": init,
        "shiftKey": shiftKey,
        "toString": toString,
        "uid": "undo"
    };
}

AnsiEditController.addTool(undoTool, "tools-right", 122);