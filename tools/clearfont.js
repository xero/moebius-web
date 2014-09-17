function clearFontTool(editor, toolbar) {
    "use strict";

    function init() {
        var modal;

        function dismiss() {
            toolbar.modalEnd("clear-font");
            modal.remove();
            editor.startListening();
            toolbar.startListening();
        }

        modal = modalBox();

        modal.addPanel(ElementHelper.create("p", {"textContent": "This operation will replace your current font with the default, are you sure?"}));

        modal.addButton("default", {"textContent": "Clear Font", "href": "#", "onclick": function (evt) {
            evt.preventDefault();
            editor.setFontToDefault();
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
        return "Clear Font";
    }

    return {
        "init": init,
        "toString": toString,
        "uid": "clear-font",
        "isModal": true
    };
}

AnsiEditController.addTool(clearFontTool, "tools-left");