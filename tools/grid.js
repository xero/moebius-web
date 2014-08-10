function gridTool(editor) {
    "use strict";
    var gridLight, gridDark, gridMode;

    function createGrid(rgba, highlightedRGBA, midToneRGBA) {
        var canvas, ctx, imageData, byteWidth, y, x, i;
        canvas = ElementHelper.create("canvas", {"width": editor.columns * editor.codepage.fontWidth, "height": editor.height * editor.codepage.fontHeight});
        ctx = canvas.getContext("2d");
        imageData = ctx.createImageData(canvas.width, canvas.height);
        byteWidth = canvas.width * 4;
        for (y = 1; y < editor.height; ++y) {
            for (x = 0, i = y * editor.codepage.fontHeight * byteWidth; x < canvas.width; ++x, i += 4) {
                imageData.data.set(rgba, i);
            }
        }
        for (x = 1; x < editor.columns; ++x) {
            for (y = 0, i = x * editor.codepage.fontWidth * 4; y < canvas.height; ++y, i += byteWidth) {
                if (x % 40 === 0) {
                    imageData.data.set(highlightedRGBA, i);
                } else if (x % 20 === 0) {
                    imageData.data.set(midToneRGBA, i);
                } else {
                    imageData.data.set(rgba, i);
                }
            }
        }
        ctx.putImageData(imageData, 0, 0);
        return canvas;
    }

    gridMode = 0;
    gridLight = createGrid(new Uint8Array([255, 255, 255, 64]), new Uint8Array([255, 255, 255, 200]), new Uint8Array([255, 255, 255, 100]));
    gridDark = createGrid(new Uint8Array([0, 0, 0, 64]), new Uint8Array([0, 0, 0, 255]), new Uint8Array([0, 0, 0, 180]));

    function init() {
        switch (++gridMode) {
        case 1:
            editor.addOverlay(gridLight, "grid");
            break;
        case 2:
            editor.addOverlay(gridDark, "grid");
            break;
        default:
            editor.removeOverlay("grid");
            gridMode = 0;
        }
        return false;
    }

    function toString() {
        switch (gridMode) {
        case 1:
            return "Grid: Light";
        case 2:
            return "Grid: Dark";
        default:
            return "Grid: Off";
        }
    }

    function isEnabled() {
        return gridMode > 0;
    }

    return {
        "init": init,
        "toString": toString,
        "isEnabled": isEnabled,
        "uid": "grid"
    };
}

AnsiEditController.addTool(gridTool, "tools-right", 103);