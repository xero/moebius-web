function smallPalettePreviewTool(editor) {
    "use strict";
    var canvas;

    function colorChange(color) {
        var ctx = canvas.getContext("2d");
        ctx.fillStyle = editor.codepage.styleRGBA(color, 1);
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    function getCurrentColorAndChange() {
        colorChange(editor.getCurrentColor());
    }

    canvas = ElementHelper.create("canvas", {"width": 28, "height": 28});
    editor.addColorChangeListener(colorChange);
    editor.addPaletteChangeListener(getCurrentColorAndChange);

    function init() {
        return false;
    }

    function toString() {
        return "Palette";
    }

    return {
        "init": init,
        "toString": toString,
        "uid": "small-pallette-preview",
        "canvas": canvas,
        "hideText": true,
        "onload": getCurrentColorAndChange
    };
}

AnsiEditController.addTool(smallPalettePreviewTool, "small-palette-preview", undefined);