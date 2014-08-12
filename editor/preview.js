function previewCanvas(divPreview, divEditor) {
    "use strict";
    var canvas, ctx, imageData, codepage, mouseButton, scaleFactor;

    function draw(charCode, x, y, fg, bg) {
        imageData.data.set(codepage.smallFont(charCode, fg, bg), 0);
        ctx.putImageData(imageData, x * imageData.width, y * imageData.height);
    }

    function updateScroller(yPos) {
        yPos = Math.floor(yPos * scaleFactor - window.innerHeight / 2);
        divEditor.scrollTop = yPos;
    }

    function mousedown(evt) {
        evt.preventDefault();
        mouseButton = true;
        updateScroller(evt.clientY);
    }

    function mouseup(evt) {
        evt.preventDefault();
        mouseButton = false;
    }

    function mousemove(evt) {
        evt.preventDefault();
        if (mouseButton) {
            updateScroller(evt.layerY);
        }
    }

    function startListening() {
        canvas.addEventListener("mousedown", mousedown, false);
        canvas.addEventListener("mousemove", mousemove, false);
        canvas.addEventListener("mouseup", mouseup, false);
    }

    function stopListening() {
        canvas.removeEventListener("mousedown", mousedown);
        canvas.removeEventListener("mousemove", mousemove);
        canvas.removeEventListener("mouseup", mouseup);
    }

    function init(columns, rows, retina, codepageObj) {
        var width, height;
        width = (retina ? 4 : 2) * columns;
        height = (retina ? 8 : 4) * rows;
        canvas = ElementHelper.create("canvas", {"width": width, "height": height, "style": {"width": "160px", "height": 160 / width * height + "px", "verticalAlign": "bottom"}});
        scaleFactor = rows * 8 / 160;
        ctx = canvas.getContext("2d");
        imageData = ctx.createImageData(retina ? 4 : 2, retina ? 8 : 4);
        codepage = codepageObj;
        startListening();
        divPreview.appendChild(canvas);
    }

    return {
        "init": init,
        "draw": draw,
        "startListening": startListening,
        "stopListening": stopListening
    };
}