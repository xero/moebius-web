var ElementHelper = (function () {
    "use strict";

    function create(elementName, args) {
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

    return {
        "create": create
    };
}());