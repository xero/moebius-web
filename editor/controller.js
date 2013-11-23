var AnsiEditController;

document.addEventListener("DOMContentLoaded", function () {
    "use strict";
    AnsiEditController = (function () {
        var retina, palette, codepage, preview, editor, toolbar;

        function loadTool(src, onload, onerror) {
            var script;
            script = document.createElement("script");
            script.addEventListener("onerror", onerror, false);
            script.onload = onload;
            script.onerror = onerror;
            script.src = src;
            document.head.appendChild(script);
        }

        function loadTools(urls) {
            var i;
            i = 0;
            (function next() {
                loadTool(urls[i], function () {
                    if (++i < urls.length) {
                        next();
                    }
                }, function (evt) {
                    console.log(evt);
                    if (++i < urls.length) {
                        next();
                    }
                });
            }());
        }

        function addTool(callback, shortcut, name, options) {
            toolbar.addTool(callback(toolbar, options, name), shortcut);
        }

        retina = window.devicePixelRatio > 1;
        palette = paletteWidget(retina);
        codepage = codepageGenerator(palette, retina);
        preview = previewCanvas(100, codepage, retina);
        editor = editorCanvas(100, palette, false, preview, codepage, retina);
        toolbar = toolbarWidget(palette, codepage, preview, editor, retina);

        preview.init(document.getElementById("preview"));
        editor.init(document.getElementById("editor"));
        toolbar.init();

        loadTools([
            "tools/freehand.js?" + Math.random(),
            "tools/shading.js?" + Math.random(),
            "tools/verticalblock.js?" + Math.random(),
            "tools/extendedbrush.js?" + Math.random(),
            "tools/text.js?" + Math.random(),
            "tools/brighten.js?" + Math.random(),
            "tools/darken.js?" + Math.random(),
            "tools/mirror.js?" + Math.random(),
            "tools/fill.js?" + Math.random(),
            "tools/colorbrush.js?" + Math.random(),
            "tools/grid.js?" + Math.random(),
            "tools/undo.js?" + Math.random(),
            "tools/clear.js?" + Math.random(),
            "tools/load.js?" + Math.random(),
            "tools/save.js?" + Math.random(),
            "tools/info.js?" + Math.random()
        ]);

        return {
            "addTool": addTool
        };
    }());
});