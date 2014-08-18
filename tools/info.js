function infoTool(editor) {
    "use strict";
    var HUMAN_READABLE_CODES, retina, canvas, ctx, textHeight, categoryEnd;

    HUMAN_READABLE_CODES = ["Null", "Start of Heading", "Start of Text", "End of Text", "End of Transmission", "Enquiry", "Acknowledgment", "Bell", "Back Space", "Horizontal Tab", "Line Feed", "Vertical Tab", "Form Feed", "Carriage Return", "Shift Out / X-On", "Shift In / X-Off", "Data Line Escape", "Device Control 1", "Device Control 2", "Device Control 3", "Device Control 4", "Negative Acknowledgement", "Synchronous Idle", "End of Transmit Block", "Cancel", "End of Medium", "Substitute", "Escape", "File Separator", "Group Separator", "Record Separator", "Unit Separator", "Space", "Exclamation Mark", "Double Quotes", "Number Sign", "Dollar Sign", "Percent Sign", "Ampersand", "Single Quote", "Open Parentheses", "Closed Parentheses", "Asterisk", "Plus Sign", "Comma", "Hyphen", "Period", "Slash", "Zero", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Colon", "Semicolon", "Less-Than Sign", "Equals Sign", "Greater-Than Sign", "Question Mark", "At Symbol", "Uppercase A", "Uppercase B", "Uppercase C", "Uppercase D", "Uppercase E", "Uppercase F", "Uppercase G", "Uppercase H", "Uppercase I", "Uppercase J", "Uppercase K", "Uppercase L", "Uppercase M", "Uppercase N", "Uppercase O", "Uppercase P", "Uppercase Q", "Uppercase R", "Uppercase S", "Uppercase T", "Uppercase U", "Uppercase V", "Uppercase W", "Uppercase X", "Uppercase Y", "Uppercase Z", "Open Bracket", "Backslash", "Closing Bracket", "Caret", "Underscore", "Grave Accent", "Lowercase a", "Lowercase b", "Lowercase c", "Lowercase d", "Lowercase e", "Lowercase f", "Lowercase g", "Lowercase h", "Lowercase i", "Lowercase j", "Lowercase k", "Lowercase l", "Lowercase m", "Lowercase n", "Lowercase o", "Lowercase p", "Lowercase q", "Lowercase r", "Lowercase s", "Lowercase t", "Lowercase u", "Lowercase v", "Lowercase w", "Lowercase x", "Lowercase y", "Lowercase z", "Opening Brace", "Vertical Bar", "Closing Brace", "Tilde", "Delete", "C-Cedilla", "u-Umlaut", "e-Acute", "a-Circumflex", "a-Umlaut", "a-grave", "a-ring", "c-cedilla", "e-circumflex", "e-umlauts", "e-grave", "i-umlaut", "i-circumflex", "i-grave", "A-umlaut", "A-ring", "E-acute", "ae", "AE", "o-circumflex", "o-umlaut", "o-grave", "u-circumflex", "u-grave", "y-diaeresis", "O-umlaut", "U-umlaut", "Cent Sign", "Pound Sign", "Yen Sign", "Peseta Sign", "f-Hook", "a-Acute", "i-Acute", "o-Acute", "u-Acute", "n-Tilde", "N-Tilde", "Feminine Ordinal", "Masculine Ordinal", "Inverted Question Mark", "Reversed Not Sign", "Not Sign", "One Half", "One Quarter", "Inverted Exclamation Mark", "Angle Quotation Mark", "Angle Quotation Mark", "Light Shade", "Medium Shade", "Dark Shade", "Light Vertical", "Light Vertical and Left", "Vertical Single and Left Double", "Vertical Double and Left Single", "Down Double and Left Single", "Down Single and Left Double", "Double Vertical and Left", "Double Vertical", "Double Down and Left", "Double Up and Left", "Up Double and Left Single", "Up Single and Left Double", "Light Down and Left", "Light Up and Right", "Light Up and Horizontal", "Light Down and Horizontal", "Light Vertical and Right", "Light Horizontal", "Light Vertical and Horizontal", "Vertical Single and Right Double", "Vertical Double and Right Single", "Double Up and Right", "Double Down and Right", "Double Up and Horizontal", "Double Down and Horizontal", "Double Vertical and Right", "Double Horizontal", "Double Vertical and Horizontal", "Up Single and Horizontal Double", "Up Double and Horizontal Single", "Down Single and Horizontal Double", "Down Double and Horizontal Single", "Up Double and Right Single", "Up Single and Right Double", "Down Single and Right Double", "Down Double and Right Single", "Vertical Double and Horizontal Single", "Vertical Single and Horizontal Double", "Light Up and Left", "Light Down and Right", "Full Block", "Lower Half Block", "Left Half Block", "Right Half Block", "Upper Half Block", "Alpha", "Sharp S", "Gamma", "Pi", "Capital Sigma", "Lowercase Sigma", "Micro", "Tau", "Phi", "Theta", "Omega", "Delta", "Infinity", "Phi", "Epsilon", "Intersection", "Identical To", "Plus-Minus", "Greater-Than or Equal To", "Less-Than or Equal Ti", "Top Half Integral", "Bottom Half Integral", "Division Sign", "Almost Equal To", "Degree Sign", "Bullet Operator", "Middle Dot", "Square Root", "Superscript Latin Small Letter N", "Superscript Two", "Black Square", "No-Break Space"];

    retina = editor.getRetina();
    canvas = ElementHelper.create("canvas", {"width": retina ? 320 : 160, "height": retina ? 196 : 98});
    categoryEnd = canvas.width * 0.3;

    ctx = canvas.getContext("2d");
    ctx.fillStyle = "rgba(255, 255, 255, 0.25)";
    ctx.textBaseline = "top";
    if (retina) {
        ctx.font = "normal normal normal 22px \"Lucida Grande\", sans-serif";
        textHeight = 28;
    } else {
        ctx.font = "normal normal normal 11px \"Lucida Grande\", sans-serif";
        textHeight = 14;
    }

    function addCategory(text, row) {
        var metric;
        metric = ctx.measureText(text);
        ctx.fillText(text, categoryEnd - metric.width, textHeight * row);
    }

    function updateInfo(text, row) {
        if (row > 0) {
            ctx.textAlign = "left";
            ctx.clearRect(categoryEnd, textHeight * row, canvas.width - categoryEnd, textHeight);
            ctx.fillText(text, categoryEnd + (retina ? 4 : 2), textHeight * row);
        } else {
            ctx.textAlign = "center";
            ctx.clearRect(0, textHeight * row, canvas.width, textHeight);
            ctx.fillText(text, canvas.width / 2, 0);
        }
    }

    function update(block) {
        updateInfo(HUMAN_READABLE_CODES[block.charCode], 0);
        updateInfo(block.textX + 1, 1);
        updateInfo(block.textY + 1, 2);
        updateInfo(block.blockX, 3);
        updateInfo(block.blockY + " (" + (block.isUpperHalf ? "Upper" : "Lower") + ")", 4);
        updateInfo(block.foreground, 5);
        updateInfo(block.background, 6);
    }

    function canvasMove(coord) {
        update(coord);
    }

    function canvasDown(coord) {
        update(coord);
    }

    function canvasDrag(coord) {
        update(coord);
    }

    function canvasOut() {
        var i;
        for (i = 0; i < 9; ++i) {
            updateInfo("", i);
        }
    }

    editor.addMouseMoveListener(canvasMove);
    editor.addMouseDownListener(canvasDown);
    editor.addMouseDragListener(canvasDrag);
    editor.addMouseOutListener(canvasOut);

    addCategory("", 0);
    addCategory("Text X:", 1);
    addCategory("Text Y:", 2);
    addCategory("Block X:", 3);
    addCategory("Block Y:", 4);
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