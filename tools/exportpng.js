function exportPNG(editor, toolbar, title) {
    "use strict";

    function init() {
        Savers.saveCanvas(editor.renderImageData(editor.getImageData(0, 0, editor.columns, editor.getHighestRow(), false)), title.getText() + ".png");

        return false;
    }

    function toString() {
        return "Export as PNG";
    }

    return {
        "init": init,
        "toString": toString,
        "uid": "exportPNG"
    };
}

AnsiEditController.addTool(exportPNG, "tools-left");