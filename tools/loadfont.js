function loadFontTool(editor, toolbar) {
    "use strict";

    function parseImageData(imageData) {
        var fontWidth, fontHeight, i, j, k, pos, value, bytes, x, y;
        fontWidth = imageData.width / 16;
        fontHeight = imageData.height / 16;
        if ((fontWidth === 8) && (imageData.height % 16 === 0) && (fontHeight >= 1 && fontHeight <= 32)) {
            bytes = new Uint8Array(8 * fontHeight * 256 / 8);
            k = 0;
            for (value = 0; value < 256; value += 1) {
                x = (value % 16) * fontWidth;
                y = Math.floor(value / 16) * fontHeight;
                pos = (y * imageData.width + x) * 4;
                i = j = 0;
                while (i < fontWidth * fontHeight) {
                    bytes[k] = bytes[k] << 1;
                    if (imageData.data[pos] > 127) {
                        bytes[k] += 1;
                    }
                    if ((i += 1) % fontWidth === 0) {
                        pos += (imageData.width - 8) * 4;
                    }
                    if (i % 8 === 0) {
                        k += 1;
                    }
                    pos += 4;
                }
            }
            editor.setFont(fontWidth, fontHeight, bytes);
        }
    }

    function init() {
        var modal, divFileZone, paragraphs, fileInputContainer, fileInput;

        divFileZone = ElementHelper.create("div", {"className": "file-zone"});
        paragraphs = [
            ElementHelper.create("p", {"textContent": "Drag and drop an image file here."}),
            ElementHelper.create("p", {"textContent": "The font must be drawn as white text on a black background and aligned to a 16x16 grid with no additional spacing. Each glyph must be 8 pixels wide, and no more than 32 pixels high."})
        ];
        fileInputContainer = ElementHelper.create("div", {"className": "file-input-container"});
        fileInput = ElementHelper.create("input", {"type": "file"});

        function dismiss() {
            toolbar.modalEnd("load-font");
            modal.remove();
            editor.startListening();
            toolbar.startListening();
        }

        function loadFont(file) {
            var reader;
            reader = new FileReader();
            reader.onload = function (data) {
                var img;
                img = new Image();
                img.onload = function () {
                    var canvas, ctx;
                    canvas = ElementHelper.create("canvas", {"width": img.width, "height": img.height});
                    ctx = canvas.getContext("2d");
                    ctx.drawImage(img, 0, 0);
                    parseImageData(ctx.getImageData(0, 0, canvas.width, canvas.height));
                    dismiss();
                };
                img.src = data.target.result;
            };
            reader.readAsDataURL(file);
        }

        divFileZone.addEventListener("dragover", function (evt) {
            evt.stopPropagation();
            evt.preventDefault();
            evt.dataTransfer.dropEffect = "copy";
        }, false);

        divFileZone.addEventListener("drop", function (evt) {
            evt.stopPropagation();
            evt.preventDefault();
            if (evt.dataTransfer.files.length > 0) {
                loadFont(evt.dataTransfer.files[0]);
            }
        }, false);

        fileInput.addEventListener("change", function (evt) {
            if (evt.target.files.length > 0) {
                loadFont(evt.target.files[0]);
            }
        }, false);

        modal = modalBox();
        divFileZone.appendChild(paragraphs[0]);
        divFileZone.appendChild(paragraphs[1]);
        modal.addPanel(divFileZone);
        fileInputContainer.appendChild(fileInput);
        modal.addPanel(fileInputContainer);
        modal.addButton("cancel", {"textContent": "Cancel", "href": "#", "onclick": function (evt) {
            evt.preventDefault();
            dismiss();
        }});

        editor.stopListening();
        toolbar.stopListening();
        modal.init();

        return false;
    }

    function toString() {
        return "Load Font";
    }

    return {
        "init": init,
        "toString": toString,
        "uid": "load-font",
        "isModal": true
    };
}

AnsiEditController.addTool(loadFontTool, "tools-left");