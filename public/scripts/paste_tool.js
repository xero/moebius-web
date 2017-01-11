function createPasteTool(cutItem, copyItem, pasteItem, deleteItem) {
    "use strict";
    var buffer;
    var x = 0;
    var y = 0;
    var width = 0;
    var height = 0;
    var enabled = false;

    function setSelection(newX, newY, newWidth, newHeight) {
        x = newX;
        y = newY;
        width = newWidth;
        height = newHeight;
        if (buffer !== undefined) {
            pasteItem.classList.remove("disabled");
        }
        cutItem.classList.remove("disabled");
        copyItem.classList.remove("disabled");
        deleteItem.classList.remove("disabled");
        enabled = true;
    }

    function disable() {
        pasteItem.classList.add("disabled");
        cutItem.classList.add("disabled");
        copyItem.classList.add("disabled");
        deleteItem.classList.add("disabled");
        enabled = false;
    }

    function copy() {
        buffer = textArtCanvas.getArea(x, y, width, height);
        pasteItem.classList.remove("disabled");
    }

    function deleteSelection() {
        if (selectionCursor.isVisible() || cursor.isVisible()) {
            textArtCanvas.startUndo();
            textArtCanvas.deleteArea(x, y, width, height, palette.getBackgroundColour());
        }
    }

    function cut() {
        if (selectionCursor.isVisible() || cursor.isVisible()) {
            copy();
            deleteSelection();
        }
    }

    function paste() {
        if (buffer !== undefined && (selectionCursor.isVisible() || cursor.isVisible())) {
            textArtCanvas.startUndo();
            textArtCanvas.setArea(buffer, x, y);
        }
    }

    function keyDown(evt) {
        var keyCode = (evt.keyCode || evt.which);
        if (enabled) {
            if ((evt.ctrlKey === true || evt.metaKey === true) && evt.altKey === false && evt.shiftKey === false) {
                switch(keyCode) {
                case 88:
                    evt.preventDefault();
                    cut();
                    break;
                case 67:
                    evt.preventDefault();
                    copy();
                    break;
                case 86:
                    evt.preventDefault();
                    paste();
                    break;
                default:
                    break;
                }
            }
        }
        if ((evt.ctrlKey === true || evt.metaKey === true) && keyCode === 8) {
            evt.preventDefault();
            deleteSelection();
        }
    }


    document.addEventListener("keydown", keyDown);

    return {
        "setSelection": setSelection,
        "cut": cut,
        "copy": copy,
        "paste": paste,
        "deleteSelection": deleteSelection,
        "disable": disable
    };
}