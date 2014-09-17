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

    function dataUrlToBytes(dataURL) {
        var base64Index, mimeType, byteChars, bytes, i;
        if (dataURL.indexOf("data:") === 0) {
            base64Index = dataURL.indexOf(";base64,");
            if (base64Index !== -1) {
                mimeType = dataURL.substr(5, base64Index - 5);
                base64Index += 8;
                byteChars = atob(dataURL.substr(base64Index, dataURL.length - base64Index));
                bytes = new Uint8Array(byteChars.length);
                for (i = 0; i < bytes.length; i += 1) {
                    bytes[i] = byteChars.charCodeAt(i);
                }
                return {"bytes": bytes, "mimeType": mimeType};
            }
        }
        return undefined;
    }

    function saveCanvas(canvas, filename) {
        var data;
        data = dataUrlToBytes(canvas.toDataURL());
        if (data !== undefined) {
            Savers.saveFile(data.bytes, data.mimeType, filename);
        }
    }

    function init() {
        saveCanvas(generateCodepage(), toolbar.getTitleText() + "-font.png");

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