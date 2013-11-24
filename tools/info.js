function infoTool(editor) {
    "use strict";
    var HUMAN_READABLE_CODES, canvas, ctx, textHeight, categoryEnd;

    HUMAN_READABLE_CODES = ["Null", "Face", "Face", "Heart", "Diamond", "Club", "Spade", "Bell", "Backspace", "Horizontal Tab", "Line Feed", "Male Symbol", "Female Symbol", "Musical Note", "Musical Note", undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, "End Of File", "Escape", undefined, undefined, undefined, undefined, "Space", "Exclamation Mark", "Double Quotes", "Number Sign", "Dollar Sign", "Percent Sign", "Ampersand", "Single Quote", "Open Parentheses", "Closed Parentheses", "Asterisk", "Plus Sign", "Comma", "Minus Sign", "Full Stop", "Slash", "Zero", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Colon", "Semicolon", "Less-Than Sign", "Equals Sign", "Greater-Than Sign", "Question Mark", "At Sign", "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z", "Open Square Bracket", "Backslash", "Closed Square Bracket", "Caret", "Underscore", "Grave Accent", "a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z", "Open Curly Bracket", "Vertical-Bar", "Closed Curly Bracket", "Tilde", "Delete", "C-Cedilla", "u-Umlaut", "e-Acute", "a-Circumflex", "a-Umlaut", "a-grave", "a-ring", "c-cedilla", "e-circumflex", "e-umlauts", "e-grave", "i-umlaut", "i-circumflex", "i-grave", "A-umlaut", "A-ring", "E-acute", "ae", "AE", "o-circumflex", "o-umlaut", "o-grave", "u-circumflex", "u-grave", "y-diaeresis", "O-umlaut", "U-umlaut", "Cent Sign", "Pound Sign", "Yen Sign", "Peseta Sign", "f-Hook", "a-Acute", "i-Acute", "o-Acute", "u-Acute", "n-Tilde", "N-Tilde", "Feminine Ordinal", "Masculine Ordinal", "Inverted Question Mark", "Reversed Not Sign", "Not Sign", "One Half", "One Quarter", "Inverted Exclamation Mark", "Angle Quotation Mark", "Angle Quotation Mark", "Light Shade", "Medium Shade", "Dark Shade", "Box Drawing", "Box Drawing", "Box Drawing", "Box Drawing", "Box Drawing", "Box Drawing", "Box Drawing", "Box Drawing", "Box Drawing", "Box Drawing", "Box Drawing", "Box Drawing", "Box Drawing", "Box Drawing", "Box Drawing", "Box Drawing", "Box Drawing", "Box Drawing", "Box Drawing", "Box Drawing", "Box Drawing", "Box Drawing", "Box Drawing", "Box Drawing", "Box Drawing", "Box Drawing", "Box Drawing", "Box Drawing", "Box Drawing", "Box Drawing", "Box Drawing", "Box Drawing", "Box Drawing", "Box Drawing", "Box Drawing", "Box Drawing", "Box Drawing", "Box Drawing", "Box Drawing", "Box Drawing", "Full Block", "Lower Half Block", "Left Half Block", "Right Half Block", "Upper Half Block", "Alpha", "Sharp S", "Gamma", "Pi", "Capital Sigma", "Lowercase Sigma", "Micro", "Tau", "Phi", "Theta", "Omega", "Delta", "Infinity", "Phi", "Epsilon", "Intersection", "Identical To", "Plus-Minus", "Greater-Than or Equal To", "Less-Than or Equal Ti", "Top Half Integral", "Bottom Half Integral", "Division Sign", "Almost Equal To", "Degree Sign", "Bullet Operator", "Middle Dot", "Square Root", "Superscript Latin Small Letter N", "Superscript Two", "Black Square", "No-Break Space"];

    canvas = ElementHelper.create("canvas", {"width": editor.retina ? 320 : 160, "height": editor.retina ? 196 : 98});
    categoryEnd = canvas.width * 0.3;

    ctx = canvas.getContext("2d");
    ctx.fillStyle = "rgba(255, 255, 255, 0.25)";
    ctx.textBaseline = "top";
    if (editor.retina) {
        ctx.font = "normal normal normal 24px \"Lucida Grande\", sans-serif";
        textHeight = 28;
    } else {
        ctx.font = "normal normal normal 12px \"Lucida Grande\", sans-serif";
        textHeight = 14;
    }

    function addCategory(text, row) {
        var metric;
        metric = ctx.measureText(text);
        ctx.fillText(text, categoryEnd - metric.width, textHeight * row);
    }

    function updateInfo(text, row) {
        ctx.clearRect(categoryEnd, textHeight * row, canvas.width - categoryEnd, textHeight);
        ctx.fillText(text, categoryEnd + (editor.retina ? 4 : 2), textHeight * row);
    }

    function update(block) {
        updateInfo(block.textX, 0);
        updateInfo(block.textY, 1);
        updateInfo(block.blockX, 2);
        updateInfo(block.blockY + " (" + (block.isUpperHalf ? "Upper" : "Lower") + ")", 3);
        if (HUMAN_READABLE_CODES[block.charCode]) {
            updateInfo(HUMAN_READABLE_CODES[block.charCode], 4);
        } else {
            updateInfo(block.charCode, 4);
        }
        updateInfo(block.foreground, 5);
        updateInfo(block.background, 6);
    }

    function canvasMove(evt) {
        update(evt.detail);
    }

    function canvasDown(evt) {
        update(evt.detail);
    }

    function canvasDrag(evt) {
        update(evt.detail);
    }

    function canvasOut() {
        var i;
        for (i = 0; i < 9; ++i) {
            updateInfo("", i);
        }
    }

    editor.canvas.addEventListener("canvasMove", canvasMove, false);
    editor.canvas.addEventListener("canvasDown", canvasDown, false);
    editor.canvas.addEventListener("canvasDrag", canvasDrag, false);
    editor.canvas.addEventListener("canvasOut", canvasOut, false);

    addCategory("Text X:", 0);
    addCategory("Text Y:", 1);
    addCategory("Block X:", 2);
    addCategory("Block Y:", 3);
    addCategory("Char:", 4);
    addCategory("Foreg:", 5);
    addCategory("Backg:", 6);

    function toString() {
        return "Information";
    }

    return {
        "toString": toString,
        "canvas": canvas,
        "uid": "info"
    };
}

AnsiEditController.addTool(infoTool, "tools-left");