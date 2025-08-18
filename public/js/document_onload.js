var worker;
var title;
var palette;
var font;
var textArtCanvas;
var cursor;
var selectionCursor;
var positionInfo;
var toolPreview;
var pasteTool;
var chat;
var sampleTool;

function $(divName) {
	"use strict";
	return document.getElementById(divName);
}
if(typeof(createWorkerHandler)==="undefined"){
	function createWorkerHandler(_){void _}
}
function createCanvas(width, height) {
	"use strict";
	const canvas = document.createElement("CANVAS");
	canvas.width = width;
	canvas.height = height;
	return canvas;
}

document.addEventListener("DOMContentLoaded", () => {
	"use strict";
	pasteTool = createPasteTool($("cut"), $("copy"), $("paste"), $("delete"));
	positionInfo = createPositionInfo($("position-info"));
	textArtCanvas = createTextArtCanvas($("canvas-container"), () => {
		selectionCursor = createSelectionCursor($("canvas-container"));
		cursor = createCursor($("canvas-container"));
		document.addEventListener("keydown", undoAndRedo);
		onClick($("new"), () => {
			if (confirm("All changes will be lost. Are you sure?") === true) {
				textArtCanvas.clear();
				textArtCanvas.clearXBData(); // Clear any embedded XB font/palette data
				$("sauce-title").value = "";
				$("sauce-group").value = "";
				$("sauce-author").value = "";
				updateFontDisplay(); // Update font display after clearing XB data
			}
		});
		onClick($("open"), () => {
			showOverlay($("open-overlay"));
		});
		onClick($("save-ansi"), Save.ans);
		onClick($("save-utf8"), Save.utf8);
		onClick($("save-bin"), Save.bin);
		onClick($("save-xbin"), Save.xb);
		onClick($("save-png"), Save.png);
		onClick($("cut"), pasteTool.cut);
		onClick($("copy"), pasteTool.copy);
		onClick($("paste"), pasteTool.paste);
		onClick($("system-paste"), pasteTool.systemPaste);
		onClick($("delete"), pasteTool.deleteSelection);
		onClick($("file-menu"), menuHover);
		onClick($("edit-menu"), menuHover);
		onClick($("view-menu"), menuHover);
		const palettePreview = createPalettePreview($("palette-preview"));
		const palettePicker = createPalettePicker($("palette-picker"));
		const iceColoursToggle = createSettingToggle($("ice-colors-toggle"), textArtCanvas.getIceColours, (newIceColours) => {
			textArtCanvas.setIceColours(newIceColours);
			// Broadcast ice colors change to other users if in collaboration mode
			if (worker && worker.sendIceColorsChange) {
				worker.sendIceColorsChange(newIceColours);
			}
		});
		const letterSpacingToggle = createSettingToggle($("letter-spacing-toggle"), () => {
			return font.getLetterSpacing();
		}, (newLetterSpacing) => {
			font.setLetterSpacing(newLetterSpacing);
			// Broadcast letter spacing change to other users if in collaboration mode
			if (worker && worker.sendLetterSpacingChange) {
				worker.sendLetterSpacingChange(newLetterSpacing);
			}
		});
		onFileChange($("open-file"), (file) => {
			Load.file(file, (columns, rows, imageData, iceColours, letterSpacing, fontName) => {
				const indexOfPeriod = file.name.lastIndexOf(".");
				if (indexOfPeriod !== -1) {
					title.setName(file.name.substr(0, indexOfPeriod));
				} else {
					title.setName(file.name);
				}

				// Apply font from SAUCE if available
				function applyData() {
					textArtCanvas.setImageData(columns, rows, imageData, iceColours, letterSpacing);
					iceColoursToggle.update();
					letterSpacingToggle.update();
					// Note: updateFontDisplay() will be called by onFontChange event for XB files
					if (!isXBFile) {
						updateFontDisplay(); // Only update font display for non-XB files
					}
					hideOverlay($("open-overlay"));
					$("open-file").value = "";
				}
				// Check if this is an XB file by file extension
				var isXBFile = file.name.toLowerCase().endsWith('.xb');

				if (fontName && !isXBFile) {
					// Only handle non-XB files here, as XB files handle font loading internally
					const appFontName = Load.sauceToAppFont(fontName.trim());
					if (appFontName) {
						textArtCanvas.setFont(appFontName, applyData);
						return; // Exit early since callback will be called from setFont
					}
				}

				applyData(); // Apply data without font change
			});
		});
		onClick($("open-cancel"), () => {
			hideOverlay($("open-overlay"));
		});
		onClick($("edit-sauce"), () => {
			showOverlay($("sauce-overlay"));
			keyboard.ignore();
			paintShortcuts.ignore();
			$("sauce-title").focus();
			freestyle.ignore();
			characterBrush.ignore();
		});
		onClick($("sauce-done"), () => {
			hideOverlay($("sauce-overlay"));
			keyboard.unignore();
			paintShortcuts.unignore();
			freestyle.unignore();
			characterBrush.unignore();
		});
		onReturn($("sauce-title"), $("sauce-done"));
		onReturn($("sauce-group"), $("sauce-done"));
		onReturn($("sauce-author"), $("sauce-done"));
		var paintShortcuts = createPaintShortcuts({
			"D": $("default-colour"),
			"Q": $("swap-colours"),
			"K": $("keyboard"),
			"F": $("freestyle"),
			"B": $("character-brush"),
			"N": $("fill"),
			"A": $("attrib"),
			"G": $("grid-toggle"),
			"M": $("mirror")
		});
		var keyboard = createKeyboardController();
		Toolbar.add($("keyboard"), () => {
			paintShortcuts.disable();
			keyboard.enable();
		}, () => {
			paintShortcuts.enable();
			keyboard.disable();
		}).enable();
		title = createTitleHandler($("artwork-title"), () => {
			keyboard.ignore();
			paintShortcuts.ignore();
			freestyle.ignore();
			characterBrush.ignore();
		}, () => {
			keyboard.unignore();
			paintShortcuts.unignore();
			freestyle.unignore();
			characterBrush.unignore();
		});
		onClick($("undo"), textArtCanvas.undo);
		onClick($("redo"), textArtCanvas.redo);
		onClick($("resize"), () => {
			showOverlay($("resize-overlay"));
			$("columns-input").value = textArtCanvas.getColumns();
			$("rows-input").value = textArtCanvas.getRows();
			keyboard.ignore();
			paintShortcuts.ignore();
			freestyle.ignore();
			characterBrush.ignore();
			$("columns-input").focus();
		});
		onClick($("resize-apply"), () => {
			const columnsValue = parseInt($("columns-input").value, 10);
			const rowsValue = parseInt($("rows-input").value, 10);
			if (!isNaN(columnsValue) && !isNaN(rowsValue)) {
				textArtCanvas.resize(columnsValue, rowsValue);
				// Broadcast resize to other users if in collaboration mode
				if (worker && worker.sendResize) {
					worker.sendResize(columnsValue, rowsValue);
				}
				hideOverlay($("resize-overlay"));
			}
			keyboard.unignore();
			paintShortcuts.unignore();
			freestyle.unignore();
			characterBrush.unignore();
		});
		onReturn($("columns-input"), $("resize-apply"));
		onReturn($("rows-input"), $("resize-apply"));
		onClick($("resize-cancel"), () => {
			hideOverlay($("resize-overlay"));
			keyboard.unignore();
			paintShortcuts.unignore();
			freestyle.unignore();
			characterBrush.unignore();
		});

		// Edit action menu items
		onClick($("insert-row"), keyboard.insertRow);
		onClick($("delete-row"), keyboard.deleteRow);
		onClick($("insert-column"), keyboard.insertColumn);
		onClick($("delete-column"), keyboard.deleteColumn);
		onClick($("erase-row"), keyboard.eraseRow);
		onClick($("erase-row-start"), keyboard.eraseToStartOfRow);
		onClick($("erase-row-end"), keyboard.eraseToEndOfRow);
		onClick($("erase-column"), keyboard.eraseColumn);
		onClick($("erase-column-start"), keyboard.eraseToStartOfColumn);
		onClick($("erase-column-end"), keyboard.eraseToEndOfColumn);

		onClick($("default-colour"), () => {
			palette.setForegroundColour(7);
			palette.setBackgroundColour(0);
		});
		onClick($("swap-colours"), () => {
			const tempForeground = palette.getForegroundColour();
			palette.setForegroundColour(palette.getBackgroundColour());
			palette.setBackgroundColour(tempForeground);
		});
		onClick($("palette-preview"), () => {
			const tempForeground = palette.getForegroundColour();
			palette.setForegroundColour(palette.getBackgroundColour());
			palette.setBackgroundColour(tempForeground);
		});
		// Function to update font display and dropdown
		function updateFontDisplay() {
			const currentFont = textArtCanvas.getCurrentFontName();
			$("current-font-display").textContent = currentFont;
			$("font-select").value = currentFont;
		}

		// Function to update font preview
		function updateFontPreview(fontName) {
			const previewInfo = $("font-preview-info");
			const previewImage = $("font-preview-image");
			if (!previewInfo || !previewImage) {return;}

			// Load font for preview
			if (fontName === "XBIN") {
				// Handle XB font preview - render embedded font if available
				if (textArtCanvas.getCurrentFontName() === "XBIN") {
					// Current font is XBIN, render the embedded font
					const fontWidth = font.getWidth();
					const fontHeight = font.getHeight();
					
					// Create a canvas to render the font preview
					const previewCanvas = createCanvas(fontWidth * 16, fontHeight * 16);
					const previewCtx = previewCanvas.getContext("2d");
					
					// Use white foreground on black background for clear visibility
					const foreground = 15; // White
					const background = 0;  // Black
					
					// Render all 256 characters in a 16x16 grid
					for (let y = 0, charCode = 0; y < 16; y++) {
						for (let x = 0; x < 16; x++, charCode++) {
							font.draw(charCode, foreground, background, previewCtx, x, y);
						}
					}
					
					// Update info and display the rendered font
					previewInfo.textContent = "XBIN (embedded font) " + fontWidth + "x" + fontHeight;
					previewImage.src = previewCanvas.toDataURL();
					previewImage.style.display = "block";
				} else {
					// No embedded font currently loaded
					previewInfo.textContent = "XBIN (embedded font - not currently loaded)";
					previewImage.style.display = "none";
					previewImage.src = "";
				}
			} else {
				// Load regular PNG font for preview
				const img = new Image();
				img.onload = function() {
					// Calculate font dimensions
					const fontWidth = img.width / 16;  // 16 characters per row
					const fontHeight = img.height / 16; // 16 rows
					
					// Update font info with name and size on same line
					previewInfo.textContent = fontName + " " + fontWidth + "x" + fontHeight;
					
					// Show the entire PNG font file
					previewImage.src = img.src;
					previewImage.style.display = "block";
				};
				
				img.onerror = function() {
					// Font loading failed
					previewInfo.textContent = fontName + " (not found)";
					previewImage.style.display = "none";
					previewImage.src = "";
				};
				
				img.src = "fonts/" + fontName + ".png";
			}
		}

		// Listen for font changes and update display
		document.addEventListener("onFontChange", updateFontDisplay);

		// Listen for palette changes and update palette picker
		document.addEventListener("onPaletteChange", () => {
			if (palettePicker && palettePicker.updatePalette) {
				palettePicker.updatePalette();
			}
		});

		onClick($("fonts"), () => {
			showOverlay($("fonts-overlay"));
			updateFontPreview($("font-select").value);
		});
		onClick($("current-font-display"), () => {
			showOverlay($("fonts-overlay"));
			updateFontPreview($("font-select").value);
		});
		onSelectChange($("font-select"), () => {
			// Only update preview, don't change the actual font yet
			updateFontPreview($("font-select").value);
		});
		onClick($("fonts-apply"), () => {
			const selectedFont = $("font-select").value;
			textArtCanvas.setFont(selectedFont, () => {
				updateFontDisplay();
				// Broadcast font change to other users if in collaboration mode
				if (worker && worker.sendFontChange) {
					worker.sendFontChange(selectedFont);
				}
				hideOverlay($("fonts-overlay"));
			});
		});
		onClick($("fonts-cancel"), () => {
			hideOverlay($("fonts-overlay"));
		});
		const grid = createGrid($("grid"));
		const gridToggle = createSettingToggle($("grid-toggle"), grid.isShown, grid.show);

		onClick($("zoom-toggle"), () => {
			showOverlay($("zoom-overlay"));
		});
		onClick($("zoom-done"), () => {
			hideOverlay($("zoom-overlay"));
		});
		onSelectChange($("xoom"), () => {
			document.querySelector("body").style.zoom=`${$("xoom").value}%`;
		});
		var freestyle = createFreehandController(createShadingPanel());
		Toolbar.add($("freestyle"), freestyle.enable, freestyle.disable);
		var characterBrush = createFreehandController(createCharacterBrushPanel());
		Toolbar.add($("character-brush"), characterBrush.enable, characterBrush.disable);
		const fill = createFillController();
		Toolbar.add($("fill"), fill.enable, fill.disable);
		const attributeBrush = createAttributeBrushController();
		Toolbar.add($("attrib"), attributeBrush.enable, attributeBrush.disable);
		const line = createLineController();
		Toolbar.add($("line"), line.enable, line.disable);
		const square = createSquareController();
		Toolbar.add($("square"), square.enable, square.disable);
		const circle = createCircleController();
		Toolbar.add($("circle"), circle.enable, circle.disable);
		toolPreview = createToolPreview($("tool-preview"));
		const selection = createSelectionTool($("canvas-container"));
		Toolbar.add($("selection"), () => {
			paintShortcuts.disable();
			selection.enable();
		}, () => {
			paintShortcuts.enable();
			selection.disable();
		});
		chat = createChatController($("chat-button"), $("chat-window"), $("message-window"), $("user-list"), $("handle-input"), $("message-input"), $("notification-checkbox"), () => {
			keyboard.ignore();
			paintShortcuts.ignore();
			freestyle.ignore();
			characterBrush.ignore();
		}, () => {
			keyboard.unignore();
			paintShortcuts.unignore();
			freestyle.unignore();
			characterBrush.unignore();
		});
		const chatToggle = createSettingToggle($("chat-toggle"), chat.isEnabled, chat.toggle);
		onClick($("chat-button"), chat.toggle);
		sampleTool = createSampleTool($("sample"), freestyle, $("freestyle"), characterBrush, $("character-brush"));
		Toolbar.add($("sample"), sampleTool.enable, sampleTool.disable);
		const mirrorToggle = createSettingToggle($("mirror"), textArtCanvas.getMirrorMode, textArtCanvas.setMirrorMode);
		worker = createWorkerHandler($("handle-input"));

		// Initialize font display
		updateFontDisplay();
	});
});
