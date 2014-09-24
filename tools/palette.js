function paletteTool(editor, toolbar) {
    "use strict";
    var toolCanvas, quickAccess, oldColor, currentColor;

    function mousedown(evt) {
        var pos, color;
        pos = evt.currentTarget.getBoundingClientRect();
        color = ((1 - Math.floor((evt.clientY - pos.top - 40) / 20))) * 8 + Math.floor((evt.clientX - pos.left) / 20);
        if (color >= 0 && color <= 15) {
            editor.setCurrentColor(color);
        }
    }

    function mousemove(evt) {
        var mouseButton;
        evt.preventDefault();
        mouseButton = (evt.buttons !== undefined) ? evt.buttons : evt.which;
        if (mouseButton) {
            mousedown(evt);
        }
    }

    function createCanvas() {
        var canvas, ctx, i;
        canvas = ElementHelper.create("canvas", {"width": 160, "height": 80, "style": {"cursor": "crosshair"}});
        ctx = canvas.getContext("2d");
        for (i = 0; i < 16; i += 1) {
            ctx.fillStyle = editor.codepage.styleRGBA(i, 1);
            ctx.fillRect(
                (i % 8) * canvas.width / 8,
                (i < 8) ? 60 : 40,
                canvas.width / 8,
                canvas.height / 4
            );
        }
        canvas.addEventListener("mousedown", mousedown, false);
        canvas.addEventListener("mousemove", mousemove, false);
        return canvas;
    }

    function redrawCurrentColor(canvas) {
        var ctx;
        ctx = canvas.getContext("2d");
        ctx.fillStyle = editor.codepage.styleRGBA(currentColor, 1);
        ctx.fillRect(0, 0, canvas.width, 40);
    }

    function colorChange(color) {
        oldColor = currentColor;
        currentColor = color;
        redrawCurrentColor(toolCanvas);
        redrawCurrentColor(quickAccess);
    }

    function paletteChange() {
        toolCanvas = createCanvas();
        quickAccess = createCanvas();
        toolbar.replaceCanvas("palette", toolCanvas);
        toolbar.replaceQuickAccess("palette", quickAccess);
        redrawCurrentColor(toolCanvas);
        redrawCurrentColor(quickAccess);
    }

    oldColor = 0;
    toolCanvas = createCanvas();
    quickAccess = createCanvas();
    editor.addColorChangeListener(colorChange);
    editor.addPaletteChangeListener(paletteChange);

    function init() {
        return false;
    }

    function onload() {
        currentColor = editor.getCurrentColor();
        redrawCurrentColor(toolCanvas);
        redrawCurrentColor(quickAccess);
    }

    function toString() {
        return "Palette";
    }

    function setColor(color, shiftKey) {
        if (shiftKey || color === currentColor) {
            color += 8;
        }
        editor.setCurrentColor(color);
    }

    function swapColors() {
        editor.setCurrentColor(oldColor);
    }

    function setColor1(shiftKey) {
        setColor(0, shiftKey);
    }

    function setColor2(shiftKey) {
        setColor(1, shiftKey);
    }

    function setColor3(shiftKey) {
        setColor(2, shiftKey);
    }

    function setColor4(shiftKey) {
        setColor(3, shiftKey);
    }

    function setColor5(shiftKey) {
        setColor(4, shiftKey);
    }

    function setColor6(shiftKey) {
        setColor(5, shiftKey);
    }

    function setColor7(shiftKey) {
        setColor(6, shiftKey);
    }

    function setColor8(shiftKey) {
        setColor(7, shiftKey);
    }

    return {
        "init": init,
        "toString": toString,
        "uid": "palette",
        "canvas": toolCanvas,
        "quickAccess": quickAccess,
        "hideText": true,
        "swapColors": swapColors,
        "setColor1": setColor1,
        "setColor2": setColor2,
        "setColor3": setColor3,
        "setColor4": setColor4,
        "setColor5": setColor5,
        "setColor6": setColor6,
        "setColor7": setColor7,
        "setColor8": setColor8,
        "onload": onload
    };
}

AnsiEditController.addTool(paletteTool, "tools-left", undefined, {"swapColors": 9, "setColor1": 49, "setColor2": 50, "setColor3": 51, "setColor4": 52, "setColor5": 53, "setColor6": 54, "setColor7": 55, "setColor8": 56});