function previewCanvas(divPreview) {
    "use strict";
    var canvas, ctx, imageData, codepage;

    function draw(charCode, x, y, fg, bg) {
        imageData.data.set(codepage.smallFont(charCode, fg, bg), 0);
        ctx.putImageData(imageData, x * imageData.width, y * imageData.height);
    }

    function handleEvent(evt) {
        var mouseButton, y;
        mouseButton = (evt.buttons !== undefined) ? evt.buttons : evt.which;
        if (mouseButton) {
            evt.preventDefault();
            y = evt.clientY * 4 - window.innerHeight / 2;
            document.documentElement.scrollTop = y;
            document.body.scrollTop = y;
        }
    }

    function startListening() {
        canvas.addEventListener("mousedown", handleEvent, false);
        canvas.addEventListener("mousemove", handleEvent, false);
    }

    function stopListening() {
        canvas.removeEventListener("mousedown", handleEvent);
        canvas.removeEventListener("mousemove", handleEvent);
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