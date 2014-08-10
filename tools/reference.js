function referenceTool(editor, toolbar) {
    "use strict";
    var canvas, referenceMode;

    canvas = ElementHelper.create("canvas", {"width": editor.columns * editor.codepage.fontWidth, "height": editor.height * editor.codepage.fontHeight, "style": {"backgroundPosition": "top left", "backgroundRepeat": "no-repeat"}});
    referenceMode = 0;

    editor.canvas.addEventListener("referenceImage", function (evt) {
        canvas.style.backgroundImage = "url(" + evt.detail + ")";
        if (referenceMode === 0) {
            toolbar.giveFocus("reference");
        }
    }, false);

    function init() {
        switch (++referenceMode) {
        case 1:
            canvas.style.opacity = "0.25";
            editor.addOverlay(canvas, "reference");
            break;
        case 2:
            canvas.style.opacity = "0.50";
            break;
        case 3:
            canvas.style.opacity = "0.75";
            break;
        default:
            editor.removeOverlay("reference");
            referenceMode = 0;
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
        "toString": toString,
        "isEnabled": isEnabled,
        "uid": "reference"
    };
}

AnsiEditController.addTool(referenceTool, "tools-right", 114);