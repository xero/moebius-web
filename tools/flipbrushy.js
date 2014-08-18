function flipBrushYTool(editor) {
    "use strict";

    function init() {
        editor.fireCustomEvent("custombrush", {"operation": "flipy"});
        return false;
    }

    function toString() {
        return "Custom Brush FlipY";
    }

    return {
        "init": init,
        "toString": toString,
        "uid": "flipbrushy"
    };
}

AnsiEditController.addTool(flipBrushYTool, "tools-right", 93);