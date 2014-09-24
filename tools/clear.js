function clearTool(editor, toolbar) {
    "use strict";

    function init() {
        var modal;

        function dismiss() {
            toolbar.modalEnd("clear");
            modal.remove();
            toolbar.startListening();
        }

        modal = modalBox();

        modal.addPanel(ElementHelper.create("p", {"textContent": "Warning: Your undo and redo buffer will also be destroyed."}));

        modal.addButton("default", {"textContent": "Clear", "href": "#", "onclick": function (evt) {
            evt.preventDefault();
            editor.clearImage();
            editor.clearUndoHistory();
            toolbar.clearTitleText();
            dismiss();
        }});

        modal.addButton("cancel", {"textContent": "Cancel", "href": "#", "onclick": function (evt) {
            evt.preventDefault();
            dismiss();
        }});

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