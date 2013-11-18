function clearTool(editor, toolbar) {
    "use strict";

    function init() {
        var modal;

        function dismiss() {
            modal.remove();
            editor.startListening();
            toolbar.startListening();
        }

        modal = modalBox();

        modal.addButton("clear", {"textContent": "Clear", "href": "#", "onclick": function (evt) {
            evt.preventDefault();
            editor.clearImage();
            editor.clearUndoHistory();
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
        "uid": "clear"
    };
}