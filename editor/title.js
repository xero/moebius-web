function titleWidget(divTitle, editor, toolbar) {
    "use strict";
    var title, currentTool;

    title = ElementHelper.create("p", {"className": "title", "contentEditable": true, "spellcheck": false});
    divTitle.appendChild(title);
    currentTool = ElementHelper.create("p", {"className": "current-tool", "textContent": ""});
    divTitle.appendChild(currentTool);

    title.addEventListener("focus", function () {
        toolbar.stopListening();
    });

    function getText() {
        return title.textContent;
    }

    function setText(text) {
        title.textContent = text;
    }

    function clearText() {
        setText("Untitled");
    }

    title.addEventListener("keypress", function (evt) {
        var keyCode;
        keyCode = evt.keyCode || evt.which;
        if (keyCode === 13) {
            evt.preventDefault();
            if (title.textContent.length === 0) {
                clearText();
            }
            title.blur();
            toolbar.startListening();
        } else if (title.textContent.length === 32) {
            evt.preventDefault();
        }
    });

    editor.addCustomEventListener("current-tool", function (text) {
        currentTool.textContent = text;
    });

    clearText();

    return {
        "getText": getText,
        "setText": setText,
        "clearText": clearText
    };
}