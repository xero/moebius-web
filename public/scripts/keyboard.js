function createFKeyShorcut(canvas, charCode) {
    "use strict";
    function update() {
        canvas.style.width = font.getWidth() + "px";
        canvas.style.height = font.getHeight() + "px";
        font.draw(charCode, palette.getForegroundColour(), palette.getBackgroundColour(), canvas.getContext("2d"), 0, 0);
    }
    document.addEventListener("onForegroundChange", update);
    document.addEventListener("onBackgroundChange", update);
    document.addEventListener("onFontChange", update);

    update();
}

function createFKeysShortcut() {
    "use strict";
    var shortcuts = [176, 177, 178, 219, 223, 220, 221, 222, 254, 249, 7, 0];
    
    for (var i = 0; i < 12; i++) {
        createFKeyShorcut($("fkey" + i), shortcuts[i]);
    }

    function keyDown(evt) {
        var keyCode = (evt.keyCode || evt.which);
        if (evt.altKey === false && evt.ctrlKey === false && evt.metaKey === false && keyCode >= 112 && keyCode <= 124) {
            evt.preventDefault();
            textArtCanvas.startUndo();
            textArtCanvas.draw((callback) => {
                callback(shortcuts[keyCode - 112], palette.getForegroundColour(), palette.getBackgroundColour(), cursor.getX(), cursor.getY());
            });
            cursor.right();
        }
    }

    function enable() {
        document.addEventListener("keydown", keyDown);
            
    }

    function disable() {
        document.removeEventListener("keydown", keyDown);
    }

    return {
        "enable": enable,
        "disable": disable
    };
}

