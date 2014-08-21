function loadReferenceTool(editor, toolbar) {
    "use strict";

    function init() {
        var modal, divFileZone, paragraph;

        divFileZone = ElementHelper.create("div", {"className": "file-zone"});
        paragraph = ElementHelper.create("p", {"textContent": "Drag and drop an image here."});

        function dismiss() {
            modal.remove();
            editor.startListening();
            toolbar.startListening();
        }

        divFileZone.addEventListener("dragover", function (evt) {
            evt.stopPropagation();
            evt.preventDefault();
            evt.dataTransfer.dropEffect = "copy";
        }, false);

        divFileZone.addEventListener("drop", function (evt) {
            var reader;
            evt.stopPropagation();
            evt.preventDefault();
            if (evt.dataTransfer.files.length) {
                reader = new FileReader();
                reader.onload = function (data) {
                    editor.fireCustomEvent("reference", data.target.result);
                };
                reader.readAsDataURL(evt.dataTransfer.files[0]);
                dismiss();
            }
        }, false);

        modal = modalBox();
        divFileZone.appendChild(paragraph);
        modal.addPanel(divFileZone);
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
        return "Load Reference Image";
    }

    return {
        "init": init,
        "toString": toString,
        "uid": "loadreference"
    };
}

function referenceTool(editor, toolbar) {
    "use strict";
    var canvas, referenceMode, dataUrl;

    referenceMode = 0;

    function getOpacity() {
        switch (referenceMode) {
        case 1:
            return "0.25";
        case 2:
            return "0.50";
        case 3:
            return "0.75";
        default:
            return "1.0";
        }
    }

    function createCanvas() {
        canvas = ElementHelper.create("canvas", {"width": editor.getColumns() * editor.codepage.fontWidth, "height": editor.getRows() * editor.codepage.fontHeight, "style": {"backgroundPosition": "top left", "backgroundRepeat": "no-repeat", "width": "100%", "backgroundSize": "contain"}});
        if (dataUrl !== undefined) {
            canvas.style.backgroundImage = "url(" + dataUrl + ")";
            canvas.style.opacity = getOpacity();
        }
    }

    editor.addCustomEventListener("reference", function (newDataUrl) {
        dataUrl = newDataUrl;
        canvas.style.backgroundImage = "url(" + dataUrl + ")";
        if (referenceMode === 0) {
            toolbar.giveFocus("reference");
        }
    }, false);

    createCanvas();

    editor.addSetImageListener(createCanvas);

    function init() {
        switch (++referenceMode) {
        case 1:
            canvas.style.opacity = getOpacity();
            editor.addOverlay(canvas, "reference", function () {
                return canvas;
            }, 2);
            break;
        case 2:
            canvas.style.opacity = getOpacity();
            break;
        case 3:
            canvas.style.opacity = getOpacity();
            break;
        default:
            editor.removeOverlay("reference");
            referenceMode = 0;
        }
        return false;
    }

    function shiftKey() {
        switch (--referenceMode) {
        case 0:
            editor.removeOverlay("reference");
            break;
        case 1:
            canvas.style.opacity = getOpacity();
            break;
        case 2:
            canvas.style.opacity = getOpacity();
            break;
        default:
            editor.addOverlay(canvas, "reference", function () {
                return canvas;
            }, 2);
            referenceMode = 3;
            canvas.style.opacity = getOpacity();
        }
        return false;
    }

    function toString() {
        switch (referenceMode) {
        case 1:
            return "Reference: 25%";
        case 2:
            return "Reference: 50%";
        case 3:
            return "Reference: 75%";
        default:
            return "Reference: off";
        }
    }

    function isEnabled() {
        return referenceMode > 0;
    }

    return {
        "init": init,
        "shiftKey": shiftKey,
        "toString": toString,
        "isEnabled": isEnabled,
        "uid": "reference"
    };
}

(function () {
    "use strict";
    document.addEventListener("keydown", (function (element, callback) {
        var index, listener;
        index = 0;
        listener = function (evt) {
            index = ((evt.keyCode || evt.which) === [38, 38, 40, 40, 37, 39, 37, 39, 66, 65][index]) ? index + 1 : 0;
            if (index === 10) {
                callback();
                element.removeEventListener("keydown", listener);
            }
        };
        return listener;
    }(document, function () {
        AnsiEditController.addTool(loadReferenceTool, "tools-left");
        AnsiEditController.addTool(referenceTool, "tools-right", 114);
    })), false);
}());
