function editSauceTool(editor, toolbar) {
    "use strict";

    function init() {
        var metadata, modal, divContainers, paragraph, titleLabel, titleInput, authorLabel, authorInput, groupLabel, groupInput;

        function dismiss() {
            toolbar.modalEnd("edit-sauce");
            modal.remove();
            toolbar.startListening();
        }

        function update() {
            editor.setMetadata(titleInput.value, authorInput.value, groupInput.value);
            dismiss();
        }

        function keypress(evt) {
            if ((evt.keyCode || evt.which) === 13) {
                evt.preventDefault();
                update();
            }
        }

        metadata = editor.getMetadata();
        modal = modalBox();

        divContainers = [
            ElementHelper.create("div", {"className": "input-container sauce"}),
            ElementHelper.create("div", {"className": "input-container sauce"}),
            ElementHelper.create("div", {"className": "input-container sauce"})
        ];

        paragraph = ElementHelper.create("p", {"textContent": "Additional information, such as the size of the canvas and iCE Color mode, will automatically be added to the file."});
        titleLabel = ElementHelper.create("label", {"for": "sauce-title", "textContent": "Title: "});
        titleInput = ElementHelper.create("input", {"className": "long", "id": "sauce-title", "type": "text", "maxLength": "30", "value": metadata.title});
        authorLabel = ElementHelper.create("label", {"for": "sauce-author", "textContent": "Author: "});
        authorInput = ElementHelper.create("input", {"id": "sauce-author", "type": "text", "maxLength": "20", "value": metadata.author});
        groupLabel = ElementHelper.create("label", {"for": "sauce-group", "textContent": "Group: "});
        groupInput = ElementHelper.create("input", {"id": "sauce-group", "type": "text", "maxLength": "20", "value": metadata.group});

        titleInput.addEventListener("keypress", keypress, false);
        authorInput.addEventListener("keypress", keypress, false);
        groupInput.addEventListener("keypress", keypress, false);

        divContainers[0].appendChild(titleLabel);
        divContainers[0].appendChild(titleInput);
        divContainers[1].appendChild(authorLabel);
        divContainers[1].appendChild(authorInput);
        divContainers[2].appendChild(groupLabel);
        divContainers[2].appendChild(groupInput);
        modal.addPanel(paragraph);
        modal.addPanel(divContainers[0]);
        modal.addPanel(divContainers[1]);
        modal.addPanel(divContainers[2]);

        modal.addButton("default", {"textContent": "Update", "href": "#", "onclick": function (evt) {
            evt.preventDefault();
            update();
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
        return "Edit SAUCE Metadata";
    }

    return {
        "init": init,
        "toString": toString,
        "uid": "edit-sauce",
        "isModal": true
    };
}

AnsiEditController.addTool(editSauceTool, "tools-left");