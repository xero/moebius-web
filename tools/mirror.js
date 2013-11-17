function mirrorTool(editor) {
    "use strict";
    var mirror;

    mirror = false;

    function init() {
        mirror = !mirror;
        if (mirror) {
            editor.turnOnMirroring();
        } else {
            editor.turnOffMirroring();
        }
        return false;
    }

    function toString() {
        return "Mirror: " + (mirror ? "On" : "Off");
    }

    return {
        "init": init,
        "toString": toString,
        "uid": "mirror"
    };
}