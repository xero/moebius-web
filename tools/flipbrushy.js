function flipBrushYTool(editor) {
    "use strict";

    function init() {
        editor.fireCustomEvent("custom-brush", {"operation": "flipy"});
        return false;
    }

    function toString() {
        return "Custom Brush FlipY";
    }

    return {
        "init": init,
        "toString": toString,
        "uid": "flip-brush-y"
    };
}

AnsiEditController.addTool(flipBrushYTool, "tools-right", 93);