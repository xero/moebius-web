function titleWidget(divTitle, editor, toolbar) {
    "use strict";
    var p;

    p = ElementHelper.create("p", {"contentEditable": true, "spellcheck": false});
    divTitle.appendChild(p);

    p.addEventListener("focus", function () {
        editor.stopListening();
        toolbar.stopListening();
    });

    p.addEventListener("keypress", function (evt) {
        var keyCode;
        keyCode = evt.keyCode || evt.which;
        if (keyCode === 13) {
            evt.preventDefault();
            if (p.textContent.length === 0) {
                p.textContent = "ansiedit";
            }
            p.blur();
            editor.startListening();
            toolbar.startListening();
        } else if (p.textContent.length === 32) {
            evt.preventDefault();
        }
    });

    function getText() {
        return p.textContent;
    }

    function setText(text) {
        p.textContent = text;
    }

    function clearText() {
        setText("Untitled");
    }

    clearText();

    return {
        "getText": getText,
        "setText": setText,
        "clearText": clearText
    };
}