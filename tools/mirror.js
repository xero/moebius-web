function mirrorTool(toolbar) {
    "use strict";
    var mirror;

    mirror = false;

    function init() {
        mirror = !mirror;
        toolbar.editor.setMirror(mirror);
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