function modalBox() {
    "use strict";
    var divOverlay, divModalBox;

    divOverlay = ElementHelper.create("div", {"className": "screen-overlay"});
    divModalBox = ElementHelper.create("div", {"className": "modal-box"});

    function addButton(className, args) {
        var paragraph, div, anchor;
        div = ElementHelper.create("div", {"className": "button-box " + className});
        paragraph = ElementHelper.create("p", {});
        anchor = ElementHelper.create("a", args);
        paragraph.appendChild(anchor);
        div.appendChild(paragraph);
        divModalBox.appendChild(div);
    }

    function addPanel(element) {
        divModalBox.appendChild(element);
    }

    function init() {
        divOverlay.appendChild(divModalBox);
        document.body.appendChild(divOverlay);
    }

    function remove() {
        document.body.removeChild(divOverlay);
    }

    return {
        "init": init,
        "remove": remove,
        "addButton": addButton,
        "addPanel": addPanel
    };
}