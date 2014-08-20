function showInvisiblesTool(editor) {
    "use strict";
    var columns, rows, invisiblesNull, invisiblesSpace, invisiblesFullBlock, invisiblesNoBreakSpace, invisiblesNullCtx, invisiblesSpaceCtx, invisiblesFullBlockCtx, invisiblesNoBreakSpaceCtx, invisiblesMode, blocks, lastPoint;

    function createBlocks() {
        var i, canvas, ctx, imageData;
        blocks = [];
        for (i = 0; i < 16; i++) {
            canvas = ElementHelper.create("canvas", {"width": editor.codepage.fontWidth, "height": editor.codepage.fontHeight});
            ctx = canvas.getContext("2d");
            imageData = ctx.createImageData(canvas.width, canvas.height);
            imageData.data.set(editor.codepage.fullBlock(i), 0);
            ctx.putImageData(imageData, 0, 0);
            blocks[i] = canvas;
        }
    }

    createBlocks();

    function draw(ctx, block, index) {
        ctx.drawImage(block, (index / 3 % columns) * editor.codepage.fontWidth, Math.floor(index / 3 / columns) * editor.codepage.fontHeight);
    }

    function clear(ctx, index) {
        ctx.clearRect((index / 3 % columns) * editor.codepage.fontWidth, Math.floor(index / 3 / columns) * editor.codepage.fontHeight, editor.codepage.fontWidth, editor.codepage.fontHeight);
    }

    function addOverlay() {

        function redraw() {
            switch (invisiblesMode) {
            case 0:
                return invisiblesNull;
            case 1:
                return invisiblesSpace;
            case 2:
                return invisiblesFullBlock;
            case 3:
                return invisiblesNoBreakSpace;
            default:
            }
        }

        switch (invisiblesMode) {
        case 0:
            editor.addOverlay(invisiblesNull, "invisibles", redraw);
            break;
        case 1:
            editor.addOverlay(invisiblesSpace, "invisibles", redraw);
            break;
        case 2:
            editor.addOverlay(invisiblesFullBlock, "invisibles", redraw);
            break;
        case 3:
            editor.addOverlay(invisiblesNoBreakSpace, "invisibles", redraw);
            break;
        default:
        }
    }

    function readImageData() {
        var imageData, i;
        imageData = editor.getImageData(0, 0, columns, rows);
        for (i = 0; i < imageData.data.length; i += 3) {
            switch (imageData.data[i]) {
            case editor.codepage.NULL:
                draw(invisiblesNullCtx, blocks[12], i);
                break;
            case editor.codepage.SPACE:
                draw(invisiblesSpaceCtx, blocks[10], i);
                break;
            case editor.codepage.FULL_BLOCK:
                draw(invisiblesFullBlockCtx, blocks[9], i);
                break;
            case editor.codepage.NO_BREAK_SPACE:
                draw(invisiblesNoBreakSpaceCtx, blocks[14], i);
                break;
            default:
            }
        }
    }

    function createCanvases() {
        var width, height;
        columns = editor.getColumns();
        rows = editor.getRows();
        width = columns * editor.codepage.fontWidth;
        height = rows * editor.codepage.fontHeight;
        invisiblesNull = ElementHelper.create("canvas", {"width": width, "height": height, "style": {"backgroundColor": "rgba(0, 0, 0, 0.7)"}});
        invisiblesSpace = ElementHelper.create("canvas", {"width": width, "height": height, "style": {"backgroundColor": "rgba(0, 0, 0, 0.7)"}});
        invisiblesFullBlock = ElementHelper.create("canvas", {"width": width, "height": height, "style": {"backgroundColor": "rgba(0, 0, 0, 0.7)"}});
        invisiblesNoBreakSpace = ElementHelper.create("canvas", {"width": width, "height": height, "style": {"backgroundColor": "rgba(0, 0, 0, 0.7)"}});
        invisiblesNullCtx = invisiblesNull.getContext("2d");
        invisiblesSpaceCtx = invisiblesSpace.getContext("2d");
        invisiblesFullBlockCtx = invisiblesFullBlock.getContext("2d");
        invisiblesNoBreakSpaceCtx = invisiblesNoBreakSpace.getContext("2d");
        readImageData();
    }

    invisiblesMode = 0;

    createCanvases();

    function update(charCode, oldCharCode, index) {
        if (charCode !== oldCharCode) {
            switch (oldCharCode) {
            case editor.codepage.NULL:
                clear(invisiblesNullCtx, index);
                break;
            case editor.codepage.SPACE:
                clear(invisiblesSpaceCtx, index);
                break;
            case editor.codepage.FULL_BLOCK:
                clear(invisiblesFullBlockCtx, index);
                break;
            case editor.codepage.NO_BREAK_SPACE:
                clear(invisiblesNoBreakSpaceCtx, index);
                break;
            case undefined:
                clear(invisiblesNullCtx, index);
                clear(invisiblesSpaceCtx, index);
                clear(invisiblesFullBlockCtx, index);
                clear(invisiblesNoBreakSpaceCtx, index);
                break;
            default:
            }
            switch (charCode) {
            case editor.codepage.NULL:
                draw(invisiblesNullCtx, blocks[12], index);
                break;
            case editor.codepage.SPACE:
                draw(invisiblesSpaceCtx, blocks[10], index);
                break;
            case editor.codepage.FULL_BLOCK:
                draw(invisiblesFullBlockCtx, blocks[9], index);
                break;
            case editor.codepage.NO_BREAK_SPACE:
                draw(invisiblesNoBreakSpaceCtx, blocks[14], index);
                break;
            default:
            }
        }
    }

    function invisiblesBrush(block) {
        var color;
        color = (block.charCode === editor.codepage.FULL_BLOCK) ? block.foreground : block.background;
        if (!editor.getBlinkStatus() && (color >= 8) && (invisiblesMode !== 3)) {
            color -= 8;
        }
        switch (invisiblesMode) {
        case 0:
            editor.setTextBlock(block, editor.codepage.NULL, color, color);
            update(editor.codepage.NULL, block.charCode, block.index);
            break;
        case 1:
            editor.setTextBlock(block, editor.codepage.SPACE, color, color);
            update(editor.codepage.SPACE, block.charCode, block.index);
            break;
        case 2:
            editor.setTextBlock(block, editor.codepage.FULL_BLOCK, color, color);
            update(editor.codepage.FULL_BLOCK, block.charCode, block.index);
            break;
        case 3:
            editor.setTextBlock(block, editor.codepage.NO_BREAK_SPACE, color, color);
            update(editor.codepage.NO_BREAK_SPACE, block.charCode, block.index);
            break;
        default:
        }
    }

    function canvasDown(coord) {
        editor.startOfDrawing();
        if (coord.shiftKey && lastPoint) {
            editor.blockLine(lastPoint, coord, invisiblesBrush);
        } else {
            invisiblesBrush(coord);
        }
        lastPoint = coord;
    }

    function canvasDrag(coord) {
        if (lastPoint) {
            editor.blockLine(lastPoint, coord, invisiblesBrush);
            lastPoint = coord;
        }
    }

    editor.addSetImageListener(createCanvases);
    editor.addImageClearListener(function () {
        invisiblesNullCtx.clearRect(0, 0, invisiblesNull.width, invisiblesNull.height);
        invisiblesSpaceCtx.clearRect(0, 0, invisiblesSpace.width, invisiblesSpace.height);
        invisiblesFullBlockCtx.clearRect(0, 0, invisiblesFullBlock.width, invisiblesFullBlock.height);
        invisiblesNoBreakSpaceCtx.clearRect(0, 0, invisiblesNoBreakSpace.width, invisiblesNoBreakSpace.height);
        
        readImageData();
    });
    editor.addCanvasDrawListener(function (blocks) {
        var i;
        for (i = 0; i < blocks.length; i++) {
            update(blocks[i][0], undefined, blocks[i][3]);
        }
    });

    function init() {
        editor.addMouseDownListener(canvasDown);
        editor.addMouseDragListener(canvasDrag);
        editor.addMouseUpListener(editor.endOfDrawing);
        editor.addMouseOutListener(editor.endOfDrawing);
        addOverlay();
        return true;
    }

    function remove() {
        editor.removeMouseDownListener(canvasDown);
        editor.removeMouseDragListener(canvasDrag);
        editor.removeMouseUpListener(editor.endOfDrawing);
        editor.removeMouseOutListener(editor.endOfDrawing);
        editor.removeOverlay("invisibles");
    }

    function modeChange(shiftKey) {
        editor.removeOverlay("invisibles");
        if (!shiftKey) {
            if (++invisiblesMode === 4) {
                invisiblesMode = 0;
            }
        } else {
            if (--invisiblesMode < 0) {
                invisiblesMode = 3;
            }
        }
        addOverlay();
    }

    function toString() {
        switch (invisiblesMode) {
        case 0:
            return "Show: Null";
        case 1:
            return "Show: Space";
        case 2:
            return "Show: Full Block";
        case 3:
            return "Show: No-Break Space";
        }
    }

    return {
        "init": init,
        "remove": remove,
        "modeShiftKey": true,
        "modeChange": modeChange,
        "toString": toString,
        "uid": "showinvisibles"
    };
}

AnsiEditController.addTool(showInvisiblesTool, "tools-right", 121);