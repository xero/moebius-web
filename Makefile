local-test:
	sleep 1 && open -a "Google Chrome" "http://localhost:8080/"
	python -m SimpleHTTPServer 8080

build:
	cat scripts/elementhelper.js scripts/lz77.js scripts/loaders.js scripts/savers.js editor/toolbar.js editor/modal.js editor/codepage.js editor/editor.js editor/title.js tools/charbrush.js > temp.js
	jsmin <temp.js >lib.js
	cat tools/fontbrush.js tools/freehand.js tools/line.js tools/shading.js tools/verticalblock.js tools/smudge.js tools/text.js tools/box.js tools/ellipse.js tools/shiftcolor.js tools/mirror.js tools/fill.js tools/colorreplacement.js tools/createbrush.js tools/custombrush.js tools/flipbrushx.js tools/flipbrushy.js tools/grid.js tools/showinvisibles.js tools/undo.js tools/reference.js tools/palette.js tools/shadedpalette.js tools/icecolors.js tools/resizecanvas.js tools/load.js tools/save.js tools/saveasxbin.js tools/saveasansi.js tools/editsauce.js tools/clear.js tools/loadbrush.js tools/savebrush.js tools/loadfont.js tools/savefont.js tools/changefont.js tools/loadpalette.js tools/savepalette.js tools/changepalette.js tools/exportpng.js tools/info.js tools/preview.js tools/smallpalettepreview.js > temp.js
	jsmin <temp.js >tools.js
	rm temp.js

.PHONY: local-test build
