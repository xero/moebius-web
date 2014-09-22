function saveFont(editor, toolbar) {
    "use strict";

    var RGBA_BLACK, RGBA_WHITE;

    RGBA_BLACK = new Uint8Array([0, 0, 0, 255]);
    RGBA_WHITE = new Uint8Array([171, 171, 171, 255]);

    function generateCodepage() {
        var fontWidth, fontHeight, canvas, ctx, imageData, x, y, charCode;
        fontWidth = editor.codepage.getFontWidth();
        fontHeight = editor.codepage.getFontHeight();
        canvas = ElementHelper.create("canvas", {"width": fontWidth * 16, "height": fontHeight * 16});
        ctx = canvas.getContext("2d");
        imageData = ctx.createImageData(fontWidth, fontHeight);
        for (charCode = 0, y = 0; y < 16; y += 1) {
            for (x = 0; x < 16; x += 1, charCode += 1) {
                imageData.data.set(editor.codepage.fontDataRGBA(charCode, RGBA_WHITE, RGBA_BLACK), 0);
                ctx.putImageData(imageData, x * fontWidth, y * fontHeight);
            }
        }
        return canvas;
    }

    function init() {
        Savers.saveCanvas(generateCodepage(), toolbar.getTitleText() + "-font.png");
        return false;
    }

    function toString() {
        return "Save Font";
    }

    return {
        "init": init,
        "toString": toString,
        "uid": "save-font"
    };
}

AnsiEditController.addTool(saveFont, "tools-left");