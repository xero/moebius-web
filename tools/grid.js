function gridTool(editor) {
    "use strict";
    var gridLight, gridDark, gridMode;

    function createGrid(rgba, highlightedRGBA, midToneRGBA) {
        var columns, rows, fontWidth, fontHeight, canvas, ctx, imageData, byteWidth, y, x, i;
        columns = editor.getColumns();
        rows = editor.getRows();
        fontWidth = editor.codepage.getFontWidth();
        fontHeight = editor.codepage.getFontHeight();
        canvas = ElementHelper.create("canvas", {"width": columns * fontWidth, "height": rows * fontHeight});
        ctx = canvas.getContext("2d");
        imageData = ctx.createImageData(canvas.width, canvas.height);
        byteWidth = canvas.width * 4;
        for (y = 1; y < rows; y += 1) {
            for (x = 0, i = y * fontHeight * byteWidth; x < canvas.width; x += 1, i += 4) {
                imageData.data.set(rgba, i);
            }
        }
        for (x = 1; x < columns; x += 1) {
            for (y = 0, i = x * fontWidth * 4; y < canvas.height; y += 1, i += byteWidth) {
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

    function createGrids() {
        gridLight = createGrid(new Uint8Array([255, 255, 255, 64]), new Uint8Array([255, 255, 255, 200]), new Uint8Array([255, 255, 255, 100]));
        gridDark = createGrid(new Uint8Array([0, 0, 0, 64]), new Uint8Array([0, 0, 0, 255]), new Uint8Array([0, 0, 0, 180]));
    }

    function redraw() {
        switch (gridMode) {
        case 1:
            return gridLight;
        case 2:
            return gridDark;
        default:
            return undefined;
        }
    }

    function reapplyGrid() {
        switch (gridMode) {
        case 1:
            editor.addOverlay(gridLight, "grid", redraw, 3);
            break;
        case 2:
            editor.addOverlay(gridDark, "grid", redraw, 3);
            break;
        default:
            editor.removeOverlay("grid");
            break;
        }
    }

    createGrids();

    editor.addOverlayChangeListener(createGrids);

    function init() {
        gridMode = (gridMode === 2) ? 0 : gridMode + 1;
        reapplyGrid();
        return false;
    }

    function shiftKey() {
        gridMode = (gridMode === 0) ? 2 : gridMode - 1;
        reapplyGrid();
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

    function getState() {
        return [gridMode];
    }

    function setState(bytes) {
        if (gridMode !== bytes[0]) {
            gridMode = bytes[0];
            reapplyGrid();
        }
    }

    function isEnabled() {
        return gridMode > 0;
    }

    return {
        "init": init,
        "shiftKey": shiftKey,
        "toString": toString,
        "isEnabled": isEnabled,
        "getState": getState,
        "setState": setState,
        "uid": "grid"
    };
}

AnsiEditController.addTool(gridTool, "tools-right", 103);