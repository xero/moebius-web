function gridTool(toolbar) {
    "use strict";
    var gridLight, gridDark, gridMode;

    function createGrid(rgba, highlightedRGBA, midToneRGBA) {
        var canvas, ctx, imageData, byteWidth, y, x, i;
        canvas = ElementHelper.create("canvas", {"width": 80 * (toolbar.retina ? 16 : 8), "height": toolbar.editor.height * (toolbar.retina ? 32 : 16), "style": {"width": "640px", "height": (toolbar.editor.height * 16) + "px"}});
        ctx = canvas.getContext("2d");
        imageData = ctx.createImageData(canvas.width, canvas.height);
        byteWidth = canvas.width * 4;
        for (y = 1; y < toolbar.editor.height; ++y) {
            for (x = 0, i = y * toolbar.codepage.fontHeight * byteWidth; x < canvas.width; ++x, i += 4) {
                imageData.data.set(rgba, i);
            }
        }
        for (x = 1; x < 80; ++x) {
            for (y = 0, i = x * toolbar.codepage.fontWidth * 4; y < canvas.height; ++y, i += byteWidth) {
                switch (x) {
                case 40:
                    imageData.data.set(highlightedRGBA, i);
                    break;
                case 20:
                    imageData.data.set(midToneRGBA, i);
                    break;
                case 60:
                    imageData.data.set(midToneRGBA, i);
                    break;
                default:
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
            toolbar.editor.addOverlay(gridLight, "grid");
            break;
        case 2:
            toolbar.editor.addOverlay(gridDark, "grid");
            break;
        default:
            toolbar.editor.removeOverlay("grid");
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

AnsiEditController.addTool(gridTool, 103);