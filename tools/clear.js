function clearTool(editor, toolbar, title) {
    "use strict";

    function init() {
        var modal;

        function dismiss() {
            toolbar.modalEnd("clear");
            modal.remove();
            editor.startListening();
            toolbar.startListening();
        }

        modal = modalBox();

        modal.addButton("default", {"textContent": "Clear", "href": "#", "onclick": function (evt) {
            evt.preventDefault();
            editor.clearImage();
            editor.clearUndoHistory();
            title.clearText();
            dismiss();
        }});

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
        return "Clear";
    }

    return {
        "init": init,
        "toString": toString,
        "uid": "clear",
        "isModal": true
    };
}

AnsiEditController.addTool(clearTool, "tools-left");