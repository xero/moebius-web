var RETINA, Toolbar, Palette, Codepage;

RETINA = window.devicePixelRatio > 1;

function createElement(elementName, args) {
    "use strict";
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

Toolbar = (function () {
    "use strict";
    var selected, shortcuts;

    shortcuts = [];

    function addTool(tool, shortcut) {
        var div, paragraph;

        function select() {
            if (selected && (selected.tool.uid === tool.uid)) {
                if (tool.modeChange) {
                    tool.modeChange();
                    if (shortcut) {
                        paragraph.textContent = tool.toString() + " (" + shortcut.symbol + ")";
                    } else {
                        paragraph.textContent = tool.toString();
                    }
                }
            } else {
                if (tool.init()) {
                    if (selected) {
                        selected.div.className = "tool";
                        selected.tool.remove();
                    }
                    selected = {"div": div, "tool": tool};
                    div.className = "tool selected";
                }
            }
        }

        div = createElement("div", {"className": "tool"});
        div.onclick = select;
        if (shortcut) {
            shortcuts[shortcut.keyCode] = select;
            paragraph = createElement("p", {"textContent": tool.toString() + " (" + shortcut.symbol + ")"});
        } else {
            paragraph = createElement("p", {"textContent": tool.toString()});
        }
        div.appendChild(paragraph);
        document.getElementById("tools").appendChild(div);

        return {
            "select": select
        };
    }

    document.addEventListener("keypress", function (evt) {
        var keyCode;
        keyCode = evt.keyCode || evt.which;
        if (shortcuts[keyCode] && selected) {
            evt.preventDefault();
            shortcuts[keyCode](evt.keyCode);
        }
    }, false);

    return {
        "addTool": addTool
    };
}());

Palette = (function () {
    "use strict";
    var selected, canvas, COLORS;

    function egaRGB(value) {
        return new Uint8Array([
            (((value & 32) >> 5) + ((value & 4) >> 1)) * 0x55,
            (((value & 16) >> 4) + ((value & 2))) * 0x55,
            (((value & 8) >> 3) + ((value & 1) << 1)) * 0x55,
            255
        ]);
    }

    COLORS = [0, 1, 2, 3, 4, 5, 20, 7, 56, 57, 58, 59, 60, 61, 62, 63].map(egaRGB);

    function styleRGBA(rgba) {
        return "rgba(" + rgba[0] + ", " + rgba[1] + ", " + rgba[2] + ", " + rgba[3] + ")";
    }

    function drawSwatches(canvas) {
        var ctx, i;

        ctx = canvas.getContext("2d");

        ctx = canvas.getContext("2d");
        for (i = 0; i < 16; ++i) {
            ctx.fillStyle = styleRGBA(COLORS[i]);
            ctx.fillRect((i % 8) * canvas.width / 8, (i < 8) ? canvas.height / 4 : 0, canvas.width / 8, canvas.height / 4);
        }
    }

    function set(col) {
        var evt, ctx;
        ctx = canvas.getContext("2d");
        ctx.fillStyle = styleRGBA(COLORS[col]);
        ctx.fillRect(0, canvas.height / 2, canvas.width, canvas.height / 2);
        selected = col;
        evt = new CustomEvent("colorChange", {"detail": selected});
        document.dispatchEvent(evt);
    }

    document.addEventListener("DOMContentLoaded", function () {
        var divPalette;
        divPalette = document.getElementById("palette");
        canvas = createElement("canvas", {"width": RETINA ? 320 : 160, "height": RETINA ? 320 : 160, "style": {"width": "160px", "height": "160px", "verticalAlign": "bottom"}});
        drawSwatches(canvas);
        canvas.onclick = function (evt) {
            var x, y, col;
            x = evt.clientX - document.getElementById("toolkit").offsetLeft;
            y = evt.clientY - divPalette.offsetTop;
            col = (1 - Math.floor(y / 40)) * 8 + Math.floor(x / 20);
            if (col >= 0) {
                set(col);
            }
        };
        set(15);
        divPalette.appendChild(canvas);
    }, false);

    document.addEventListener("keydown", function (evt) {
        var keyCode, modifier;
        keyCode = evt.keyCode || evt.which;
        modifier = evt.metaKey || evt.altKey || evt.ctrlKey;
        if (!modifier) {
            if (keyCode >= 49 && keyCode <= 56) {
                evt.preventDefault();
                set(keyCode - 49 + (evt.shiftKey ? 8 : 0));
            } else {
                switch (keyCode) {
                case 9:
                    evt.preventDefault();
                    set((selected < 8) ? (selected + 8) : (selected - 8));
                    break;
                case 81:
                    evt.preventDefault();
                    set((selected === 0) ? 15 : selected - 1);
                    break;
                case 87:
                    evt.preventDefault();
                    set((selected === 15) ? 0 : selected + 1);
                    break;
                }
            }
        }
    }, false);

    function getSelected() {
        return selected;
    }

    return {
        "COLORS": COLORS,
        "getSelected": getSelected
    };
}());

Codepage = (function () {
    "use strict";
    var BASE64_CHARS, FONT_80X25, FONT_80X25_SMALL, bigFontBuffer, smallFontBuffer, NULL, SPACE, UPPER_HALF_BLOCK, LOWER_HALF_BLOCK, LIGHT_SHADE, MEDIUM_SHADE, DARK_SHADE, FULL_BLOCK, BULLET_OPERATOR, MIDDLE_DOT, NO_BREAK_SPACE;

    NULL = 0;
    SPACE = 32;
    UPPER_HALF_BLOCK = 223;
    LOWER_HALF_BLOCK = 220;
    LIGHT_SHADE = 176;
    MEDIUM_SHADE = 177;
    DARK_SHADE = 178;
    FULL_BLOCK = 219;
    BULLET_OPERATOR = 249;
    MIDDLE_DOT = 250;
    NO_BREAK_SPACE = 255;

    BASE64_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
    bigFontBuffer = [];
    smallFontBuffer = [];

    function base64ToBits(text) {
        var i, j, k, bytes16, bytes8, bits;
        bytes16 = new Uint32Array(1);
        bytes8 = new Uint8Array(text.length / 4 * 3);
        for (i = j = 0; i < text.length; bytes16[0] = 0) {
            bytes16[0] += (BASE64_CHARS.indexOf(text.charAt(i++)) & 63) << 18;
            bytes16[0] += (BASE64_CHARS.indexOf(text.charAt(i++)) & 63) << 12;
            bytes16[0] += (BASE64_CHARS.indexOf(text.charAt(i++)) & 63) << 6;
            bytes16[0] += BASE64_CHARS.indexOf(text.charAt(i++)) & 63;
            bytes8[j++] = (bytes16[0] >> 16) & 255;
            bytes8[j++] = (bytes16[0] >> 8) & 255;
            bytes8[j++] = bytes16[0] & 255;
        }
        bits = new Uint8Array(9 * 16 * 256);
        for (i = 0, k = 0; i < 9 * 16 * 256 / 8; ++i) {
            for (j = 7; j >= 0; --j) {
                bits[k++] = (bytes8[i] >> j) & 1;
            }
        }
        return bits;
    }

    FONT_80X25 = base64ToBits("AAAAAAAAAAAAAAAAAAAAAAAAAAAfkCpUCgV6mUCgT8AAAAAAAAAfn+23+/2G53+/z8AAAAAAAAAAAAbH8/n8/j4OAgAAAAAAAAAAAAEBwfH8fBwEAAAAAAAAAAAAAwPB453O5wwGB4AAAAAAAAAAAwPD8/3+fgwGB4AAAAAAAAAAAAAAAGB4PAwAAAAAAAAA/3+/3+/3+52Gw3O/3+/3+/3+AAAAAAAB4ZiEQjMPAAAAAAAA/3+/3+/2GmV6vUyw3+/3+/3+AAAHgcGhkeGYzGYzDwAAAAAAAAAPDMZjMZh4GD8GAwAAAAAAAAAPxmPxgMBgMDg8HAAAAAAAAAAfzGfzGYzGYzO53MwAAAAAAAAAAwGG2PHOPG2GAwAAAAAAAEAwHA8Hw/nw8HAwEAAAAAAAAAEBgcHh8/h8HgcBgEAAAAAAAAAGB4fgwGAwfh4GAAAAAAAAAAAZjMZjMZjMZgAZjMAAAAAAAAAf22222ew2Gw2Gw2AAAAAAAD4xjAODYxmMbBwDGMfAAAAAAAAAAAAAAAAA/n8/n8AAAAAAAAAGB4fgwGAwfh4GD8AAAAAAAAAGB4fgwGAwGAwGAwAAAAAAAAAGAwGAwGAwGD8PAwAAAAAAAAAAAAAAwDH8DAwAAAAAAAAAAAAAAAABgYH8YBgAAAAAAAAAAAAAAAAAAwGAwH8AAAAAAAAAAAAAAAABQbH8bBQAAAAAAAAAAAAAAAEBwOD4fH8/gAAAAAAAAAAAAA/n8fD4OBwEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAGB4PB4GAwGAAGAwAAAAAAADMZjMJAAAAAAAAAAAAAAAAAAAAADYbH8bDYbH8bDYAAAAAAGAwfGMwmAfAMBkMxj4GAwAAAAAAAAAwmMDAwMDAxkMAAAAAAAAAODYbBwdm4zGYzDsAAAAAAABgMBgYAAAAAAAAAAAAAAAAAAAADAwMBgMBgMBgGAYAAAAAAAAAMAwDAYDAYDAYGBgAAAAAAAAAAAAADMPH+PDMAAAAAAAAAAAAAAAAAwGD8GAwAAAAAAAAAAAAAAAAAAAAAAAwGAwMAAAAAAAAAAAAAAAH8AAAAAAAAAAAAAAAAAAAAAAAAAAAGAwAAAAAAAAAAAAAgMDAwMDAwEAAAAAAAAAAODYxmM1msxmMbBwAAAAAAAAAGBweAwGAwGAwGD8AAAAAAAAAfGMBgYGBgYGAxn8AAAAAAAAAfGMBgMPAMBgMxj4AAAAAAAAADA4PDYzH8DAYDA8AAAAAAAAA/mAwGA/AMBgMxj4AAAAAAAAAODAwGA/GMxmMxj4AAAAAAAAA/mMBgMDAwMBgMBgAAAAAAAAAfGMxmMfGMxmMxj4AAAAAAAAAfGMxmMfgMBgMDDwAAAAAAAAAAAAGAwAAAAAwGAAAAAAAAAAAAAAGAwAAAAAwGBgAAAAAAAAAAAMDAwMDAMAwDAMAAAAAAAAAAAAAD8AAAfgAAAAAAAAAAAAAADAMAwDAMDAwMDAAAAAAAAAAfGMxgYGAwGAAGAwAAAAAAAAAAD4xmM3m83m4wD4AAAAAAAAAEBwbGMxn8xmMxmMAAAAAAAAA/DMZjMfDMZjMZn4AAAAAAAAAPDMwmAwGAwGEZh4AAAAAAAAA+DYZjMZjMZjMbHwAAAAAAAAA/jMYjQeDQYDEZn8AAAAAAAAA/jMYjQeDQYDAYHgAAAAAAAAAPDMwmAwG8xmMZh0AAAAAAAAAxmMxmM/mMxmMxmMAAAAAAAAAPAwGAwGAwGAwGB4AAAAAAAAAHgYDAYDAYzGYzDwAAAAAAAAA5jMZjYeDwbDMZnMAAAAAAAAA8DAYDAYDAYDEZn8AAAAAAAAAxnc/n81mMxmMxmMAAAAAAAAAxnM9n83mcxmMxmMAAAAAAAAAfGMxmMxmMxmMxj4AAAAAAAAA/DMZjMfDAYDAYHgAAAAAAAAAfGMxmMxmMxms3j4DAcAAAAAA/DMZjMfDYZjMZnMAAAAAAAAAfGMxjAOAYBmMxj4AAAAAAAAAfj8WgwGAwGAwGB4AAAAAAAAAxmMxmMxmMxmMxj4AAAAAAAAAxmMxmMxmMxjYOAgAAAAAAAAAxmMxmM1ms1n87jYAAAAAAAAAxmMbD4OBwfDYxmMAAAAAAAAAZjMZjMPAwGAwGB4AAAAAAAAA/mMhgYGBgYGExn8AAAAAAAAAPBgMBgMBgMBgMB4AAAAAAAAAAEAwHAcBwHAcBgEAAAAAAAAAPAYDAYDAYDAYDB4AAAAAAEBwbGMAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAH+AAAABgGAYAAAAAAAAAAAAAAAAAAAAAAAAADwDD4zGYzDsAAAAAAAAA4DAYDwbDMZjMZj4AAAAAAAAAAAAAD4xmAwGAxj4AAAAAAAAAHAYDB4bGYzGYzDsAAAAAAAAAAAAAD4xn8wGAxj4AAAAAAAAAHBsMhgeBgMBgMDwAAAAAAAAAAAAADszGYzGYzD4DGYeAAAAA4DAYDYdjMZjMZnMAAAAAAAAAGAwABwGAwGAwGB4AAAAAAAAABgMAAcBgMBgMBgMZjMPAAAAA4DAYDMbDweDYZnMAAAAAAAAAOAwGAwGAwGAwGB4AAAAAAAAAAAAAHY/ms1ms1mMAAAAAAAAAAAAAG4ZjMZjMZjMAAAAAAAAAAAAAD4xmMxmMxj4AAAAAAAAAAAAAG4ZjMZjMZj4YDA8AAAAAAAAADszGYzGYzD4DAYHgAAAAAAAAG4djMYDAYHgAAAAAAAAAAAAAD4xjAOAYxj4AAAAAAAAAEBgMH4MBgMBgNg4AAAAAAAAAAAAAGYzGYzGYzDsAAAAAAAAAAAAAGMxmMxmMbBwAAAAAAAAAAAAAGMxms1ms/jYAAAAAAAAAAAAAGMbBwOBwbGMAAAAAAAAAAAAAGMxmMxmMxj8BgY+AAAAAAAAAH8zAwMDAxn8AAAAAAAAADgwGAwcAwGAwGAcAAAAAAAAAGAwGAwGAwGAwGAwAAAAAAAAAcAwGAwDgwGAwGDgAAAAAAADs3AAAAAAAAAAAAAAAAAAAAAAAAAAEBwbGMxmM/gAAAAAAAAAAPDMwmAwGAwGEZh4GDgAAAAAAzAAAGYzGYzGYzDsAAAAAAAAYGBgAD4xn8wGAxj4AAAAAAAAgODYADwDD4zGYzDsAAAAAAAAAzAAADwDD4zGYzDsAAAAAAADAMAwADwDD4zGYzDsAAAAAAABwbBwADwDD4zGYzDsAAAAAAAAAAAAAD4xmAwGAxj4GDgAAAAAgODYAD4xn8wGAxj4AAAAAAAAAxgAAD4xn8wGAxj4AAAAAAADAMAwAD4xn8wGAxj4AAAAAAAAAZgAABwGAwGAwGB4AAAAAAAAwPDMABwGAwGAwGB4AAAAAAADAMAwABwGAwGAwGB4AAAAAAAGMAAgODYxmM/mMxmMAAAAAAODYOAgODYxn8xmMxmMAAAAAADAwAH8ZjEaDwaDEZn8AAAAAAAAAAAAAHYNhsfmw2DcAAAAAAAAAPjYzGY/mYzGYzGcAAAAAAAAgODYAD4xmMxmMxj4AAAAAAAAAxgAAD4xmMxmMxj4AAAAAAADAMAwAD4xmMxmMxj4AAAAAAABgeGYAGYzGYzGYzDsAAAAAAADAMAwAGYzGYzGYzDsAAAAAAAAAxgAAGMxmMxmMxj8BgYeAAAGMAD4xmMxmMxmMxj4AAAAAAAGMAGMxmMxmMxmMxj4AAAAAAAAwGD4xmAwGAxj4GAwAAAAAAABwbDIYHgYDAYDA5n4AAAAAAAAAZjMPAwfgwfgwGAwAAAAAAAHwzGY+GIzG8zGYzGMAAAAAAAAcGwwGAwfgwGAw2DgAAAAAAAAwMDAADwDD4zGYzDsAAAAAAAAYGBgABwGAwGAwGB4AAAAAAAAwMDAAD4xmMxmMxj4AAAAAAAAwMDAAGYzGYzGYzDsAAAAAAAAAdm4AG4ZjMZjMZjMAAAAAAdm4AGM5ns/m8zmMxmMAAAAAAAAAPDYbB8AD8AAAAAAAAAAAAAAAODYbBwAD4AAAAAAAAAAAAAAAMBgABgMDAwGMxj4AAAAAAAAAAAAAAA/mAwGAwAAAAAAAAAAAAAAAAA/gMBgMBgAAAAAAAADA4DEZjYGBgYG4hgYGB8AAAADA4DEZjYGBgZmcmh+BgMAAAAAAGAwAAwGAwPB4PAwAAAAAAAAAAAAABsbGwbBsAAAAAAAAAAAAAAAAGwbBsbGwAAAAAAAAAESIESIESIESIESIESIESIESIVVUVVUVVUVVUVVUVVUVVUVVU3Tu3Tu3Tu3Tu3Tu3Tu3Tu3TuGAwGAwGAwGAwGAwGAwGAwGAwGAwGAwGAwGHwGAwGAwGAwGAwGAwGAwGHwGHwGAwGAwGAwGAwNhsNhsNhsNnsNhsNhsNhsNhsAAAAAAAAAAH8NhsNhsNhsNhsAAAAAAAHwGHwGAwGAwGAwGAwNhsNhsNnsBnsNhsNhsNhsNhsNhsNhsNhsNhsNhsNhsNhsNhsAAAAAAAH8BnsNhsNhsNhsNhsNhsNhsNnsBn8AAAAAAAAAAAANhsNhsNhsNn8AAAAAAAAAAAAGAwGAwGHwGHwAAAAAAAAAAAAAAAAAAAAAAHwGAwGAwGAwGAwGAwGAwGAwGA/AAAAAAAAAAAAGAwGAwGAwGH/AAAAAAAAAAAAAAAAAAAAAAH/GAwGAwGAwGAwGAwGAwGAwGA/GAwGAwGAwGAwAAAAAAAAAAH/AAAAAAAAAAAAGAwGAwGAwGH/GAwGAwGAwGAwGAwGAwGA/GA/GAwGAwGAwGAwNhsNhsNhsNhvNhsNhsNhsNhsNhsNhsNhvMB/AAAAAAAAAAAAAAAAAAAB/MBvNhsNhsNhsNhsNhsNhsNnvAH/AAAAAAAAAAAAAAAAAAAH/AHvNhsNhsNhsNhsNhsNhsNhvMBvNhsNhsNhsNhsAAAAAAAH/AH/AAAAAAAAAAAANhsNhsNnvAHvNhsNhsNhsNhsGAwGAwGH/AH/AAAAAAAAAAAANhsNhsNhsNn/AAAAAAAAAAAAAAAAAAAH/AH/GAwGAwGAwGAwAAAAAAAAAAH/NhsNhsNhsNhsNhsNhsNhsNh/AAAAAAAAAAAAGAwGAwGA/GA/AAAAAAAAAAAAAAAAAAAA/GA/GAwGAwGAwGAwAAAAAAAAAAB/NhsNhsNhsNhsNhsNhsNhsNn/NhsNhsNhsNhsGAwGAwGH/GH/GAwGAwGAwGAwGAwGAwGAwGHwAAAAAAAAAAAAAAAAAAAAAAA/GAwGAwGAwGAw////////////////////////AAAAAAAAAAH/////////////8Hg8Hg8Hg8Hg8Hg8Hg8Hg8HgD4fD4fD4fD4fD4fD4fD4fD4f//////////4AAAAAAAAAAAAAAAAAAAADs3Gw2Gw3DsAAAAAAAAAeGYzGY2GYxmMxmYAAAAAAAAA/mMxmAwGAwGAwGAAAAAAAAAAAAAAH8bDYbDYbDYAAAAAAAAA/mMYBgGAwMDAxn8AAAAAAAAAAAAAD82Gw2Gw2DgAAAAAAAAAAAAADMZjMZjMZj4YDAwAAAAAAAAdm4GAwGAwGAwAAAAAAAAAfgwPDMZjMZh4GD8AAAAAAAAAODYxmM/mMxmMbBwAAAAAAAAAODYxmMxjYbDYbHcAAAAAAAAAHhgGAYPjMZjMZh4AAAAAAAAAAAAAD82222z8AAAAAAAAAAAAAAGBj82228z8YGAAAAAAAAAAHBgYDAfDAYDAMA4AAAAAAAAAAD4xmMxmMxmMxmMAAAAAAAAAAAA/gAAH8AAA/gAAAAAAAAAAAAAGAwfgwGAAAD8AAAAAAAAAABgGAYBgYGBgAD8AAAAAAAAAAAYGBgYBgGAYAD8AAAAAAAAADg2GwwGAwGAwGAwGAwGAwGAwGAwGAwGAwGGw2GwcAAAAAAAAAAAAAwAD8AAwAAAAAAAAAAAAAAAADs3AAdm4AAAAAAAAAABwbDYOAAAAAAAAAAAAAAAAAAAAAAAAAAAAwGAAAAAAAAAAAAAAAAAAAAAAwAAAAAAAAAAAAAAeDAYDAYDHYbDYPA4AAAAAAADYNhsNhsNgAAAAAAAAAAAAAAB4ZgYGBkfgAAAAAAAAAAAAAAAAAAAfj8fj8fj8fgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA");
    FONT_80X25_SMALL = base64ToBits("AAAAAACQD2Bvb/CfCu5EAATu5AAE6k4ABO5OAAAGYAD/+Z//AGmWAP+Waf8CSqQABKpEAAdESAAHVVoABEpEAAjOyAACbmIABOTkAAqqCgAHpiIwaGlhYAAA7gAE5OTgBOREQATkREAALyAAAE9AAAAI8AAAb2AAAE7gAADuQAAAAAAABEQEAAqgAAAE5OQARoQsQACSSQAE5JpQBIAAAAJERCAEIiJACk5KAABOQAAAAASAAA4AAAAABAAAJEgABKqkAAxETgAMJI4ADCQsAAiORAAOhCwABIykAA4kRAAEpKQABqYiAABAQAAAQEgAAkhCAADw8AAIQkgASiQEAATuhgAErqoADKysAASopAAMqqwADoyOAA6MiAAEqOQACq6qAA5ETgAOIqQACqyqAAiIjgAK7qoACu7qAASqpAAMrIgABKqmAAysqgAGhCwADkREAAqqpAAKqkQACq7kAAqkqgAKpEQADiSOAAZERgAAhEIABiImAEoAAAAAAADwCEAAAABqpgAIyqwAAGiGAAJqpgAAToYAAkZEAABKpiQIyqoABAREAAQERIAIrKoABEREAADuqgAAyqoAAEqkAADKyAAAamIAAMqIAABoLAAE5EQAAKqmAACqpAAAqu4AAKRKAACqRAAA4s4AAkxCAARERAAIRkgAbAAAAABKrgAEqKSACgqmACQk6OBKBuYACgbmAEIG5gAEBuYAAAaGSEoE6OAKBOjghATo4AoERABKBEQAhAREAKBK6gBASuoAJA6MjgBv5wAHr6sASgSqQKAEqkCEBKpASgqkAIQKpACgqkQAoEqqQKCqqkAARoZASoyOAKpORADKyrohJU5EgCQG5gAkBEQAJASqQCQKpABsDKoAbAru6gbmDgAEpA4AQEikAAAOiAAADiIARA4EjkQOCOQEBO5AAFhQAAChoAAUFBQUWlpaWtfX19dERERERExERETMRERVXVVVAA9VVQDMRERV3VVVVVVVVQD9VVVV3wAAVV8AAETMAAAADEREREcAAERPAAAAD0REREdERAAPAABET0RERHdERFVXVVVVdwAAAHdVVVX/AAAA/1VVVXdVVQD/AABV/1VVRP8AAFVfAAAA/0REAA9VVVVXAABEdwAAAHdERAAHVVVVX1VVRP9ERERMAAAAB0RE/////wAA///MzMzMMzMzM///AAAFqqUAaamSAA6oiAAA6qoA+EJI8AB6qkAAVVZIAKREQOSqpOBKrqpAaZZmkGQmmWAA+Z8AEmlkgAaOhgAGmZkADg4OAABOQOAAQkBgACQgYAJUREREREzABA4EAAWgWgBKQAAAAAZgAAAGAAADIqYgDKoAAEJGAAAAZmYAAAAAAA==");

    function doubleScale(rgbaSource, fontWidth) {
        var byteWidth, doubledByteWidth, rgba, rgbaDoubled, startOfRow, i, k;
        byteWidth = fontWidth * 4;
        doubledByteWidth = byteWidth * 2;
        rgbaDoubled = new Uint8Array(rgbaSource.length * 4);
        for (i = 0, k = 0; i < rgbaSource.length; i += 4) {
            rgba = rgbaSource.subarray(i, i + 4);
            rgbaDoubled.set(rgba, k);
            k += 4;
            rgbaDoubled.set(rgba, k);
            k += 4;
            if ((i + 4) % byteWidth === 0) {
                startOfRow = k - doubledByteWidth;
                rgbaDoubled.set(rgbaDoubled.subarray(startOfRow, startOfRow + doubledByteWidth), k);
                k += doubledByteWidth;
            }
        }
        return rgbaDoubled;
    }

    function scaleCanvas(sourceData, width, height, chunkWidth, chunkHeight) {
        var destWidth, destHeight, destData, rgba, pixelRowOffset, chunkSize, i, j, k, x, y, r, g, b, a;

        rgba = new Uint8Array(4);
        destWidth = width / chunkWidth;
        destHeight = height / chunkHeight;
        destData = new Uint8Array(destWidth * destHeight * 4);
        pixelRowOffset = (width - chunkWidth) * 4;
        chunkSize = chunkWidth * chunkHeight;

        for (i = x = y = 0; i < destData.length; i += 4) {
            for (j = r = g = b = a = 0, k = (y * width * chunkHeight + x * chunkWidth) * 4; j < chunkSize; ++j) {
                r += sourceData[k++];
                g += sourceData[k++];
                b += sourceData[k++];
                a += sourceData[k++];
                if ((j + 1) % chunkWidth === 0) {
                    k += pixelRowOffset;
                }
            }
            rgba[0] = Math.round(r / chunkSize);
            rgba[1] = Math.round(g / chunkSize);
            rgba[2] = Math.round(b / chunkSize);
            rgba[3] = Math.round(a / chunkSize);
            destData.set(rgba, i);
            if (++x === destWidth) {
                x = 0;
                ++y;
            }
        }

        return destData;
    }

    function getData(charCode, fg, bg, width, height, data, excludeNinthBit) {
        var fontBitWidth, rgbaOutput, i, j, k;
        fontBitWidth = width * height;
        rgbaOutput = new Uint8Array((excludeNinthBit ? width - 1 : width) * height * 4);
        for (i = 0, j = charCode * fontBitWidth, k = 0; i < fontBitWidth; ++i, ++j) {
            if (!excludeNinthBit || (i + 1) % 9 !== 0) {
                if (data[j]) {
                    rgbaOutput.set(Palette.COLORS[fg], k);
                } else {
                    rgbaOutput.set(Palette.COLORS[bg], k);
                }
                k += 4;
            }
        }
        return rgbaOutput;
    }

    function bigFont(charCode, fg, bg) {
        var bufferIndex;
        bufferIndex = charCode + (fg << 8) + (bg << 12);
        if (!bigFontBuffer[bufferIndex]) {
            bigFontBuffer[bufferIndex] = getData(charCode, fg, bg, 9, 16, FONT_80X25, true);
            if (RETINA) {
                bigFontBuffer[bufferIndex] = doubleScale(bigFontBuffer[bufferIndex], 8);
            }
        }
        return bigFontBuffer[bufferIndex];
    }

    function smallFont(charCode, fg, bg) {
        var bufferIndex;
        bufferIndex = charCode + (fg << 8) + (bg << 12);
        if (!smallFontBuffer[bufferIndex]) {
            smallFontBuffer[bufferIndex] = getData(charCode, fg, bg, 4, 8, FONT_80X25_SMALL, false);
            if (!RETINA) {
                smallFontBuffer[bufferIndex] = scaleCanvas(smallFontBuffer[bufferIndex], 4, 8, 2, 2);
            }
        }
        return smallFontBuffer[bufferIndex];
    }

    return {
        "bigFont": bigFont,
        "smallFont": smallFont,
        "NULL": NULL,
        "SPACE": SPACE,
        "UPPER_HALF_BLOCK": UPPER_HALF_BLOCK,
        "LOWER_HALF_BLOCK": LOWER_HALF_BLOCK,
        "LIGHT_SHADE": LIGHT_SHADE,
        "MEDIUM_SHADE": MEDIUM_SHADE,
        "DARK_SHADE": DARK_SHADE,
        "FULL_BLOCK": FULL_BLOCK,
        "BULLET_OPERATOR": BULLET_OPERATOR,
        "MIDDLE_DOT": MIDDLE_DOT,
        "NO_BREAK_SPACE": NO_BREAK_SPACE
    };
}());

function editorCanvas(height) {
    "use strict";
    var canvas, previewCanvas, ctx, previewCtx, imageData, previewImageData, image;

    image = new Uint8Array(80 * height * 3);

    function draw(charCode, x, y, fg, bg) {
        previewImageData.data.set(Codepage.smallFont(charCode, fg, bg), 0);
        imageData.data.set(Codepage.bigFont(charCode, fg, bg), 0);
        previewCtx.putImageData(previewImageData, x * previewImageData.width, y * previewImageData.height);
        ctx.putImageData(imageData, x * imageData.width, y * imageData.height);
    }

    function update(index) {
        draw(image[index], (index / 3) % 80, Math.floor(index / 240), image[index + 1], image[index + 2]);
    }

    function redraw() {
        var i;
        for (i = 0; i < image.length; i += 3) {
            update(i);
        }
    }

    function set(charCode, fg, bg, index) {
        image[index] = charCode;
        image[index + 1] = fg;
        image[index + 2] = bg;
        update(index);
    }

    function get(coord) {
        var index, charCode, foreground, background, isBlocky, upperBlockColor, lowerBlockColor;
        index = (coord.textY * 80 + coord.textX) * 3;
        charCode = image[index];
        foreground = image[index + 1];
        background = image[index + 2];
        switch (charCode) {
        case Codepage.NULL:
        case Codepage.SPACE:
        case Codepage.NO_BREAK_SPACE:
            upperBlockColor = background;
            lowerBlockColor = background;
            isBlocky = true;
            break;
        case Codepage.UPPER_HALF_BLOCK:
            upperBlockColor = foreground;
            lowerBlockColor = background;
            isBlocky = true;
            break;
        case Codepage.LOWER_HALF_BLOCK:
            upperBlockColor = background;
            lowerBlockColor = foreground;
            isBlocky = true;
            break;
        case Codepage.FULL_BLOCK:
            upperBlockColor = foreground;
            lowerBlockColor = foreground;
            isBlocky = true;
            break;
        default:
            isBlocky = false;
        }
        return {
            "charCode": charCode,
            "foreground": foreground,
            "background": background,
            "isBlocky": isBlocky,
            "upperBlockColor": upperBlockColor,
            "lowerBlockColor": lowerBlockColor
        };
    }

    function setChunk(coord, color) {
        var block;
        block = get(coord);
        if (block.isBlocky) {
            if (coord.isUpperHalf) {
                if (block.lowerBlockColor === color) {
                    set(Codepage.FULL_BLOCK, color, block.background, coord.index);
                } else {
                    set(Codepage.UPPER_HALF_BLOCK, color, block.lowerBlockColor, coord.index);
                }
            } else {
                if (block.upperBlockColor === color) {
                    set(Codepage.FULL_BLOCK, color, block.background, coord.index);
                } else {
                    set(Codepage.LOWER_HALF_BLOCK, color, block.upperBlockColor, coord.index);
                }
            }
        } else {
            if (coord.isUpperHalf) {
                set(Codepage.UPPER_HALF_BLOCK, color, block.background, coord.index);
            } else {
                set(Codepage.LOWER_HALF_BLOCK, color, block.background, coord.index);
            }
        }
    }

    function getBlockCoord(blockX, blockY) {
        var x, y, textY, modBlockY;

        x = blockX * 8;
        y = blockY * 16;
        textY = Math.floor(blockY / 2);
        modBlockY = blockY % 2;

        return {
            "index": (textY * 80 + blockX) * 3,
            "x": x,
            "y": y,
            "textX": blockX,
            "textY": textY,
            "blockX": blockX,
            "blockY": blockY,
            "isUpperHalf": (modBlockY === 0),
            "isLowerHalf": (modBlockY === 1)
        };
    }

    function chunkLine(from, to, callback) {
        var x0, y0, x1, y1, dx, dy, sx, sy, err, e2;

        x0 = from.blockX;
        y0 = from.blockY;
        x1 = to.blockX;
        y1 = to.blockY;
        dx = Math.abs(x1 - x0);
        sx = (x0 < x1) ? 1 : -1;
        dy = Math.abs(y1 - y0);
        sy = (y0 < y1) ? 1 : -1;
        err = ((dx > dy) ? dx : -dy) / 2;

        while (true) {
            callback(getBlockCoord(x0, y0));
            if (x0 === x1 && y0 === y1) {
                break;
            }
            e2 = err;
            if (e2 > -dx) {
                err -= dy;
                x0 += sx;
            }
            if (e2 < dy) {
                err += dx;
                y0 += sy;
            }
        }
    }

    function setChar(charCode, color, coord) {
        var block;
        block = get(coord);
        if (block.isBlocky) {
            if (coord.isUpperHalf) {
                set(charCode, color, block.upperBlockColor, coord.index);
            } else {
                set(charCode, color, block.lowerBlockColor, coord.index);
            }
        } else {
            set(charCode, color, block.background, coord.index);
        }
    }

    function resolveConflict(coord, bias) {
        var block;
        block = get(coord);
        if (block.background > 7) {
            if (block.isBlocky) {
                if (block.foreground > 7) {
                    if (block.background === bias) {
                        if (block.upperBlockColor === block.background) {
                            set(Codepage.UPPER_HALF_BLOCK, block.background, block.foreground - 8, coord.index);
                        } else {
                            set(Codepage.LOWER_HALF_BLOCK, block.background, block.foreground - 8, coord.index);
                        }
                    } else {
                        set(image[coord.index], block.foreground, block.background - 8, coord.index);
                    }
                } else {
                    if ((block.upperBlockColor === block.background) && (block.lowerBlockColor === block.background)) {
                        set(Codepage.FULL_BLOCK, block.background, block.foreground, coord.index);
                    } else if (block.upperBlockColor === block.background) {
                        set(Codepage.UPPER_HALF_BLOCK, block.background, block.foreground, coord.index);
                    } else if (block.lowerBlockColor === block.background) {
                        set(Codepage.LOWER_HALF_BLOCK, block.background, block.foreground, coord.index);
                    } else {
                        set(Codepage.FULL_BLOCK, block.foreground, block.background - 8, coord.index);
                    }
                }
            } else {
                set(image[coord.index], block.foreground, block.background - 8, coord.index);
            }
        }
    }

    function resolveConflicts(bias) {
        var i;
        for (i = 0; i < image.length; i += 3) {
            resolveConflict({"textX": (i / 3) % 80, "textY": Math.floor(i / 240), "index": i}, bias);
        }
    }

    function init(divEditor) {
        var mousedown;

        canvas = createElement("canvas", {"width": RETINA ? 1280 : 640, "height": RETINA ? height * 32 : height * 16, "style": {"width": "640px", "height": (height * 16) + "px", "verticalAlign": "bottom"}});
        previewCanvas = createElement("canvas", {"width": RETINA ? 320 : 160, "height": RETINA ? height * 8 : height * 4, "style": {"width": "160px", "height": (height * 4) + "px", "verticalAlign": "bottom"}});
        ctx = canvas.getContext("2d");
        previewCtx = previewCanvas.getContext("2d");
        imageData = ctx.createImageData(RETINA ? 16 : 8, RETINA ? 32 : 16);
        previewImageData = ctx.createImageData(RETINA ? 4 : 2, RETINA ? 8 : 4);

        redraw();

        function getCoord(pageX, pageY) {
            var x, y, coord;

            x = pageX - divEditor.offsetLeft;
            y = pageY - divEditor.offsetTop;
            coord = getBlockCoord(Math.floor(x / 8), Math.floor(y / 8));
            coord.x = x;
            coord.y = y;

            return coord;
        }

        canvas.addEventListener("mousedown", function (evt) {
            mousedown = true;
            document.dispatchEvent(new CustomEvent("canvasDown", {"detail": getCoord(evt.pageX, evt.pageY)}));
        }, false);

        canvas.addEventListener("mouseup", function () {
            mousedown = false;
        }, false);

        canvas.addEventListener("mousemove", function (evt) {
            document.dispatchEvent(new CustomEvent(mousedown ? "canvasDrag" : "canvasMove", {"detail": getCoord(evt.pageX, evt.pageY)}));
        }, false);

        canvas.addEventListener("mouseout", function () {
            mousedown = false;
        }, false);

        divEditor.appendChild(canvas);
        document.getElementById("preview").appendChild(previewCanvas);
    }

    return {
        "init": init,
        "height": height,
        "set": set,
        "get": get,
        "getBlockCoord": getBlockCoord,
        "setChunk": setChunk,
        "chunkLine": chunkLine,
        "setChar": setChar,
        "resolveConflict": resolveConflict,
        "resolveConflicts": resolveConflicts,
        "redraw": redraw,
        "image": image
    };
}

function freehandTool(editor) {
    "use strict";
    var currentColor, lastPoint, shiftDown;

    function colorChange(evt) {
        currentColor = evt.detail;
    }

    function blockyLine(from, to) {
        editor.chunkLine(from, to, function (coord) {
            editor.setChunk(coord, currentColor);
            editor.resolveConflict(coord, currentColor);
        });
    }

    function canvasDown(evt) {
        if (shiftDown && lastPoint) {
            blockyLine(lastPoint, evt.detail);
        } else {
            editor.setChunk(evt.detail, currentColor);
            editor.resolveConflict(evt.detail, currentColor);
        }
        lastPoint = evt.detail;
    }

    function canvasDrag(evt) {
        blockyLine(lastPoint, evt.detail);
        lastPoint = evt.detail;
    }

    function keydown(evt) {
        switch (evt.keyCode || evt.which) {
        case 16:
            shiftDown = true;
            break;
        }
    }

    function keyup(evt) {
        switch (evt.keyCode || evt.which) {
        case 16:
            shiftDown = false;
            break;
        }
    }

    function init() {
        document.addEventListener("colorChange", colorChange, false);
        document.addEventListener("canvasDown", canvasDown, false);
        document.addEventListener("canvasDrag", canvasDrag, false);
        document.addEventListener("keydown", keydown, false);
        document.addEventListener("keyup", keyup, false);
        currentColor = Palette.getSelected();
        return true;
    }

    function remove() {
        document.removeEventListener("colorChange", colorChange);
        document.removeEventListener("canvasDown", canvasDown);
        document.removeEventListener("canvasDrag", canvasDrag);
        document.removeEventListener("keydown", keydown);
        document.removeEventListener("keyup", keyup);
    }

    function toString() {
        return "Freehand";
    }

    return {
        "init": init,
        "remove": remove,
        "toString": toString,
        "uid": "freehand"
    };
}

function fillTool(editor) {
    "use strict";
    var currentColor;

    function colorChange(evt) {
        currentColor = evt.detail;
    }

    function simpleFill(blockX, blockY, targetColor) {
        var coord, block, queue;

        queue = [editor.getBlockCoord(blockX, blockY)];

        while (queue.length) {
            coord = queue.pop();
            block = editor.get(coord);
            if ((coord.isUpperHalf && (block.upperBlockColor === targetColor)) || (coord.isLowerHalf && (block.lowerBlockColor === targetColor))) {
                editor.setChunk(coord, currentColor);
                if (coord.blockX > 0) {
                    queue.push(editor.getBlockCoord(coord.blockX - 1, coord.blockY));
                }
                if (coord.blockX < 79) {
                    queue.push(editor.getBlockCoord(coord.blockX + 1, coord.blockY));
                }
                if (coord.blockX > 0) {
                    queue.push(editor.getBlockCoord(coord.blockX, coord.blockY - 1));
                }
                if (coord.blockX < editor.height * 2 - 1) {
                    queue.push(editor.getBlockCoord(coord.blockX, coord.blockY + 1));
                }
            }
        }
    }

    function canvasDown(evt) {
        var block, targetColor;
        block = editor.get(evt.detail);
        if (block.isBlocky) {
            targetColor = evt.detail.isUpperHalf ? block.upperBlockColor : block.lowerBlockColor;
            if (targetColor !== currentColor) {
                simpleFill(evt.detail.blockX, evt.detail.blockY, targetColor);
                editor.resolveConflicts(currentColor);
            }
        }
    }

    function init() {
        document.addEventListener("canvasDown", canvasDown, false);
        document.addEventListener("colorChange", colorChange, false);
        currentColor = Palette.getSelected();
        return true;
    }

    function remove() {
        document.removeEventListener("canvasDown", canvasDown);
        document.removeEventListener("colorChange", colorChange);
    }

    function toString() {
        return "Fill";
    }

    return {
        "init": init,
        "remove": remove,
        "toString": toString,
        "uid": "fill"
    };
}

function charBrushTool(name, editor, options) {
    "use strict";
    var currentColor, shiftDown, lastPoint, mode;

    mode = 0;

    function colorChange(evt) {
        currentColor = evt.detail;
    }

    function charLine(from, to) {
        editor.chunkLine(from, to, function (coord) {
            editor.setChar(options[mode].charCode, currentColor, coord);
            editor.resolveConflict(coord, currentColor);
        });
    }

    function canvasDown(evt) {
        if (shiftDown && lastPoint) {
            charLine(lastPoint, evt.detail);
        } else {
            editor.setChar(options[mode].charCode, currentColor, evt.detail);
            editor.resolveConflict(evt.detail, currentColor);
        }
        lastPoint = evt.detail;
    }

    function canvasDrag(evt) {
        charLine(lastPoint, evt.detail);
        lastPoint = evt.detail;
    }

    function keydown(evt) {
        switch (evt.keyCode || evt.which) {
        case 16:
            shiftDown = true;
            break;
        }
    }

    function keyup(evt) {
        switch (evt.keyCode || evt.which) {
        case 16:
            shiftDown = false;
            break;
        }
    }

    function init() {
        document.addEventListener("canvasDown", canvasDown, false);
        document.addEventListener("canvasDrag", canvasDrag, false);
        document.addEventListener("colorChange", colorChange, false);
        document.addEventListener("keydown", keydown, false);
        document.addEventListener("keyup", keyup, false);
        currentColor = Palette.getSelected();
        return true;
    }

    function remove() {
        document.removeEventListener("canvasDown", canvasDown);
        document.removeEventListener("canvasDrag", canvasDrag);
        document.removeEventListener("colorChange", colorChange);
        document.removeEventListener("keydown", keydown);
        document.addEventListener("keyup", keyup);
    }

    function modeChange() {
        if (++mode === options.length) {
            mode = 0;
        }
    }

    function toString() {
        return options.length ? name + ": " + options[mode].name : name;
    }

    return {
        "init": init,
        "remove": remove,
        "modeChange": modeChange,
        "toString": toString,
        "uid": "charbrush-" + name
    };
}

function clearTool(editor) {
    "use strict";

    function init() {
        var i;
        for (i = 0; i < editor.image.length; ++i) {
            editor.image[i] = 0;
        }
        editor.redraw();
        return false;
    }

    function toString() {
        return "Clear";
    }

    return {
        "init": init,
        "toString": toString,
        "uid": "clear"
    };
}

function exportTool(editor) {
    "use strict";

    function toDataURL(bytes) {
        return "data:application/octet-stream;base64," + btoa(String.fromCharCode.apply(null, bytes));
    }

    function highestRow(input) {
        reutu
    }

    function toBinFormat(input) {
        var output, inputIndex, outputIndex, highest, end;
        highest = 26;
        for (inputIndex = 0; inputIndex < input.length; inputIndex += 3) {
            if (input[inputIndex]) {
                highest = Math.max(Math.ceil(inputIndex / 240), highest);
            }
        }
        output = new Uint8Array((input.length / 3 * 2) + 11);
        output.set(new Uint8Array([88, 66, 73, 78, 26, 80, 0, highest, 0, 16, 0]), 0);
        for (inputIndex = 0, outputIndex = 11, end = highest * 80 * 3; inputIndex < end; inputIndex += 3, outputIndex += 2) {
            output[outputIndex] = input[inputIndex];
            output[outputIndex + 1] = input[inputIndex + 1] + (input[inputIndex + 2] << 4);
        }
        return output;
    }

    function removeLink() {
        var divExport;
        divExport = document.getElementById("export");
        if (divExport.firstChild) {
            divExport.removeChild(divExport.firstChild);
        }
    }

    function init() {
        var anchor;
        removeLink();
        anchor = createElement("a", {"href": toDataURL(toBinFormat(editor.image)), "onclick": removeLink, "textContent": "Download", "download": "ansiedit.xb"});
        document.getElementById("export").appendChild(anchor);
        return false;
    }

    function toString() {
        return "Export";
    }

    return {
        "init": init,
        "toString": toString,
        "uid": "export"
    };
}

document.addEventListener("DOMContentLoaded", function () {
    "use strict";
    var editor;
    editor = editorCanvas(100);
    editor.init(document.getElementById("editor"));
    Toolbar.addTool(freehandTool(editor), {"keyCode": 102, "symbol": "f"}).select();
    Toolbar.addTool(fillTool(editor), {"keyCode": 110, "symbol": "n"});
    Toolbar.addTool(charBrushTool("Shading", editor, [{"charCode": Codepage.LIGHT_SHADE, "name": "Light"}, {"charCode": Codepage.MEDIUM_SHADE, "name": "Medium"}, {"charCode": Codepage.DARK_SHADE, "name": "Dark"}]), {"keyCode": 115, "symbol": "s"});
    Toolbar.addTool(charBrushTool("Dot", editor, [{"charCode": Codepage.MIDDLE_DOT, "name": "Small"}, {"charCode": Codepage.BULLET_OPERATOR, "name": "Large"}]), {"keyCode": 100, "symbol": "d"});
    Toolbar.addTool(clearTool(editor));
    Toolbar.addTool(exportTool(editor), {"keyCode": 101, "symbol": "e"});
}, false);