function saveAsAnsiTool(editor, toolbar, title) {
    "use strict";

    function init() {
        var modal;

        function dismiss() {
            toolbar.modalEnd("save-ansi");
            modal.remove();
            editor.startListening();
            toolbar.startListening();
        }

        modal = modalBox();

        modal.addPanel(ElementHelper.create("p", {"textContent": "Warning: Certain characters cannot be reliably displayed in an ANSi file. These are new-line, carriage return, end-of-file, and escape characters."}));
        modal.addPanel(ElementHelper.create("p", {"textContent": "If you continue this operation, these characters will be saved as horiztonal tab, shift out, data link escape, and device control 1, respectively. These substitute characters appear similar to their replacements."}));

        modal.addButton("default", {"textContent": "Save as ANSi", "href": "#", "onclick": function (evt) {
            var metadata;
            evt.preventDefault();
            metadata = editor.getMetadata();
            Savers.saveAnsiData(editor.getImageData(0, 0, editor.getColumns(), editor.getRows()), editor.getBlinkStatus(), metadata.title, metadata.author, metadata.group, title.getText() + ".ans");
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
        return "Save as ANSi";
    }

    return {
        "init": init,
        "toString": toString,
        "isModal": true,
        "uid": "save-ansi"
    };
}

AnsiEditController.addTool(saveAsAnsiTool, "tools-left");