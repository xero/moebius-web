function mirrorTool(toolbar) {
    "use strict";
    var mirror;

    mirror = false;

    function init() {
        mirror = !mirror;
        if (mirror) {
            toolbar.editor.turnOnMirroring();
        } else {
            toolbar.editor.turnOffMirroring();
        }
        return false;
    }

    function isEnabled() {
        return mirror;
    }

    function toString() {
        return "Mirror: " + (mirror ? "On" : "Off");
    }

    return {
        "init": init,
        "toString": toString,
        "isEnabled": isEnabled,
        "uid": "mirror"
    };
}

AnsiEditController.addTool(mirrorTool, 109);