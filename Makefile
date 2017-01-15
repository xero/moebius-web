public/scripts/minified.js: \
		public/scripts/network.js \
		public/scripts/core.js \
		public/scripts/freehand_tools.js \
		public/scripts/keyboard.js \
		public/scripts/ui.js \
		public/scripts/file.js \
		public/scripts/document_onload.js
	cat $^ | jsmin > $@

clean:
	rm public/scripts/minified.js
