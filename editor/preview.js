function previewCanvas(divPreview, divEditor, codepage, retina) {
    "use strict";
    var canvas, ctx, imageData, mouseButton, scaleFactor;

    function draw(charCode, x, y, fg, bg) {
        imageData.data.set(codepage.smallFont(charCode, fg, bg), 0);
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
        var width, height;
        width = (retina ? 4 : 2) * columns;
        height = (retina ? 8 : 4) * rows;
        canvas = ElementHelper.create("canvas", {"width": width, "height": height, "style": {"width": (width < 160) ? (width + "px") : "160px", "height": (width < 160) ? height : (160 / width * height) + "px", "verticalAlign": "bottom", "cursor": "move"}});
        scaleFactor = columns * 8 / ((width < 160) ? width : 160);
        ctx = canvas.getContext("2d");
        imageData = ctx.createImageData(retina ? 4 : 2, retina ? 8 : 4);
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
        for (y = 0, i = 0; y < rows; y++) {
            for (x = 0; x < columns; x++, i += 3) {
                imageData.data.set(codepage.smallFont(image[i], image[i + 1], image[i + 2]), 0);
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