function codepageGenerator(palette, retina) {
    "use strict";
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

    function getData(charCode, fgRGBA, bgRGBA, width, height, data, excludeNinthBit) {
        var fontBitWidth, rgbaOutput, i, j, k;
        fontBitWidth = width * height;
        rgbaOutput = new Uint8Array((excludeNinthBit ? width - 1 : width) * height * 4);
        for (i = 0, j = charCode * fontBitWidth, k = 0; i < fontBitWidth; ++i, ++j) {
            if (!excludeNinthBit || (i + 1) % 9 !== 0) {
                if (data[j]) {
                    rgbaOutput.set(fgRGBA, k);
                } else {
                    rgbaOutput.set(bgRGBA, k);
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
            bigFontBuffer[bufferIndex] = getData(charCode, palette.COLORS[fg], palette.COLORS[bg], 9, 16, FONT_80X25, true);
            if (retina) {
                bigFontBuffer[bufferIndex] = doubleScale(bigFontBuffer[bufferIndex], 8);
            }
        }
        return bigFontBuffer[bufferIndex];
    }

    function bigFontRGBA(charCode, rgba) {
        var data;
        data = getData(charCode, rgba, new Uint8Array([0, 0, 0, 0]), 9, 16, FONT_80X25, true);
        return retina ? doubleScale(data, 8) : data;
    }

    function smallFont(charCode, fg, bg) {
        var bufferIndex;
        bufferIndex = charCode + (fg << 8) + (bg << 12);
        if (!smallFontBuffer[bufferIndex]) {
            smallFontBuffer[bufferIndex] = getData(charCode, palette.COLORS[fg], palette.COLORS[bg], 4, 8, FONT_80X25_SMALL, false);
            if (!retina) {
                smallFontBuffer[bufferIndex] = scaleCanvas(smallFontBuffer[bufferIndex], 4, 8, 2, 2);
            }
        }
        return smallFontBuffer[bufferIndex];
    }

    return {
        "bigFont": bigFont,
        "bigFontRGBA": bigFontRGBA,
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
}

