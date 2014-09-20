function changeFontTool(editor, toolbar) {
    "use strict";
    var currrentFontName, fontGroups, fontOptions;

    currrentFontName = "CP437 8x16";

    fontGroups = [
        {
            "name": "acorn",
            "label": "Acorn"
        },
        {
            "name": "amiga",
            "label": "Commodore Amiga"
        },
        {
            "name": "atari",
            "label": "Atari"
        },
        {
            "name": "becta",
            "label": "\u0412\u0435\u0441\u0442\u0430"
        },
        {
            "name": "canon",
            "label": "Canon"
        },
        {
            "name": "c16",
            "label": "Commodore 16"
        },
        {
            "name": "c64",
            "label": "Commodore 64"
        },
        {
            "name": "c65",
            "label": "Commodore 65"
        },
        {
            "name": "c128",
            "label": "Commodore 128"
        },
        {
            "name": "galaksija",
            "label": "Galaksija"
        },
        {
            "name": "hitachi",
            "label": "Hitachi"
        },
        {
            "name": "ibmpc_arabic",
            "label": "IBM PC, Arabic"
        },
        {
            "name": "ibmpc_baltic_rim",
            "label": "IBM PC, Baltic Rim"
        },
        {
            "name": "ibmpc_central_european",
            "label": "IBM PC, Central European"
        },
        {
            "name": "ibmpc_cyrillic",
            "label": "IBM PC, Cyrillic"
        },
        {
            "name": "ibmpc_french_canadian",
            "label": "IBM PC, French Canadian"
        },
        {
            "name": "ibmpc_greek",
            "label": "IBM PC, Greek"
        },
        {
            "name": "ibmpc_hebrew",
            "label": "IBM PC, Hebrew"
        },
        {
            "name": "ibmpc_icelandic",
            "label": "IBM PC, Icelandic"
        },
        {
            "name": "ibmpc_multilingual",
            "label": "IBM PC, Multilingual"
        },
        {
            "name": "ibmpc_nordic",
            "label": "IBM PC, Nordic"
        },
        {
            "name": "ibmpc_original",
            "label": "IBM PC, Original"
        },
        {
            "name": "ibmpc_portuguese",
            "label": "IBM PC, Portuguese"
        },
        {
            "name": "ibmpc_turkish",
            "label": "IBM PC, Turkish"
        },
        {
            "name": "ibmpc_western_european",
            "label": "IBM PC, Western European"
        },
        {
            "name": "aquarius",
            "label": "Mattel Aquarius"
        },
        {
            "name": "msx",
            "label": "MSX"
        },
        {
            "name": "orao",
            "label": "Orao"
        },
        {
            "name": "pet",
            "label": "Commodore PET"
        },
        {
            "name": "phillipsvg",
            "label": "Phillips VG"
        },
        {
            "name": "robotron",
            "label": "Robotron"
        },
        {
            "name": "sam",
            "label": "Sam Coupé"
        },
        {
            "name": "sgi",
            "label": "SGI"
        },
        {
            "name": "sharp",
            "label": "Sharp"
        },
        {
            "name": "vic20",
            "label": "Commodore VIC-20"
        },
        {
            "name": "zx",
            "label": "ZX Spectrum & Clones"
        }
    ];

    fontOptions = [
        {
            "value": "Acorn Electron 8x8",
            "textContent": "Acorn Electron (8x8)",
            "fontGroup": "acorn"
        },
        {
            "value": "BBC Model B 128 8x8",
            "textContent": "BBC Model B 128 (8x8)",
            "fontGroup": "acorn"
        },
        {
            "value": "BBC Model B 8x8",
            "textContent": "BBC Model B (8x8)",
            "fontGroup": "acorn"
        },
        {
            "value": "BBC Model B Plus 8x8",
            "textContent": "BBC Model B Plus (8x8)",
            "fontGroup": "acorn"
        },
        {
            "value": "b-strict 8x16",
            "textContent": "b-strict (8x16)",
            "fontGroup": "amiga"
        },
        {
            "value": "b-struct 8x16",
            "textContent": "b-struct (8x16)",
            "fontGroup": "amiga"
        },
        {
            "value": "MicroKnight 8x16",
            "textContent": "MicroKnight (8x16)",
            "fontGroup": "amiga"
        },
        {
            "value": "MicroKnight+ 8x16",
            "textContent": "MicroKnight+ (8x16)",
            "fontGroup": "amiga"
        },
        {
            "value": "mO'sOul 8x16",
            "textContent": "mO'sOul (8x16)",
            "fontGroup": "amiga"
        },
        {
            "value": "P0t-NOoDLE 8x16",
            "textContent": "P0t-NOoDLE (8x16)",
            "fontGroup": "amiga"
        },
        {
            "value": "SystemX Amiga Emulation 8x16",
            "textContent": "SystemX Amiga Emulation (8x16)",
            "fontGroup": "amiga"
        },
        {
            "value": "Topaz 500 8x16",
            "textContent": "Topaz 500 (8x16)",
            "fontGroup": "amiga"
        },
        {
            "value": "Topaz+ 500 8x16",
            "textContent": "Topaz+ 500 (8x16)",
            "fontGroup": "amiga"
        },
        {
            "value": "Topaz 1200 8x16",
            "textContent": "Topaz 1200 (8x16)",
            "fontGroup": "amiga"
        },
        {
            "value": "Topaz+ 1200 8x16",
            "textContent": "Topaz+ 1200 (8x16)",
            "fontGroup": "amiga"
        },
        {
            "value": "Atari 400 & 800 8x8",
            "textContent": "Atari 400 & 800 (8x8)",
            "fontGroup": "atari"
        },
        {
            "value": "PK8000 Vesta 8x8",
            "textContent": "PK8000 Vesta (8x8)",
            "fontGroup": "becta"
        },
        {
            "value": "Canon X07 8x8",
            "textContent": "Canon X07 (8x16)",
            "fontGroup": "canon"
        },
        {
            "value": "C16 8x8",
            "textContent": "C16 (8x8)",
            "fontGroup": "c16"
        },
        {
            "value": "C16 Hungarian 8x8",
            "textContent": "C16 Hungarian (8x8)",
            "fontGroup": "c16"
        },
        {
            "value": "C64 Lower 8x8",
            "textContent": "C64 Lower (8x8)",
            "fontGroup": "c64"
        },
        {
            "value": "C64 Upper 8x8",
            "textContent": "C64 Upper (8x8)",
            "fontGroup": "c64"
        },
        {
            "value": "C64 German Lower 8x8",
            "textContent": "C64 German Lower (8x8)",
            "fontGroup": "c64"
        },
        {
            "value": "C64 German Upper 8x8",
            "textContent": "C64 German Upper (8x8)",
            "fontGroup": "c64"
        },
        {
            "value": "C64 Hungarian Lower 8x8",
            "textContent": "C64 Hungarian Lower (8x8)",
            "fontGroup": "c64"
        },
        {
            "value": "C64 Hungarian Upper 8x8",
            "textContent": "C64 Hungarian Upper (8x8)",
            "fontGroup": "c64"
        },
        {
            "value": "C64 Swedish 1 Lower 8x8",
            "textContent": "C64 Swedish 1 Lower (8x8)",
            "fontGroup": "c64"
        },
        {
            "value": "C64 Swedish 1 Upper 8x8",
            "textContent": "C64 Swedish 1 Upper (8x8)",
            "fontGroup": "c64"
        },
        {
            "value": "C64 Swedish 2 Lower 8x8",
            "textContent": "C64 Swedish 2 Lower (8x8)",
            "fontGroup": "c64"
        },
        {
            "value": "C64 Swedish 2 Upper 8x8",
            "textContent": "C64 Swedish 2 Upper (8x8)",
            "fontGroup": "c64"
        },
        {
            "value": "C65 Lower 1 8x8",
            "textContent": "C65 Lower 1 (8x8)",
            "fontGroup": "c65"
        },
        {
            "value": "C65 Lower 2 8x8",
            "textContent": "C65 Lower 2 (8x8)",
            "fontGroup": "c65"
        },
        {
            "value": "C65 Upper 8x8",
            "textContent": "C65 Upper (8x8)",
            "fontGroup": "c65"
        },
        {
            "value": "C128 Lower 1 8x8",
            "textContent": "C128 Lower 1 (8x8)",
            "fontGroup": "c128"
        },
        {
            "value": "C128 Lower 2 8x8",
            "textContent": "C128 Lower 2 (8x8)",
            "fontGroup": "c128"
        },
        {
            "value": "C128 Upper 8x8",
            "textContent": "C128 Upper (8x8)",
            "fontGroup": "c128"
        },
        {
            "value": "Galaksija 8x13",
            "textContent": "Galaksija (8x13)",
            "fontGroup": "galaksija"
        },
        {
            "value": "Hitachi MB-6880 8x8",
            "textContent": "Hitachi MB-6880 (8x8)",
            "fontGroup": "hitachi"
        },
        {
            "value": "CP864 8x8",
            "textContent": "Codepage 864 (8x8)",
            "fontGroup": "ibmpc_arabic"
        },
        {
            "value": "CP864 8x14",
            "textContent": "Codepage 864 (8x14)",
            "fontGroup": "ibmpc_arabic"
        },
        {
            "value": "CP864 8x16",
            "textContent": "Codepage 864 (8x16)",
            "fontGroup": "ibmpc_arabic"
        },
        {
            "value": "CP775 8x8",
            "textContent": "Codepage 775 (8x8)",
            "fontGroup": "ibmpc_baltic_rim"
        },
        {
            "value": "CP775 8x14",
            "textContent": "Codepage 775 (8x14)",
            "fontGroup": "ibmpc_baltic_rim"
        },
        {
            "value": "CP775 8x16",
            "textContent": "Codepage 775 (8x16)",
            "fontGroup": "ibmpc_baltic_rim"
        },
        {
            "value": "CP852 8x8",
            "textContent": "Codepage 852 (8x8)",
            "fontGroup": "ibmpc_central_european"
        },
        {
            "value": "CP852 8x14",
            "textContent": "Codepage 852 (8x14)",
            "fontGroup": "ibmpc_central_european"
        },
        {
            "value": "CP852 8x16",
            "textContent": "Codepage 852 (8x16)",
            "fontGroup": "ibmpc_central_european"
        },
        {
            "value": "CP852 8x19",
            "textContent": "Codepage 852 (8x19)",
            "fontGroup": "ibmpc_central_european"
        },
        {
            "value": "CP855 8x8",
            "textContent": "Codepage 855 (8x8)",
            "fontGroup": "ibmpc_cyrillic"
        },
        {
            "value": "CP855 8x14",
            "textContent": "Codepage 855 (8x14)",
            "fontGroup": "ibmpc_cyrillic"
        },
        {
            "value": "CP855 8x16",
            "textContent": "Codepage 855 (8x16)",
            "fontGroup": "ibmpc_cyrillic"
        },
        {
            "value": "CP866 8x8",
            "textContent": "Codepage 866 (8x8)",
            "fontGroup": "ibmpc_cyrillic"
        },
        {
            "value": "CP866 8x14",
            "textContent": "Codepage 866 (8x14)",
            "fontGroup": "ibmpc_cyrillic"
        },
        {
            "value": "CP866 8x16",
            "textContent": "Codepage 866 (8x16)",
            "fontGroup": "ibmpc_cyrillic"
        },
        {
            "value": "CP863 8x8",
            "textContent": "Codepage 863 (8x8)",
            "fontGroup": "ibmpc_french_canadian"
        },
        {
            "value": "CP863 8x14",
            "textContent": "Codepage 863 (8x14)",
            "fontGroup": "ibmpc_french_canadian"
        },
        {
            "value": "CP863 8x16",
            "textContent": "Codepage 863 (8x16)",
            "fontGroup": "ibmpc_french_canadian"
        },
        {
            "value": "CP863 8x19",
            "textContent": "Codepage 863 (8x19)",
            "fontGroup": "ibmpc_french_canadian"
        },
        {
            "value": "CP737 8x8",
            "textContent": "Codepage 737 (8x8)",
            "fontGroup": "ibmpc_greek"
        },
        {
            "value": "CP737 8x14",
            "textContent": "Codepage 737 (8x14)",
            "fontGroup": "ibmpc_greek"
        },
        {
            "value": "CP737 8x16",
            "textContent": "Codepage 737 (8x16)",
            "fontGroup": "ibmpc_greek"
        },
        {
            "value": "CP851 8x8",
            "textContent": "Codepage 851 (8x8)",
            "fontGroup": "ibmpc_greek"
        },
        {
            "value": "CP851 8x14",
            "textContent": "Codepage 851 (8x14)",
            "fontGroup": "ibmpc_greek"
        },
        {
            "value": "CP851 8x16",
            "textContent": "Codepage 851 (8x16)",
            "fontGroup": "ibmpc_greek"
        },
        {
            "value": "CP851 8x19",
            "textContent": "Codepage 851 (8x19)",
            "fontGroup": "ibmpc_greek"
        },
        {
            "value": "CP869 8x8",
            "textContent": "Codepage 869 (8x8)",
            "fontGroup": "ibmpc_greek"
        },
        {
            "value": "CP869 8x14",
            "textContent": "Codepage 869 (8x14)",
            "fontGroup": "ibmpc_greek"
        },
        {
            "value": "CP869 8x16",
            "textContent": "Codepage 869 (8x16)",
            "fontGroup": "ibmpc_greek"
        },
        {
            "value": "CP862 8x8",
            "textContent": "Codepage 862 (8x8)",
            "fontGroup": "ibmpc_hebrew"
        },
        {
            "value": "CP862 8x14",
            "textContent": "Codepage 862 (8x14)",
            "fontGroup": "ibmpc_hebrew"
        },
        {
            "value": "CP862 8x16",
            "textContent": "Codepage 862 (8x16)",
            "fontGroup": "ibmpc_hebrew"
        },
        {
            "value": "CP861 8x8",
            "textContent": "Codepage 861 (8x8)",
            "fontGroup": "ibmpc_icelandic"
        },
        {
            "value": "CP861 8x14",
            "textContent": "Codepage 861 (8x14)",
            "fontGroup": "ibmpc_icelandic"
        },
        {
            "value": "CP861 8x16",
            "textContent": "Codepage 861 (8x16)",
            "fontGroup": "ibmpc_icelandic"
        },
        {
            "value": "CP861 8x19",
            "textContent": "Codepage 861 (8x19)",
            "fontGroup": "ibmpc_icelandic"
        },
        {
            "value": "CP853 8x8",
            "textContent": "Codepage 853 (8x8)",
            "fontGroup": "ibmpc_multilingual"
        },
        {
            "value": "CP853 8x14",
            "textContent": "Codepage 853 (8x14)",
            "fontGroup": "ibmpc_multilingual"
        },
        {
            "value": "CP853 8x16",
            "textContent": "Codepage 853 (8x16)",
            "fontGroup": "ibmpc_multilingual"
        },
        {
            "value": "CP853 8x19",
            "textContent": "Codepage 853 (8x19)",
            "fontGroup": "ibmpc_multilingual"
        },
        {
            "value": "CP865 8x8",
            "textContent": "Codepage 865 (8x8)",
            "fontGroup": "ibmpc_nordic"
        },
        {
            "value": "CP865 8x14",
            "textContent": "Codepage 865 (8x14)",
            "fontGroup": "ibmpc_nordic"
        },
        {
            "value": "CP865 8x16",
            "textContent": "Codepage 865 (8x16)",
            "fontGroup": "ibmpc_nordic"
        },
        {
            "value": "CP865 8x19",
            "textContent": "Codepage 865 (8x19)",
            "fontGroup": "ibmpc_nordic"
        },
        {
            "value": "CP437 8x8",
            "textContent": "Codepage 437 (8x8)",
            "fontGroup": "ibmpc_original"
        },
        {
            "value": "CP437 8x14",
            "textContent": "Codepage 437 (8x14)",
            "fontGroup": "ibmpc_original"
        },
        {
            "value": "CP437 8x16",
            "textContent": "Codepage 437 (8x16) - Default",
            "fontGroup": "ibmpc_original"
        },
        {
            "value": "CP437 8x19",
            "textContent": "Codepage 437 (8x19)",
            "fontGroup": "ibmpc_original"
        },
        {
            "value": "CP860 8x8",
            "textContent": "Codepage 860 (8x8)",
            "fontGroup": "ibmpc_portuguese"
        },
        {
            "value": "CP860 8x14",
            "textContent": "Codepage 860 (8x14)",
            "fontGroup": "ibmpc_portuguese"
        },
        {
            "value": "CP860 8x16",
            "textContent": "Codepage 860 (8x16)",
            "fontGroup": "ibmpc_portuguese"
        },
        {
            "value": "CP860 8x19",
            "textContent": "Codepage 860 (8x19)",
            "fontGroup": "ibmpc_portuguese"
        },
        {
            "value": "CP857 8x8",
            "textContent": "Codepage 857 (8x8)",
            "fontGroup": "ibmpc_turkish"
        },
        {
            "value": "CP857 8x14",
            "textContent": "Codepage 857 (8x14)",
            "fontGroup": "ibmpc_turkish"
        },
        {
            "value": "CP857 8x16",
            "textContent": "Codepage 857 (8x16)",
            "fontGroup": "ibmpc_turkish"
        },
        {
            "value": "CP850 8x8",
            "textContent": "Codepage 850 (8x8)",
            "fontGroup": "ibmpc_western_european"
        },
        {
            "value": "CP850 8x14",
            "textContent": "Codepage 850 (8x14)",
            "fontGroup": "ibmpc_western_european"
        },
        {
            "value": "CP850 8x16",
            "textContent": "Codepage 850 (8x16)",
            "fontGroup": "ibmpc_western_european"
        },
        {
            "value": "CP850 8x19",
            "textContent": "Codepage 850 (8x19)",
            "fontGroup": "ibmpc_western_european"
        },
        {
            "value": "Aquarius 8x8",
            "textContent": "Aquarius (8x8)",
            "fontGroup": "aquarius"
        },
        {
            "value": "MSX Brazilian 8x8",
            "textContent": "MSX Brazilian (8x8)",
            "fontGroup": "msx"
        },
        {
            "value": "MSX Cyrillic 8x8",
            "textContent": "MSX Cyrillic (8x8)",
            "fontGroup": "msx"
        },
        {
            "value": "Orao 8x8",
            "textContent": "Orao (8x8)",
            "fontGroup": "orao"
        },
        {
            "value": "PET 1 8x8",
            "textContent": "PET 1 (8x8)",
            "fontGroup": "pet"
        },
        {
            "value": "PET 2 8x8",
            "textContent": "PET 2 (8x8)",
            "fontGroup": "pet"
        },
        {
            "value": "PET Greek 8x8",
            "textContent": "PET Greek (8x8)",
            "fontGroup": "pet"
        },
        {
            "value": "PET Norwegian 8x8",
            "textContent": "PET Norwegian (8x8)",
            "fontGroup": "pet"
        },
        {
            "value": "PET Russian 8x8",
            "textContent": "PET Russian (8x8)",
            "fontGroup": "pet"
        },
        {
            "value": "PET Swedish 8x8",
            "textContent": "PET Swedish (8x8)",
            "fontGroup": "pet"
        },
        {
            "value": "SuperPET Lower 8x8",
            "textContent": "SuperPET Lower (8x8)",
            "fontGroup": "pet"
        },
        {
            "value": "SuperPET Swedish Lower 8x8",
            "textContent": "SuperPET Swedish Lower (8x8)",
            "fontGroup": "pet"
        },
        {
            "value": "SuperPET Swedish Upper 8x8",
            "textContent": "SuperPET Swedish Upper (8x8)",
            "fontGroup": "pet"
        },
        {
            "value": "SuperPET Upper 8x8",
            "textContent": "SuperPET Upper (8x8)",
            "fontGroup": "pet"
        },
        {
            "value": "Philips VG 5000 8x10",
            "textContent": "Philips VG 5000 (8x10)",
            "fontGroup": "phillipsvg"
        },
        {
            "value": "Robotron Z 9001 8x8",
            "textContent": "Robotron Z 9001 (8x8)",
            "fontGroup": "robotron"
        },
        {
            "value": "Robotron Z 9001 German 8x8",
            "textContent": "Robotron Z 9001 German (8x8)",
            "fontGroup": "robotron"
        },
        {
            "value": "Robotron Z 9001 International 8x8",
            "textContent": "Robotron Z 9001 International (8x8)",
            "fontGroup": "robotron"
        },
        {
            "value": "SAM Coupé 8x8",
            "textContent": "SAM Coupé (8x8)",
            "fontGroup": "sam"
        },
        {
            "value": "SGI IRIS 3130 8x16",
            "textContent": "SGI IRIS 3130 (8x16)",
            "fontGroup": "sgi"
        },
        {
            "value": "SGI IRIS 4D 8x16",
            "textContent": "SGI IRIS 4D (8x16)",
            "fontGroup": "sgi"
        },
        {
            "value": "Sharp MZ-80a 8x8",
            "textContent": "Sharp MZ-80a (8x8)",
            "fontGroup": "sharp"
        },
        {
            "value": "VIC-20 Lower 8x8",
            "textContent": "VIC-20 Lower (8x8)",
            "fontGroup": "vic20"
        },
        {
            "value": "VIC-20 Upper 8x8",
            "textContent": "VIC-20 Upper (8x8)",
            "fontGroup": "vic20"
        },
        {
            "value": "VIC-20 German Lower 8x8",
            "textContent": "VIC-20 German Lower (8x8)",
            "fontGroup": "vic20"
        },
        {
            "value": "VIC-20 German Upper 8x8",
            "textContent": "VIC-20 German Upper (8x8)",
            "fontGroup": "vic20"
        },
        {
            "value": "VIC-20 Japanese Lower 8x8",
            "textContent": "VIC-20 Japanese Lower (8x8)",
            "fontGroup": "vic20"
        },
        {
            "value": "VIC-20 Japanese Upper 8x8",
            "textContent": "VIC-20 Japanese Upper (8x8)",
            "fontGroup": "vic20"
        },
        {
            "value": "VIC-20 Norwegian Lower 8x8",
            "textContent": "VIC-20 Norwegian Lower (8x8)",
            "fontGroup": "vic20"
        },
        {
            "value": "VIC-20 Norwegian Upper 8x8",
            "textContent": "VIC-20 Norwegian Upper (8x8)",
            "fontGroup": "vic20"
        },
        {
            "value": "VIC-20 Swedish Lower 8x8",
            "textContent": "VIC-20 Swedish Lower (8x8)",
            "fontGroup": "vic20"
        },
        {
            "value": "VIC-20 Swedish Upper 8x8",
            "textContent": "VIC-20 Swedish Upper (8x8)",
            "fontGroup": "vic20"
        },
        {
            "value": "Pentagon 128k 1990 8x8",
            "textContent": "Pentagon 128k 1990 (8x8)",
            "fontGroup": "zx"
        },
        {
            "value": "Pentagon 128k 1991 8x8",
            "textContent": "Pentagon 128k 1991 (8x8)",
            "fontGroup": "zx"
        },
        {
            "value": "Pentagon 128k 1993 8x8",
            "textContent": "Pentagon 128k 1993 (8x8)",
            "fontGroup": "zx"
        },
        {
            "value": "Pentagon 128k Dynaelectronics 8x8",
            "textContent": "Pentagon 128k Dynaelectronics (8x8)",
            "fontGroup": "zx"
        },
        {
            "value": "Pentagon 128k sos89r 8x8",
            "textContent": "Pentagon 128k sos89r (8x8)",
            "fontGroup": "zx"
        },
        {
            "value": "ZX ASZMIC 8x8",
            "textContent": "ZX ASZMIC (8x8)",
            "fontGroup": "zx"
        },
        {
            "value": "ZX Evolution 8x8",
            "textContent": "ZX Evolution (8x8)",
            "fontGroup": "zx"
        },
        {
            "value": "ZX Spectrum 8x8",
            "textContent": "ZX Spectrum (8x8)",
            "fontGroup": "zx"
        },
        {
            "value": "ZX Spectrum Blitz 8x8",
            "textContent": "ZX Spectrum Blitz (8x8)",
            "fontGroup": "zx"
        },
        {
            "value": "ZX80 8x8",
            "textContent": "ZX80 (8x8)",
            "fontGroup": "zx"
        },
        {
            "value": "ZX81 8x8",
            "textContent": "ZX81 (8x8)",
            "fontGroup": "zx"
        }
    ];

    editor.addCustomEventListener("change-font", function (fontName) {
        currrentFontName = fontName;
    });

    function init() {
        var modal, divContainer, fontSelector, groups, optGroups;

        function dismiss() {
            toolbar.modalEnd("change-font");
            modal.remove();
            editor.startListening();
            toolbar.startListening();
        }

        modal = modalBox();

        groups = [];
        optGroups = {};
        fontGroups.forEach(function (group) {
            groups.push(group.name);
            optGroups[group.name] = ElementHelper.create("optgroup", {"label": group.label});
        });
        fontOptions.forEach(function (option) {
            var optionElement;
            if (optGroups[option.fontGroup] !== undefined) {
                optionElement = ElementHelper.create("option", {"value": option.value, "textContent": option.textContent});
                if (currrentFontName === option.value) {
                    optionElement.selected = "true";
                }
                optGroups[option.fontGroup].appendChild(optionElement);
            }
        });
        fontSelector = ElementHelper.create("select");
        switch (currrentFontName) {
        case "custom_image":
            fontSelector.appendChild(ElementHelper.create("option", {"value": "custom_image", "textContent": "Custom Font (loaded from an image file)", "selected": "true"}));
            break;
        case "custom_xbin":
            fontSelector.appendChild(ElementHelper.create("option", {"value": "custom_xbin", "textContent": "Custom Font (included within an XBin file)", "selected": "true"}));
            break;
        }
        groups.forEach(function (group) {
            fontSelector.appendChild(optGroups[group]);
        });
        divContainer = ElementHelper.create("div", {"className": "input-container change-font"});
        divContainer.appendChild(fontSelector);
        modal.addPanel(divContainer);

        modal.addButton("default", {"textContent": "Change Font", "href": "#", "onclick": function (evt) {
            evt.preventDefault();
            if (fontSelector.value !== "custom") {
                Loaders.loadFont("fonts/" + fontSelector.value + ".png", function (font) {
                    currrentFontName = fontSelector.value;
                    editor.setFont(font.width, font.height, font.bytes);
                });
            }
            dismiss();
        }});

        modal.addButton("cancel", {"textContent": "Cancel", "href": "#", "onclick": function (evt) {
            evt.preventDefault();
            dismiss();
        }});

        editor.stopListening();
        toolbar.stopListening();
        modal.init();

        return false;
    }

    function toString() {
        return "Change Font";
    }

    function getState() {
        var bytes, i;
        bytes = new Uint8Array(currrentFontName.length);
        for (i = 0; i < currrentFontName.length; i += 1) {
            bytes[i] = currrentFontName.charCodeAt(i);
        }
        return bytes;
    }

    function setState(bytes) {
        var i;
        currrentFontName = "";
        for (i = 0; i < bytes.length; i += 1) {
            currrentFontName += String.fromCharCode(bytes[i]);
        }
    }

    return {
        "init": init,
        "toString": toString,
        "uid": "change-font",
        "isModal": true,
        "getState": getState,
        "setState": setState
    };
}

AnsiEditController.addTool(changeFontTool, "tools-left");