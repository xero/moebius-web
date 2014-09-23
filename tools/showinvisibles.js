function showInvisiblesTool(editor, toolbar) {
    "use strict";
    var RGBA_PALETTE, columns, rows, invisiblesNull, invisiblesSpace, invisiblesFullBlock, invisiblesNoBreakSpace, invisiblesNullCtx, invisiblesSpaceCtx, invisiblesFullBlockCtx, invisiblesNoBreakSpaceCtx, invisiblesMode, blocks, lastPoint;

    RGBA_PALETTE = [new Uint8Array([0, 0, 0, 255]), new Uint8Array([0, 0, 170, 255]), new Uint8Array([0, 170, 0, 255]), new Uint8Array([0, 170, 170, 255]), new Uint8Array([170, 0, 0, 255]), new Uint8Array([170, 0, 170, 255]), new Uint8Array([170, 85, 0, 255]), new Uint8Array([170, 170, 170, 255]), new Uint8Array([85, 85, 85, 255]), new Uint8Array([85, 85, 255, 255]), new Uint8Array([85, 255, 85, 255]), new Uint8Array([85, 255, 255, 255]), new Uint8Array([255, 85, 85, 255]), new Uint8Array([255, 85, 255, 255]), new Uint8Array([255, 255, 85, 255]), new Uint8Array([255, 255, 255, 255])];

    function createBlocks() {
        var i, canvas, ctx, imageData;
        blocks = [];
        for (i = 0; i < 16; i += 1) {
            canvas = ElementHelper.create("canvas", {"width": editor.codepage.getFontWidth(), "height": editor.codepage.getFontHeight()});
            ctx = canvas.getContext("2d");
            imageData = ctx.createImageData(canvas.width, canvas.height);
            imageData.data.set(editor.codepage.fontDataRGBA(editor.codepage.FULL_BLOCK, RGBA_PALETTE[i], RGBA_PALETTE[i]), 0);
            ctx.putImageData(imageData, 0, 0);
            blocks[i] = canvas;
        }
    }

    function draw(ctx, block, index) {
        ctx.drawImage(block, (index / 3 % columns) * editor.codepage.getFontWidth(), Math.floor(index / 3 / columns) * editor.codepage.getFontHeight());
    }

    function clear(ctx, index) {
        var fontWidth, fontHeight;
        fontWidth = editor.codepage.getFontWidth();
        fontHeight = editor.codepage.getFontHeight();
        ctx.clearRect((index / 3 % columns) * fontWidth, Math.floor(index / 3 / columns) * fontHeight, fontWidth, fontHeight);
    }

    function createCanvases() {
        var width, height;
        columns = editor.getColumns();
        rows = editor.getRows();
        width = columns * editor.codepage.getFontWidth();
        height = rows * editor.codepage.getFontHeight();
        invisiblesNull = ElementHelper.create("canvas", {"width": width, "height": height, "style": {"backgroundColor": "rgba(0, 0, 0, 0.7)"}});
        invisiblesSpace = ElementHelper.create("canvas", {"width": width, "height": height, "style": {"backgroundColor": "rgba(0, 0, 0, 0.7)"}});
        invisiblesFullBlock = ElementHelper.create("canvas", {"width": width, "height": height, "style": {"backgroundColor": "rgba(0, 0, 0, 0.7)"}});
        invisiblesNoBreakSpace = ElementHelper.create("canvas", {"width": width, "height": height, "style": {"backgroundColor": "rgba(0, 0, 0, 0.7)"}});
        invisiblesNullCtx = invisiblesNull.getContext("2d");
        invisiblesSpaceCtx = invisiblesSpace.getContext("2d");
        invisiblesFullBlockCtx = invisiblesFullBlock.getContext("2d");
        invisiblesNoBreakSpaceCtx = invisiblesNoBreakSpace.getContext("2d");
    }

    function addOverlays() {

        function redraw() {

            createCanvases();
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
            editor.addOverlay(invisiblesNull, "show-invisibles", redraw, 1);
            break;
        case 1:
            editor.addOverlay(invisiblesSpace, "show-invisibles", redraw, 1);
            break;
        case 2:
            editor.addOverlay(invisiblesFullBlock, "show-invisibles", redraw, 1);
            break;
        case 3:
            editor.addOverlay(invisiblesNoBreakSpace, "show-invisibles", redraw, 1);
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

    invisiblesMode = 0;

    createBlocks();
    createCanvases();
    readImageData();

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
        if (coord.ctrlKey) {
            toolbar.sampleBlock(coord);
        } else if (coord.shiftKey && lastPoint) {
            editor.startOfChunk();
            editor.blockLine(lastPoint, coord, invisiblesBrush);
            editor.endOfChunk();
        } else {
            editor.startOfFreehand();
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

    function fontChange() {
        createBlocks();
    }

    editor.addFontChangeListener(fontChange);
    editor.addOverlayChangeListener(createCanvases);
    editor.addCanvasDrawListener(function (block) {
        update(block[0], undefined, block[3]);
    });

    function init() {
        editor.addMouseDownListener(canvasDown);
        editor.addMouseDragListener(canvasDrag);
        addOverlays();
        return true;
    }

    function remove() {
        editor.removeMouseDownListener(canvasDown);
        editor.removeMouseDragListener(canvasDrag);
        editor.removeOverlay("show-invisibles");
    }

    function getState() {
        return [invisiblesMode];
    }

    function setState(bytes) {
        invisiblesMode = bytes[0];
        if (editor.isOverlayVisible("show-invisibles")) {
            addOverlays();
        }
    }

    function modeChange(shiftKey) {
        editor.removeOverlay("show-invisibles");
        if (!shiftKey) {
            invisiblesMode += 1;
            if (invisiblesMode === 4) {
                invisiblesMode = 0;
            }
        } else {
            invisiblesMode -= 1;
            if (invisiblesMode < 0) {
                invisiblesMode = 3;
            }
        }
        addOverlays();
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
        "getState": getState,
        "setState": setState,
        "modeShiftKey": true,
        "modeChange": modeChange,
        "toString": toString,
        "uid": "show-invisibles"
    };
}

AnsiEditController.addTool(showInvisiblesTool, "tools-right", 121);