function previewTool(editor, toolbar) {
    "use strict";
    var canvas, ctx, imageData, columns, rows, fontWidth, fontHeight, scaleFactor;

    function redraw() {
        var image, x, y, i;
        image = editor.getImageData(0, 0, columns, rows);
        for (y = 0, i = 0; y < rows; y += 1) {
            for (x = 0; x < columns; x += 1, i += 3) {
                imageData.data.set(editor.codepage.fontData(image.data[i], image.data[i + 1], image.data[i + 2]), 0);
                ctx.putImageData(imageData, x * imageData.width, y * imageData.height);
            }
        }
    }

    function update(block) {
        imageData.data.set(editor.codepage.fontData(block[0], block[1], block[2]), 0);
        ctx.putImageData(imageData, (block[3] / 3 % columns) * fontWidth, Math.floor(block[3] / 3 / columns) * fontHeight);
    }

    function mousedown(evt) {
        var pos, xPos, yPos;
        evt.preventDefault();
        pos = evt.currentTarget.getBoundingClientRect();
        xPos = (evt.clientX - pos.left) * scaleFactor;
        yPos = (evt.clientY - pos.top) * scaleFactor;
        editor.centerOn(xPos, yPos);
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
        fontWidth = editor.codepage.getFontWidth();
        fontHeight = editor.codepage.getFontHeight();
        columns = editor.getColumns();
        rows = editor.getRows();
        canvas = ElementHelper.create("canvas", {"width": columns * fontWidth, "height": rows * fontHeight, "style": {"verticalAlign": "bottom", "cursor": "move"}});
        if (canvas.width < 160) {
            scaleFactor = 1;
        } else {
            scaleFactor = canvas.width / 160;
            canvas.style.width = "160px";
            canvas.style.height = (160 / canvas.width * canvas.height) + "px";
        }
        ctx = canvas.getContext("2d");
        imageData = ctx.createImageData(fontWidth, fontHeight);
        canvas.addEventListener("mousedown", mousedown, false);
        canvas.addEventListener("mousemove", mousemove, false);
    }

    function rehashTool() {
        createCanvas();
        toolbar.replaceCanvas("preview", canvas);
    }

    createCanvas();

    editor.addCanvasDrawListener(update);
    editor.addOverlayChangeListener(rehashTool);

    function init() {
        return false;
    }

    function toString() {
        return "Preview";
    }

    function onload() {
        redraw();
    }

    return {
        "init": init,
        "toString": toString,
        "uid": "preview",
        "hideText": true,
        "canvas": canvas,
        "onload": onload
    };
}

AnsiEditController.addTool(previewTool, "preview", undefined);