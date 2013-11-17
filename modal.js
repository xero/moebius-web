function modalBox() {
    "use strict";
    var divOverlay, divModalBox;

    function createElement(elementName, args) {
        var element;
        args = args || {};
        element = document.createElement(elementName);
        Object.getOwnPropertyNames(args).forEach(function (name) {
            if (typeof args[name] === "object") {
                Object.getOwnPropertyNames(args[name]).forEach(function (subName) {
                    element[name][subName] = args[name][subName];
                });
            } else {
                element[name] = args[name];
            }
        });
        return element;
    }

    divOverlay = createElement("div", {"className": "screen-overlay"});
    divModalBox = createElement("div", {"className": "modal-box"});

    function addButton(className, args) {
        var paragraph, div, anchor;
        div = createElement("div", {"className": "button-box " + className});
        paragraph = createElement("p", {});
        anchor = createElement("a", args);
        paragraph.appendChild(anchor);
        div.appendChild(paragraph);
        divModalBox.appendChild(div);
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
        "addButton": addButton
    };
}