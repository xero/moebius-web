function previewCanvas(divPreview, divEditor, codepage) {
    "use strict";
    var canvas, ctx, imageData, mouseButton, scaleFactor;

    function draw(charCode, x, y, fg, bg) {
        imageData.data.set(codepage.fontData(charCode, fg, bg), 0);
        ctx.putImageData(imageData, x * imageData.width, y * imageData.height);
    }

    function updateScroller(xPos, yPos) {
        xPos = Math.floor(xPos * scaleFactor - (window.innerWidth - 303) / 2);
        yPos = Math.floor(yPos * scaleFactor - (window.innerHeight - 30) / 2);
        divEditor.scrollLeft = xPos;
        divEditor.scrollTop = yPos;
    }

    function processMouse(evt) {
        var pos;
        pos = evt.currentTarget.getBoundingClientRect();
        updateScroller(evt.clientX - pos.left, evt.clientY - pos.top);
    }

    function mousedown(evt) {
        evt.preventDefault();
        mouseButton = true;
        processMouse(evt);
    }

    function mouseup(evt) {
        evt.preventDefault();
        mouseButton = false;
    }

    function mousemove(evt) {
        evt.preventDefault();
        if (mouseButton) {
            processMouse(evt);
        }
    }

    function createCanvas(columns, rows) {
        var fontWidth, fontHeight, width, height;
        fontWidth = codepage.getFontWidth();
        fontHeight = codepage.getFontHeight();
        width = columns * fontWidth;
        height = rows * fontHeight;
        canvas = ElementHelper.create("canvas", {"width": width, "height": height, "style": {"verticalAlign": "bottom", "cursor": "move"}});
        if (width < 160) {
            scaleFactor = 1;
        } else {
            scaleFactor = 160 / width;
            canvas.style.width = "160px";
            canvas.style.height = (height * scaleFactor) + "px";
        }
        ctx = canvas.getContext("2d");
        imageData = ctx.createImageData(fontWidth, fontHeight);
        canvas.addEventListener("mousedown", mousedown, false);
        canvas.addEventListener("mousemove", mousemove, false);
        canvas.addEventListener("mouseup", mouseup, false);
    }

    function init(columns, rows) {
        createCanvas(columns, rows);
        divPreview.appendChild(canvas);
    }

    function redraw(columns, rows, image) {
        var x, y, i;
        for (y = 0, i = 0; y < rows; y += 1) {
            for (x = 0; x < columns; x += 1, i += 3) {
                imageData.data.set(codepage.fontData(image[i], image[i + 1], image[i + 2]), 0);
                ctx.putImageData(imageData, x * imageData.width, y * imageData.height);
            }
        }
    }

    function resize(columns, rows, image) {
        canvas.removeEventListener("mousedown", mousedown);
        canvas.removeEventListener("mousemove", mousemove);
        canvas.removeEventListener("mouseup", mouseup);
        divPreview.removeChild(canvas);
        createCanvas(columns, rows);
        redraw(columns, rows, image);
        divPreview.appendChild(canvas);
    }

    return {
        "init": init,
        "resize": resize,
        "redraw": redraw,
        "draw": draw
    };
}