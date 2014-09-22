function savePalette(editor, toolbar) {
    "use strict";

    function createPalette() {
        var canvas, ctx, i;
        canvas = ElementHelper.create("canvas", {"width": 160, "height": 40, "style": {"cursor": "crosshair"}});
        ctx = canvas.getContext("2d");
        for (i = 0; i < 16; i += 1) {
            ctx.fillStyle = editor.getRGBAColorFor(i, 1);
            ctx.fillRect(
                (i % 8) * canvas.width / 8,
                (i < 8) ? canvas.height / 2 : 0,
                canvas.width / 8,
                canvas.height / 2
            );
        }
        return canvas;
    }

    function init() {
        Savers.saveCanvas(createPalette(), toolbar.getTitleText() + "-palette.png");
        return false;
    }

    function toString() {
        return "Save Palette";
    }

    return {
        "init": init,
        "toString": toString,
        "uid": "save-palette"
    };
}

AnsiEditController.addTool(savePalette, "tools-left");