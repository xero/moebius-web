// ES6 module imports
import { ElementHelper } from './elementhelper.js';
import { Load, Save } from './file.js';
import {
	createSettingToggle,
	onClick,
	onReturn,
	onFileChange,
	onSelectChange,
	createPositionInfo,
	showOverlay,
	hideOverlay,
	undoAndRedo,
	createPaintShortcuts,
	createGenericController,
	createToggleButton,
	createGrid,
	createToolPreview,
	menuHover,
	enforceMaxBytes,
	Toolbar
} from './ui.js';
import {
	createPalette,
	createDefaultPalette,
	createPalettePreview,
	createPalettePicker,
	loadImageAndGetImageData,
	loadFontFromXBData,
	loadFontFromImage,
	createTextArtCanvas,
	setSampleToolDependency
} from './core.js';
import {
	setToolDependencies,
	createPanelCursor,
	createFloatingPanelPalette,
	createFloatingPanel,
	createBrushController,
	createHalfBlockController,
	createShadingController,
	createShadingPanel,
	createCharacterBrushPanel,
	createFillController,
	createLineController,
	createSquareController,
	createShapesController,
	createCircleController,
	createAttributeBrushController,
	createSelectionTool,
	createSampleTool
} from './freehand_tools.js';
import { setChatDependency, createWorkerHandler, createChatController } from './network.js';
import {
	createFKeyShorcut,
	createFKeysShortcut,
	createCursor,
	createSelectionCursor,
	createKeyboardController,
	createPasteTool
} from './keyboard.js';
import { Loaders } from './loaders.js';
import { Savers } from './savers.js';

let worker;
let title;
let palette;
let font;
let textArtCanvas;
let cursor;
let selectionCursor;
let positionInfo;
let toolPreview;
let pasteTool;
let chat;
let sampleTool;

