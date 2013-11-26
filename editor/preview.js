function previewCanvas(divPreview) {
    "use strict";
    var canvas, ctx, imageData, codepage, mouseButton;

    function draw(charCode, x, y, fg, bg) {
        imageData.data.set(codepage.smallFont(charCode, fg, bg), 0);
        ctx.putImageData(imageData, x * imageData.width, y * imageData.height);
    }

    function updateScroller(yPos) {
        yPos = yPos * 4 - window.innerHeight / 2;
        document.documentElement.scrollTop = yPos;
        document.body.scrollTop = yPos;
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
            updateScroller(evt.clientY);
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

    function init(height, retina, codepageObj) {
        canvas = ElementHelper.create("canvas", {"width": retina ? 320 : 160, "height": retina ? height * 8 : height * 4, "style": {"width": "160px", "height": (height * 4) + "px", "verticalAlign": "bottom"}});
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