function createKeyboardController() {
    "use strict";
    var fkeys = createFKeysShortcut();
    var enabled = false;
    var ignored = false;

    function draw(charCode) {
        textArtCanvas.startUndo();
        textArtCanvas.draw((callback) => {
            callback(charCode, palette.getForegroundColour(), palette.getBackgroundColour(), cursor.getX(), cursor.getY());
        });
        cursor.right();
    }

    function deleteText() {
        textArtCanvas.startUndo();
        textArtCanvas.draw((callback) => {
            callback(0, 7, 0, cursor.getX() - 1, cursor.getY());
        });
        cursor.left();
    }

    function keyDown(evt) {
        var keyCode = (evt.keyCode || evt.which);
        if (ignored === false) {
            if (evt.altKey === false && evt.ctrlKey === false && evt.metaKey === false) {
                if (keyCode === 9) {
                    evt.preventDefault();
                    draw(keyCode);
                } else if (keyCode === 8) {
                    evt.preventDefault();
                    if (cursor.getX() > 0) {
                        deleteText();
                    }
                }
            }
        }
    }

    function convertUnicode(keyCode) {
        switch (keyCode) {
        case 0x2302: return 127;
        case 0x00C7: return 128;
        case 0x00FC: return 129;
        case 0x00E9: return 130;
        case 0x00E2: return 131;
        case 0x00E4: return 132;
        case 0x00E0: return 133;
        case 0x00E5: return 134;
        case 0x00E7: return 135;
        case 0x00EA: return 136;
        case 0x00EB: return 137;
        case 0x00E8: return 138;
        case 0x00EF: return 139;
        case 0x00EE: return 140;
        case 0x00EC: return 141;
        case 0x00C4: return 142;
        case 0x00C5: return 143;
        case 0x00C9: return 144;
        case 0x00E6: return 145;
        case 0x00C6: return 146;
        case 0x00F4: return 147;
        case 0x00F6: return 148;
        case 0x00F2: return 149;
        case 0x00FB: return 150;
        case 0x00F9: return 151;
        case 0x00FF: return 152;
        case 0x00D6: return 153;
        case 0x00DC: return 154;
        case 0x00A2: return 155;
        case 0x00A3: return 156;
        case 0x00A5: return 157;
        case 0x20A7: return 158;
        case 0x0192: return 159;
        case 0x00E1: return 160;
        case 0x00ED: return 161;
        case 0x00F3: return 162;
        case 0x00FA: return 163;
        case 0x00F1: return 164;
        case 0x00D1: return 165;
        case 0x00AA: return 166;
        case 0x00BA: return 167;
        case 0x00BF: return 168;
        case 0x2310: return 169;
        case 0x00AC: return 170;
        case 0x00BD: return 171;
        case 0x00BC: return 172;
        case 0x00A1: return 173;
        case 0x00AB: return 174;
        case 0x00BB: return 175;
        case 0x2591: return 176;
        case 0x2592: return 177;
        case 0x2593: return 178;
        case 0x2502: return 179;
        case 0x2524: return 180;
        case 0x2561: return 181;
        case 0x2562: return 182;
        case 0x2556: return 183;
        case 0x2555: return 184;
        case 0x2563: return 185;
        case 0x2551: return 186;
        case 0x2557: return 187;
        case 0x255D: return 188;
        case 0x255C: return 189;
        case 0x255B: return 190;
        case 0x2510: return 191;
        case 0x2514: return 192;
        case 0x2534: return 193;
        case 0x252C: return 194;
        case 0x251C: return 195;
        case 0x2500: return 196;
        case 0x253C: return 197;
        case 0x255E: return 198;
        case 0x255F: return 199;
        case 0x255A: return 200;
        case 0x2554: return 201;
        case 0x2569: return 202;
        case 0x2566: return 203;
        case 0x2560: return 204;
        case 0x2550: return 205;
        case 0x256C: return 206;
        case 0x2567: return 207;
        case 0x2568: return 208;
        case 0x2564: return 209;
        case 0x2565: return 210;
        case 0x2559: return 211;
        case 0x2558: return 212;
        case 0x2552: return 213;
        case 0x2553: return 214;
        case 0x256B: return 215;
        case 0x256A: return 216;
        case 0x2518: return 217;
        case 0x250C: return 218;
        case 0x2588: return 219;
        case 0x2584: return 220;
        case 0x258C: return 221;
        case 0x2590: return 222;
        case 0x2580: return 223;
        case 0x03B1: return 224;
        case 0x00DF: return 225;
        case 0x0393: return 226;
        case 0x03C0: return 227;
        case 0x03A3: return 228;
        case 0x03C3: return 229;
        case 0x00B5: return 230;
        case 0x03C4: return 231;
        case 0x03A6: return 232;
        case 0x0398: return 233;
        case 0x03A9: return 234;
        case 0x03B4: return 235;
        case 0x221E: return 236;
        case 0x03C6: return 237;
        case 0x03B5: return 238;
        case 0x2229: return 239;
        case 0x2261: return 240;
        case 0x00B1: return 241;
        case 0x2265: return 242;
        case 0x2264: return 243;
        case 0x2320: return 244;
        case 0x2321: return 245;
        case 0x00F7: return 246;
        case 0x2248: return 247;
        case 0x00B0: return 248;
        case 0x2219: return 249;
        case 0x00B7: return 250;
        case 0x221A: return 251;
        case 0x207F: return 252;
        case 0x00B2: return 253;
        case 0x25A0: return 254;
        case 0x00A0: return 255;
        default: return keyCode;
        }
    }

    function keyPress(evt) {
        var keyCode = (evt.keyCode || evt.which);
        if (ignored === false) {
            if (evt.altKey === false && evt.ctrlKey === false && evt.metaKey === false) {
                if (keyCode >= 32) {
                    evt.preventDefault();
                    draw(convertUnicode(keyCode));
                } else if (keyCode === 13) {
                    evt.preventDefault();
                    cursor.newLine();
                } else if (keyCode === 8) {
                    evt.preventDefault();
                    if (cursor.getX() > 0) {
                        deleteText();
                    }
                } else if (keyCode === 167) {
                    evt.preventDefault();
                    draw(21);
                }
            } else if (evt.ctrlKey === true) {
                if (keyCode === 21) {
                    evt.preventDefault();
                    var block = textArtCanvas.getBlock(cursor.getX(), cursor.getY());
                    palette.setForegroundColour(block.foregroundColour);
                    palette.setBackgroundColour(block.backgroundColour);
                }
            }
        }
    }

    function textCanvasDown(evt) {
        cursor.move(evt.detail.x, evt.detail.y);
        selectionCursor.setStart(evt.detail.x, evt.detail.y);
    }

    function textCanvasDrag(evt) {
        cursor.hide();
        selectionCursor.setEnd(evt.detail.x, evt.detail.y);
    }

    function enable() {
        document.addEventListener("keydown", keyDown);
        document.addEventListener("keypress", keyPress);
        document.addEventListener("onTextCanvasDown", textCanvasDown);
        document.addEventListener("onTextCanvasDrag", textCanvasDrag);
        cursor.enable();
        fkeys.enable();
        positionInfo.update(cursor.getX(), cursor.getY());
        enabled = true;
    }

    function disable() {
        document.removeEventListener("keydown", keyDown);
        document.removeEventListener("keypress", keyPress);
        document.removeEventListener("onTextCanvasDown", textCanvasDown);
        document.removeEventListener("onTextCanvasDrag", textCanvasDrag);
        selectionCursor.hide();
        cursor.disable();
        fkeys.disable();
        enabled = false;
    }

    function ignore() {
        ignored = true;
        if (enabled === true) {
            cursor.disable();
            fkeys.disable();
        }
    }

    function unignore() {
        ignored = false;
        if (enabled === true) {
            cursor.enable();
            fkeys.enable();
        }
    }

    return {
        "enable": enable,
        "disable": disable,
        "ignore": ignore,
        "unignore": unignore
    };
}
