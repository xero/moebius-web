var LZ77 = (function () {
    "use strict";

    function put32BitNumber(value, array, index) {
        array[index] = value & 0xff;
        array[index + 1] = (value >> 8) & 0xff;
        array[index + 2] = (value >> 16) & 0xff;
        array[index + 3] = value >> 24;
    }

    function put16BitNumber(value, array, index) {
        array[index] = value & 0xff;
        array[index + 1] = (value >> 8) & 0xff;
    }

    function compress(bytes, pointerLengthWidth) {
        var compressedBytes, pointerPos, tempPointerPos, outputPointer, pointerLength, tempPointerLength, compressedPointer, outputSize, codingPos, outputLookaheadRef, lookBehind, lookAhead, pointerPosMax, pointerLengthMax;

        if (bytes.length <= 11) {
            return undefined;
        }

        compressedBytes = new Uint8Array(bytes.length);

        pointerPosMax = Math.pow(2, 16 - pointerLengthWidth);
        pointerLengthMax = Math.pow(2, pointerLengthWidth);

        put32BitNumber(bytes.length, compressedBytes, 0);
        compressedBytes[4] = pointerLengthWidth;

        for (codingPos = 0, compressedPointer = 5, outputSize = 5; codingPos < bytes.length; codingPos += 1) {
            pointerPos = 0;
            pointerLength = 0;
            for (tempPointerPos = 1; (tempPointerPos < pointerPosMax) && (tempPointerPos <= codingPos); tempPointerPos += 1) {
                lookBehind = codingPos - tempPointerPos;
                lookAhead = codingPos;
                for (tempPointerLength = 0; bytes[lookAhead] === bytes[lookBehind]; tempPointerLength += 1, lookAhead += 1, lookBehind += 1) {
                    if (tempPointerLength === pointerLengthMax) {
                        break;
                    }
                }
                if (tempPointerLength > pointerLength) {
                    pointerPos = tempPointerPos;
                    pointerLength = tempPointerLength;
                    if (pointerLength === pointerLengthMax) {
                        break;
                    }
                }
            }
            codingPos += pointerLength;
            if ((codingPos === bytes.length) && (pointerLength > 0)) {
                if (pointerLength === 1) {
                    outputPointer = 0;
                } else {
                    outputPointer = (pointerPos << pointerLengthWidth) | (pointerLength - 2);
                }
                outputLookaheadRef = codingPos - 1;
            } else {
                outputPointer = pointerPos << pointerLengthWidth;
                if (pointerLength > 0) {
                    outputPointer |= pointerLength - 1;
                }
                outputLookaheadRef = codingPos;
            }
            if (outputSize + 3 >= bytes.length) {
                return undefined;
            }
            put16BitNumber(outputPointer, compressedBytes, compressedPointer);
            compressedPointer += 2;
            compressedBytes[compressedPointer] = bytes[outputLookaheadRef];
            compressedPointer += 1;
            outputSize += 3;
        }

        return compressedBytes.subarray(0, outputSize);
    }

    function get32BitNumber(array, index) {
        return array[index] + (array[index + 1] << 8) + (array[index + 2] << 16) + (array[index + 3] << 24);
    }

    function get16BitNumber(array, index) {
        return array[index] + (array[index + 1] << 8);
    }

    function decompress(bytes) {
        var pointerLengthWidth, inputPointer, pointerLength, pointerPos, pointerLengthMask, compressedPointer, codingPos, pointerOffset, decompressedSize, decompressedBytes;

        decompressedSize = get32BitNumber(bytes, 0);
        decompressedBytes = new Uint8Array(decompressedSize);
        pointerLengthWidth = bytes[4];
        compressedPointer = 5;
        pointerLengthMask = Math.pow(2, pointerLengthWidth) - 1;

        for (codingPos = 0; codingPos < decompressedSize; codingPos += 1) {
            inputPointer = get16BitNumber(bytes, compressedPointer);
            compressedPointer += 2;
            pointerPos = inputPointer >> pointerLengthWidth;
            if (pointerPos > 0) {
                pointerLength = (inputPointer & pointerLengthMask) + 1;
            } else {
                pointerLength = 0;
            }
            if (pointerPos) {
                for (pointerOffset = codingPos - pointerPos; pointerLength > 0; pointerLength -= 1) {
                    decompressedBytes[codingPos] = decompressedBytes[pointerOffset];
                    codingPos += 1;
                    pointerOffset += 1;
                }
            }
            decompressedBytes[codingPos] = bytes[compressedPointer];
            compressedPointer += 1;
        }

        return decompressedBytes;
    }

    return {
        "compress": compress,
        "decompress": decompress
    };
}());
