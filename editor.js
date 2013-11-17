function editorCanvas(height, retina) {
    "use strict";
    var palette, codepage, canvas, ctx, previewCanvas, previewCtx, imageData, previewImageData, image, undoQueue, overlays;

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

    palette = (function () {
        var COLORS, paletteCanvas, lastColor, currentColor;

        function egaRGB(value) {
            return new Uint8Array([
                (((value & 32) >> 5) + ((value & 4) >> 1)) * 0x55,
                (((value & 16) >> 4) + ((value & 2))) * 0x55,
                (((value & 8) >> 3) + ((value & 1) << 1)) * 0x55,
                255
            ]);
        }

        COLORS = [0, 1, 2, 3, 4, 5, 20, 7, 56, 57, 58, 59, 60, 61, 62, 63].map(egaRGB);
        paletteCanvas = createElement("canvas", {"width": retina ? 320 : 160, "height": retina ? 320 : 160, "style": {"width": "160px", "height": "160px", "verticalAlign": "bottom"}});

        function styleRGBA(rgba) {
            return "rgba(" + rgba[0] + ", " + rgba[1] + ", " + rgba[2] + ", " + rgba[3] + ")";
        }

        function setColor(col) {
            var paletteCtx;
            if (col !== currentColor) {
                lastColor = currentColor;
                paletteCtx = paletteCanvas.getContext("2d");
                paletteCtx.fillStyle = styleRGBA(COLORS[col]);
                paletteCtx.fillRect(0, paletteCanvas.height / 2, paletteCanvas.width, paletteCanvas.height / 2);
                currentColor = col;
                paletteCanvas.dispatchEvent(new CustomEvent("colorChange", {"detail": currentColor}));
            }
        }

        function keydown(evt) {
            var keyCode, modifier;
            keyCode = evt.keyCode || evt.which;
            modifier = evt.metaKey || evt.altKey || evt.ctrlKey;
            if (!modifier) {
                if (keyCode >= 49 && keyCode <= 56) {
                    evt.preventDefault();
                    setColor(keyCode - 49 + (evt.shiftKey ? 8 : 0));
                } else {
                    switch (keyCode) {
                    case 9:
                        evt.preventDefault();
                        if (lastColor !== undefined) {
                            setColor(lastColor);
                        }
                        break;
                    case 81:
                        evt.preventDefault();
                        setColor((currentColor === 0) ? 15 : currentColor - 1);
                        break;
                    case 87:
                        evt.preventDefault();
                        setColor((currentColor === 15) ? 0 : currentColor + 1);
                        break;
                    }
                }
            }
        }

        function init() {
            var divPalette, paletteCtx, i;

            divPalette = document.getElementById("palette");
            paletteCtx = paletteCanvas.getContext("2d");
            for (i = 0; i < 16; ++i) {
                paletteCtx.fillStyle = styleRGBA(COLORS[i]);
                paletteCtx.fillRect((i % 8) * paletteCanvas.width / 8, (i < 8) ? paletteCanvas.height / 4 : 0, paletteCanvas.width / 8, paletteCanvas.height / 4);
            }
            paletteCanvas.onclick = function (evt) {
                var x, y, col;
                x = evt.clientX - document.getElementById("toolkit").offsetLeft;
                y = evt.clientY - divPalette.offsetTop;
                col = (1 - Math.floor(y / 40)) * 8 + Math.floor(x / 20);
                if (col >= 0) {
                    setColor(col);
                }
            };
            setColor(7);
            divPalette.appendChild(paletteCanvas);

            document.addEventListener("keydown", keydown, false);
        }

        function getCurrentColor() {
            return currentColor;
        }

        return {
            "init": init,
            "COLORS": COLORS,
            "canvas": paletteCanvas,
            "getCurrentColor": getCurrentColor
        };
    }());

    codepage = (function () {
        var BASE64_CHARS, FONT_80X25, FONT_80X25_SMALL, bigFontBuffer, smallFontBuffer, NULL, SPACE, UPPER_HALF_BLOCK, LOWER_HALF_BLOCK, LEFT_HALF_BLOCK, RIGHT_HALF_BLOCK, LIGHT_SHADE, MEDIUM_SHADE, DARK_SHADE, FULL_BLOCK, BULLET_OPERATOR, MIDDLE_DOT, NO_BREAK_SPACE;

        NULL = 0;
        SPACE = 32;
        UPPER_HALF_BLOCK = 223;
        LOWER_HALF_BLOCK = 220;
        LEFT_HALF_BLOCK = 221;
        RIGHT_HALF_BLOCK = 222;
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
                        rgbaOutput.set(palette.COLORS[fg], k);
                    } else {
                        rgbaOutput.set(palette.COLORS[bg], k);
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
                if (retina) {
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
                if (!retina) {
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
            "LEFT_HALF_BLOCK": LEFT_HALF_BLOCK,
            "RIGHT_HALF_BLOCK": RIGHT_HALF_BLOCK,
            "LIGHT_SHADE": LIGHT_SHADE,
            "MEDIUM_SHADE": MEDIUM_SHADE,
            "DARK_SHADE": DARK_SHADE,
            "FULL_BLOCK": FULL_BLOCK,
            "BULLET_OPERATOR": BULLET_OPERATOR,
            "MIDDLE_DOT": MIDDLE_DOT,
            "NO_BREAK_SPACE": NO_BREAK_SPACE,
            "fontWidth": retina ? 16 : 8,
            "fontHeight": retina ? 32 : 16
        };
    }());

    canvas = createElement("canvas", {"width": retina ? 1280 : 640, "height": retina ? height * 32 : height * 16, "style": {"width": "640px", "height": (height * 16) + "px", "verticalAlign": "bottom"}});
    ctx = canvas.getContext("2d");
    previewCanvas = createElement("canvas", {"width": retina ? 320 : 160, "height": retina ? height * 8 : height * 4, "style": {"width": "160px", "height": (height * 4) + "px", "verticalAlign": "bottom"}});
    previewCtx = previewCanvas.getContext("2d");
    imageData = ctx.createImageData(retina ? 16 : 8, retina ? 32 : 16);
    previewImageData = ctx.createImageData(retina ? 4 : 2, retina ? 8 : 4);
    image = new Uint8Array(80 * height * 3);
    undoQueue = [];
    overlays = {};

    function draw(charCode, x, y, fg, bg) {
        previewImageData.data.set(codepage.smallFont(charCode, fg, bg), 0);
        imageData.data.set(codepage.bigFont(charCode, fg, bg), 0);
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
        undoQueue[0].push([image[index], image[index + 1], image[index + 2], index]);
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
        case codepage.NULL:
        case codepage.SPACE:
        case codepage.NO_BREAK_SPACE:
            upperBlockColor = background;
            lowerBlockColor = background;
            isBlocky = true;
            break;
        case codepage.UPPER_HALF_BLOCK:
            upperBlockColor = foreground;
            lowerBlockColor = background;
            isBlocky = true;
            break;
        case codepage.LOWER_HALF_BLOCK:
            upperBlockColor = background;
            lowerBlockColor = foreground;
            isBlocky = true;
            break;
        case codepage.FULL_BLOCK:
            upperBlockColor = foreground;
            lowerBlockColor = foreground;
            isBlocky = true;
            break;
        default:
            if (foreground === background) {
                isBlocky = true;
                upperBlockColor = foreground;
                lowerBlockColor = foreground;
            } else {
                isBlocky = false;
            }
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
                    set(codepage.FULL_BLOCK, color, block.background, coord.index);
                } else {
                    set(codepage.UPPER_HALF_BLOCK, color, block.lowerBlockColor, coord.index);
                }
            } else {
                if (block.upperBlockColor === color) {
                    set(codepage.FULL_BLOCK, color, block.background, coord.index);
                } else {
                    set(codepage.LOWER_HALF_BLOCK, color, block.upperBlockColor, coord.index);
                }
            }
        } else {
            if (coord.isUpperHalf) {
                set(codepage.UPPER_HALF_BLOCK, color, block.background, coord.index);
            } else {
                set(codepage.LOWER_HALF_BLOCK, color, block.background, coord.index);
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

    function resolveConflict(coord, currentColorBias) {
        var block, currentColor;
        block = get(coord);
        currentColor = palette.getCurrentColor();
        if (block.background > 7) {
            if (block.isBlocky) {
                if (block.foreground > 7) {
                    if (currentColorBias) {
                        if (block.upperBlockColor === currentColor && block.lowerBlockColor === currentColor) {
                            set(codepage.FULL_BLOCK, currentColor, 0, coord.index);
                        } else if (block.upperBlockColor === currentColor) {
                            set(codepage.UPPER_HALF_BLOCK, block.upperBlockColor, block.lowerBlockColor - 8, coord.index);
                        } else if (block.lowerBlockColor === currentColor) {
                            set(codepage.LOWER_HALF_BLOCK, block.lowerBlockColor, block.upperBlockColor - 8, coord.index);
                        } else {
                            set(image[coord.index], block.foreground, block.background - 8, coord.index);
                        }
                    } else {
                        if (block.upperBlockColor === currentColor && block.lowerBlockColor === currentColor) {
                            set(codepage.FULL_BLOCK, currentColor, 0, coord.index);
                        } else if (block.upperBlockColor === currentColor) {
                            set(codepage.LOWER_HALF_BLOCK, block.lowerBlockColor, block.upperBlockColor - 8, coord.index);
                        } else if (block.lowerBlockColor === currentColor) {
                            set(codepage.UPPER_HALF_BLOCK, block.upperBlockColor, block.lowerBlockColor - 8, coord.index);
                        } else {
                            set(image[coord.index], block.foreground, block.background - 8, coord.index);
                        }
                    }
                } else {
                    if ((block.upperBlockColor === block.background) && (block.lowerBlockColor === block.background)) {
                        set(codepage.FULL_BLOCK, block.background, block.foreground, coord.index);
                    } else if (block.upperBlockColor === block.background) {
                        set(codepage.UPPER_HALF_BLOCK, block.background, block.foreground, coord.index);
                    } else if (block.lowerBlockColor === block.background) {
                        set(codepage.LOWER_HALF_BLOCK, block.background, block.foreground, coord.index);
                    } else {
                        set(codepage.FULL_BLOCK, block.foreground, block.background - 8, coord.index);
                    }
                }
            } else {
                set(image[coord.index], block.foreground, block.background - 8, coord.index);
            }
        }
    }

    function resolveConflicts(currentColorBias) {
        var i;
        for (i = 0; i < image.length; i += 3) {
            resolveConflict({"textX": (i / 3) % 80, "textY": Math.floor(i / 240), "index": i}, currentColorBias);
        }
    }

    function init(divEditor) {
        var mousedown, shiftKey, altKey;

        mousedown = false;
        shiftKey = false;
        altKey = false;

        palette.init();
        redraw();

        function getCoord(pageX, pageY) {
            var x, y, coord;

            x = pageX - divEditor.offsetLeft;
            y = pageY - divEditor.offsetTop;
            coord = getBlockCoord(Math.floor(x / 8), Math.floor(y / 8));
            coord.x = x;
            coord.y = y;
            coord.shiftKey = shiftKey;
            coord.altKey = altKey;

            return coord;
        }

        divEditor.addEventListener("mousedown", function (evt) {
            mousedown = true;
            canvas.dispatchEvent(new CustomEvent("canvasDown", {"detail": getCoord(evt.pageX, evt.pageY)}));
        }, false);

        divEditor.addEventListener("mouseup", function () {
            mousedown = false;
        }, false);

        divEditor.addEventListener("mousemove", function (evt) {
            canvas.dispatchEvent(new CustomEvent(mousedown ? "canvasDrag" : "canvasMove", {"detail": getCoord(evt.pageX, evt.pageY)}));
        }, false);

        document.addEventListener("keydown", function (evt) {
            switch (evt.keyCode || evt.which) {
            case 16:
                shiftKey = true;
                break;
            case 18:
                altKey = true;
                break;
            }
        }, false);

        document.addEventListener("keyup", function (evt) {
            switch (evt.keyCode || evt.which) {
            case 16:
                shiftKey = false;
                break;
            case 18:
                altKey = false;
                break;
            }
        }, false);

        canvas.style.position = "absolute";
        canvas.style.left = "0px";
        canvas.style.top = "0px";

        divEditor.appendChild(canvas);
        document.getElementById("preview").appendChild(previewCanvas);
    }

    function undo() {
        var values, i;
        if (undoQueue.length) {
            values = undoQueue.shift();
            for (i = values.length - 1; i >= 0; --i) {
                image[values[i][3]] = values[i][0];
                image[values[i][3] + 1] = values[i][1];
                image[values[i][3] + 2] = values[i][2];
                update(values[i][3]);
            }
        }
    }

    function takeUndoSnapshot() {
        if (undoQueue.unshift([]) > 32) {
            undoQueue.pop();
        }
    }

    function clearUndoHistory() {
        while (undoQueue.length) {
            undoQueue.pop();
        }
    }

    function removeOverlay(uid) {
        document.getElementById("editor").removeChild(overlays[uid]);
        delete overlays[uid];
    }

    function addOverlay(overlayCanvas, uid) {
        if (overlays[uid]) {
            removeOverlay(uid);
        }
        overlayCanvas.style.position = "absolute";
        overlayCanvas.style.left = "0px";
        overlayCanvas.style.top = "0px";
        document.getElementById("editor").appendChild(overlayCanvas);
        overlays[uid] = overlayCanvas;
    }

    return {
        "init": init,
        "canvas": canvas,
        "retina": retina,
        "addOverlay": addOverlay,
        "removeOverlay": removeOverlay,
        "height": height,
        "palette": palette,
        "codepage": codepage,
        "set": set,
        "get": get,
        "getBlockCoord": getBlockCoord,
        "setChunk": setChunk,
        "chunkLine": chunkLine,
        "setChar": setChar,
        "resolveConflict": resolveConflict,
        "resolveConflicts": resolveConflicts,
        "redraw": redraw,
        "image": image,
        "takeUndoSnapshot": takeUndoSnapshot,
        "clearUndoHistory": clearUndoHistory,
        "undo": undo
    };
}