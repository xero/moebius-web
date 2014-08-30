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

    function getState() {
        return [mirror ? 1 : 0];
    }

    function setState(bytes) {
        if ((bytes[0] === 0 && mirror) || (bytes[0] === 1 && !mirror)) {
            mirror = !mirror;
            editor.setMirror(mirror);
        }
    }

    function toString() {
        return "Mirror: " + (mirror ? "On" : "Off");
    }

    return {
        "init": init,
        "toString": toString,
        "getState": getState,
        "setState": setState,
        "isEnabled": isEnabled,
        "uid": "mirror"
    };
}

AnsiEditController.addTool(mirrorTool, "tools-right", 109);