function $(divName) {
	"use strict";
	return document.getElementById(divName);
}
function $$(selector) {
	"use strict";
	return document.querySelector(selector);
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

document.addEventListener("DOMContentLoaded", async () => {
	"use strict";
	try {
		// Create global dependencies first (needed by core.js functions)
		palette = createDefaultPalette();
		window.palette = palette;
		window.createCanvas = createCanvas;
		window.$ = $;
		title = $('artwork-title');

		pasteTool = createPasteTool($("cut"), $("copy"), $("paste"), $("delete"));
		window.pasteTool = pasteTool;
		positionInfo = createPositionInfo($("position-info"));
		window.positionInfo = positionInfo;
		
		// Initialize canvas and wait for completion
		textArtCanvas = createTextArtCanvas($("canvas-container"), () => {
			window.textArtCanvas = textArtCanvas;
			font = window.font; // Assign the loaded font to the local variable
			selectionCursor = createSelectionCursor($("canvas-container"));
			window.selectionCursor = selectionCursor;
			cursor = createCursor($("canvas-container"));
			window.cursor = cursor;
			
			console.log("All dependencies initialized successfully!");
			
			// Continue with the rest of the initialization...
		document.addEventListener("keydown", undoAndRedo);
		onClick($("new"), () => {
			if (confirm("All changes will be lost. Are you sure?") === true) {
				textArtCanvas.clear();
				textArtCanvas.resize(80, 25);
				textArtCanvas.clearXBData(); // Clear any embedded XB font/palette data
				$("artwork-title").value = "untitled";
				$("sauce-title").value = "untitled";
				$("sauce-group").value = "";
				$("sauce-author").value = "";
				$("sauce-comments").value = "";
				$("sauce-bytes").value = "0/16320 bytes";
				updateFontDisplay(); // Update font display after clearing XB data
			}
		});
		onClick($("open"), () => {
			$('open-file').click();
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

		// edit menu
		onClick($("file-menu"), menuHover);
		onClick($("edit-menu"), menuHover);
		onClick($("nav-cut"), pasteTool.cut);
		onClick($("nav-copy"), pasteTool.copy);
		onClick($("nav-paste"), pasteTool.paste);
		onClick($("nav-system-paste"), pasteTool.systemPaste);
		onClick($("nav-delete"), pasteTool.deleteSelection);
		onClick($("nav-undo"), textArtCanvas.undo);
		onClick($("nav-redo"), textArtCanvas.redo);

		const palettePreview = createPalettePreview($("palette-preview"), palette);
		const palettePicker = createPalettePicker($("palette-picker"), palette);

		onFileChange($("open-file"), (file) => {
			Load.file(file, (columns, rows, imageData, iceColors, letterSpacing, fontName) => {
				const indexOfPeriod = file.name.lastIndexOf(".");
				let fileTitle;
				if (indexOfPeriod !== -1) {
					fileTitle = file.name.substr(0, indexOfPeriod);
				} else {
					fileTitle = file.name;
				}
				title.value = fileTitle;
				window.title = fileTitle;
				document.title = `text.0w.nz: ${fileTitle}`;

				// Apply font from SAUCE if available
				function applyData() {
					textArtCanvas.setImageData(columns, rows, imageData, iceColors, letterSpacing);
					navICE.update();
					nav9pt.update();
					// Note: updateFontDisplay() will be called by onFontChange event for XB files
					if (!isXBFile) {
						updateFontDisplay(); // Only update font display for non-XB files
					}
					palettePicker.updatePalette(); // ANSi
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
				palettePicker.updatePalette(); // XB
			});
		});
		onClick($("artwork-title"), () => {
			showOverlay($("sauce-overlay"));
			keyboard.ignore();
			paintShortcuts.ignore();
			$("sauce-title").focus();
			shadeBrush.ignore(); characterBrush.ignore();
		});

		onClick($("sauce-done"), () => {
			$('artwork-title').value = title.value;
			window.title = title.value;
			hideOverlay($("sauce-overlay"));
			keyboard.unignore();
			paintShortcuts.unignore();
			shadeBrush.unignore();
			characterBrush.unignore();
		});
		onClick($("sauce-cancel"), () => {
			hideOverlay($("sauce-overlay"));
			keyboard.unignore();
			paintShortcuts.unignore();
			shadeBrush.unignore();
			characterBrush.unignore();
		});
		$('sauce-comments').addEventListener('input', enforceMaxBytes);
		onReturn($("sauce-title"), $("sauce-done"));
		onReturn($("sauce-group"), $("sauce-done"));
		onReturn($("sauce-author"), $("sauce-done"));
		onReturn($("sauce-comments"), $("sauce-done"));
		var paintShortcuts = createPaintShortcuts({
			"D": $("default-color"),
			"Q": $("swap-colors"),
			"K": $("keyboard"),
			"F": $("brushes"),
			"B": $("character-brush"),
			"N": $("fill"),
			"A": $("attrib"),
			"G": $("navGrid"),
			"M": $("mirror")
		});
		var keyboard = createKeyboardController(palette);
		Toolbar.add($("keyboard"), () => {
			paintShortcuts.disable();
			keyboard.enable();
			$('keyboard-toolbar').classList.remove('hide');
		}, () => {
			paintShortcuts.enable();
			keyboard.disable();
			$('keyboard-toolbar').classList.add('hide');
		}).enable();
		onClick($("undo"), textArtCanvas.undo);
		onClick($("redo"), textArtCanvas.redo);
		onClick($("resolution"), () => {
			showOverlay($("resize-overlay"));
			$("columns-input").value = textArtCanvas.getColumns();
			$("rows-input").value = textArtCanvas.getRows();
			keyboard.ignore();
			paintShortcuts.ignore();
			shadeBrush.ignore();
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
				$('resolution-label').innerText = `${columnsValue}x${rowsValue}`;
			}
			keyboard.unignore();
			paintShortcuts.unignore();
			shadeBrush.unignore();
			characterBrush.unignore();
		});
		onReturn($("columns-input"), $("resize-apply"));
		onReturn($("rows-input"), $("resize-apply"));
		onClick($("resize-cancel"), () => {
			hideOverlay($("resize-overlay"));
			keyboard.unignore();
			paintShortcuts.unignore();
			shadeBrush.unignore();
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

		onClick($("default-color"), () => {
			palette.setForegroundColor(7);
			palette.setBackgroundColor(0);
		});
		onClick($("swap-colors"), () => {
			const tempForeground = palette.getForegroundColor();
			palette.setForegroundColor(palette.getBackgroundColor());
			palette.setBackgroundColor(tempForeground);
		});
		onClick($("palette-preview"), () => {
			const tempForeground = palette.getForegroundColor();
			palette.setForegroundColor(palette.getBackgroundColor());
			palette.setBackgroundColor(tempForeground);
		});

		const navICE= createSettingToggle($("navICE"), textArtCanvas.getIceColors, (newIceColors) => {
			textArtCanvas.setIceColors(newIceColors);
			// Broadcast ice colors change to other users if in collaboration mode
			if (worker && worker.sendIceColorsChange) {
				worker.sendIceColorsChange(newIceColors);
			}
		});
		const nav9pt = createSettingToggle($("nav9pt"), () => {
			return font.getLetterSpacing();
		}, (newLetterSpacing) => {
			font.setLetterSpacing(newLetterSpacing);
			// Broadcast letter spacing change to other users if in collaboration mode
			if (worker && worker.sendLetterSpacingChange) {
				worker.sendLetterSpacingChange(newLetterSpacing);
			}
		});

		// Function to update font display and dropdown
		function updateFontDisplay() {
			const currentFont = textArtCanvas.getCurrentFontName();
			$$("#current-font-display kbd").textContent = currentFont.replace(/\s\d+x\d+$/, '');
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
		document.addEventListener("onPaletteChange", e => {
			if (palettePicker && palettePicker.newPalette) {
				palettePicker.newPalette(e.detail);
			}
			if (palettePreview && palettePreview.newPalette) {
				palettePreview.newPalette(e.detail);
			}
		});

		onClick($('current-font-display'), () => {
			$('fonts').click();
		});

		onClick($("change-font"), () => {
			showOverlay($("fonts-overlay"));
			keyboard.ignore();
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
				keyboard.unignore();
			});
		});
		onClick($("fonts-cancel"), () => {
			hideOverlay($("fonts-overlay"));
		});
		const grid = createGrid($("grid"));
		createSettingToggle($("navGrid"), grid.isShown, grid.show);

		// Initialize toolPreview and dependencies early
		toolPreview = createToolPreview($("tool-preview"));

		// Initialize dependencies for all tools that require them
		setToolDependencies({ toolPreview, palette, textArtCanvas });

		var brushes = createBrushController();
		Toolbar.add($("brushes"), brushes.enable, brushes.disable);
		var halfblock = createHalfBlockController();
		Toolbar.add($("halfblock"), halfblock.enable, halfblock.disable);
		var shadeBrush = createShadingController(createShadingPanel(), false);
		Toolbar.add($("shading-brush"), shadeBrush.enable, shadeBrush.disable);
		var characterBrush = createShadingController(createCharacterBrushPanel(), true);
		Toolbar.add($("character-brush"), characterBrush.enable, characterBrush.disable);
		const fill = createFillController();
		Toolbar.add($("fill"), fill.enable, fill.disable);
		const attributeBrush = createAttributeBrushController();
		Toolbar.add($("attrib"), attributeBrush.enable, attributeBrush.disable);
		const shapes = createShapesController();

		Toolbar.add($("shapes"), shapes.enable, shapes.disable);
		const line = createLineController();
		Toolbar.add($("line"), line.enable, line.disable);
		const square = createSquareController();
		Toolbar.add($("square"), square.enable, square.disable);
		const circle = createCircleController();
		Toolbar.add($("circle"), circle.enable, circle.disable);
		const fonts = createGenericController($('font-toolbar'),$('fonts'));

		Toolbar.add($('fonts'), fonts.enable, fonts.disable);
		const clipboard = createGenericController($('clipboard-toolbar'),$('clipboard'));
		Toolbar.add($('clipboard'), clipboard.enable, clipboard.disable);

		const selection = createSelectionTool($("canvas-container"));
		Toolbar.add($("selection"), () => {
			paintShortcuts.disable();
			selection.enable();
		}, () => {
			paintShortcuts.enable();
			selection.disable();
		});

		// Initialize chat before creating network handler
		chat = createChatController($("chat-button"), $("chat-window"), $("message-window"), $("user-list"), $("handle-input"), $("message-input"), $("notification-checkbox"), () => {
			keyboard.ignore();
			paintShortcuts.ignore();
			shadeBrush.ignore();
			characterBrush.ignore();
		}, () => {
			keyboard.unignore();
			paintShortcuts.unignore();
			shadeBrush.unignore();
			characterBrush.unignore();
		});

		// Initialize chat dependency for network functions
		setChatDependency(chat);
		const chatToggle = createSettingToggle($("chat-button"), chat.isEnabled, chat.toggle);
		sampleTool = createSampleTool($("sample"), shadeBrush, $("shading-brush"), characterBrush, $("character-brush"));
		Toolbar.add($("sample"), sampleTool.enable, sampleTool.disable);

		// Initialize sampleTool dependency for core.js
		setSampleToolDependency(sampleTool);
		createSettingToggle($("mirror"), textArtCanvas.getMirrorMode, textArtCanvas.setMirrorMode);
		worker = createWorkerHandler($("handle-input"));

		// Initialize font display
		updateFontDisplay();

		window.worker = worker;
		});
	} catch (error) {
		console.error("Error during initialization:", error);
		// Handle initialization failure gracefully
		alert("Failed to initialize the application. Please refresh the page.");
	}
});

// ES6 module exports
export {
	$,
	createCanvas,
	createWorkerHandler,
	worker,
	title,
	palette,
	font,
	textArtCanvas,
	cursor,
	selectionCursor,
	positionInfo,
	toolPreview,
	pasteTool,
	chat,
	sampleTool
};
