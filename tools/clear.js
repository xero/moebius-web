function clearTool(toolbar) {
    "use strict";

    function init() {
        var modal;

        function dismiss() {
            modal.remove();
            toolbar.editor.startListening();
            toolbar.startListening();
        }

        modal = modalBox();

        modal.addButton("clear", {"textContent": "Clear", "href": "#", "onclick": function (evt) {
            evt.preventDefault();
            toolbar.editor.clearImage();
            toolbar.editor.clearUndoHistory();
            dismiss();
        }});

        modal.addButton("cancel", {"textContent": "Cancel", "href": "#", "onclick": function (evt) {
            evt.preventDefault();
            dismiss();
        }});

        toolbar.editor.stopListening();
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

AnsiEditController.addTool(clearTool);