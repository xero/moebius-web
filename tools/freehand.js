function freehandTool(editor, toolbar) {
    "use strict";
    var currentColor, lastPoint, quickAccess;

    function quickAccessSelection(evt) {
        var pos, col;
        pos = evt.currentTarget.getBoundingClientRect();
        col = ((1 - Math.floor((evt.clientY - pos.top) / 20))) * 8 + Math.floor((evt.clientX - pos.left) / 20);
        editor.setCurrentColor(col);
        toolbar.giveFocus("freehand");
    }

    function createPalette() {
        var ctx, i;
        quickAccess = ElementHelper.create("canvas", {"width": 160, "height": 40, "style": {"cursor": "crosshair"}});
        ctx = quickAccess.getContext("2d");
        for (i = 0; i < 16; i += 1) {
            ctx.fillStyle = editor.getRGBAColorFor(i, 1);
            ctx.fillRect(
                (i % 8) * quickAccess.width / 8,
                (i < 8) ? quickAccess.height / 2 : 0,
                quickAccess.width / 8,
                quickAccess.height / 2
            );
        }
        quickAccess.addEventListener("mousedown", quickAccessSelection, false);
        quickAccess.addEventListener("mousemove", function (evt) {
            var mouseButton;
            mouseButton = (evt.buttons !== undefined) ? evt.buttons : evt.which;
            if (mouseButton) {
                quickAccessSelection(evt);
            }
        }, false);
    }

    function colorChange(col) {
        currentColor = col;
    }

    function freehand(block, currentColorBias) {
        editor.setBlock(block, currentColor, currentColorBias, currentColor);
    }

    function blockLine(from, to, currentColorBias) {
        editor.blockLine(from, to, function (block, setBlockLineBlock) {
            setBlockLineBlock(block, currentColor);
        }, currentColorBias, currentColor);
    }

    function sampleBlock(block) {
        if (block.isBlocky) {
            if (block.isUpperHalf) {
                editor.setCurrentColor(block.upperBlockColor);
            } else {
                editor.setCurrentColor(block.lowerBlockColor);
            }
            return true;
        }
        return false;
    }

    function canvasDown(coord) {
        if (coord.ctrlKey) {
            toolbar.sampleBlock(coord);
        } else {
            if (coord.shiftKey && lastPoint) {
                editor.startOfChunk();
                blockLine(lastPoint, coord, !coord.altKey);
                editor.endOfChunk();
            } else {
                editor.startOfFreehand();
                freehand(coord, !coord.altKey);
            }
            lastPoint = coord;
        }
    }

    function canvasDrag(coord) {
        blockLine(lastPoint, coord, !coord.altKey);
        lastPoint = coord;
    }

    function rehashTool() {
        createPalette();
        toolbar.replaceQuickAccess("freehand", quickAccess);
    }

    createPalette();
    editor.addPaletteChangeListener(rehashTool);

    function init() {
        editor.addMouseDownListener(canvasDown);
        editor.addMouseDragListener(canvasDrag);
        editor.addColorChangeListener(colorChange);
        currentColor = editor.getCurrentColor();
        return true;
    }

    function remove() {
        editor.removeMouseDownListener(canvasDown);
        editor.removeMouseDragListener(canvasDrag);
        editor.removeColorChangeListener(colorChange);
    }

    function toString() {
        return "Freehand";
    }

    return {
        "init": init,
        "remove": remove,
        "toString": toString,
        "uid": "freehand",
        "quickAccess": quickAccess,
        "sampleBlock": sampleBlock,
        "autoselect": true
    };
}

AnsiEditController.addTool(freehandTool, "tools-right", 102);