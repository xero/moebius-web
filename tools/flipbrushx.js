function flipBrushXTool(editor) {
    "use strict";

    function init() {
        editor.fireCustomEvent("custom-brush", {"operation": "flipx"});
        return false;
    }

    function toString() {
        return "Custom Brush FlipX";
    }

    return {
        "init": init,
        "toString": toString,
        "uid": "flip-brush-x"
    };
}

AnsiEditController.addTool(flipBrushXTool, "tools-right", 91);