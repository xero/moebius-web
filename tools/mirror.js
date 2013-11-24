function mirrorTool(editor) {
    "use strict";
    var mirror;

    mirror = false;

    function init() {
        mirror = !mirror;
        editor.setMirror(mirror);
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

AnsiEditController.addTool(mirrorTool, "tools-right", 109);