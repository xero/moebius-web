Demonstration available at [http://andyherbert.github.io/ansiedit/](http://andyherbert.github.io/ansiedit/).

# Changing colors:

Keys '1' to '8' will choose the first eight colors without the bold-bit set, holding shift down while making the selection will choose from the highlighted palette. Alternatively, hitting the same key again will select the same color from the highlighted palette range.  
The 'q' and 'w' keys will cycle through all sixteen colors in descending, and ascending order respectively. The ordering will loop endlessly.  
Pressing the 'tab' key will change back to the previously selected color, assuming one was already chosen, hitting 'tab' again will change back. This switching can be performed as many times as required.

# Freehand ('f'):

Freehand mode enables 'half block' characters to be used as large pixels. Since only eight colors can be used for the background in 'blink mode', if two 'half blocks' are drawn on the same text-character space with the bold-shifted palette, then the editor assumes the current color takes precedence and shifts the other color sharing the same space to the lower-palette. Pressing 'alt', or 'option', reverses this precedence, and any other colors sharing the same space with be favored instead.  
Holding shift whilst clicking on the canvas will create a straight line using 'half block' pixels from the last drawing position.

# Line ('l'):

Allows a line to be drawn between two points, but unlike pressing 'shift' with the freehand tool this gives an immediate preview. Pressing 'alt' or 'option' has the same effect here as the freehand tool, namely any attribute clashes will favour the other, conflicting color.

# Shading ('s'):

Reselecting the option will cycle through the light, medium, and dark varieties of shading.  
Usage is similar to freehand mode, including using the 'shift' key to draw straight lines.  
When choosing the area to shade the background color is chosen from the area directly under the cursor, and this includes 'half-block' pixels. For instance, if a single text-character has a different color in both the upper and lower half of the glyph, then clicking on either the top of the bottom of the glyph will choose a different background color for shading.  
Attribute conflicts are resolved by shifting the background color to the lower palette.

# Vertical Block ('v'):

Toggles between left and right-handed vertical blocks, operates in the same way as shading mode.

# Extended Brush ('e'):

Allows a selected character from the extended-ASCII set to be used as a brush, as with the other modes this also supports drawing with straight lines, as well as fixing any attribute conflicts.  
Pressing the F1 to F10 keys will quickly select light shade, medium shade, dark shade, full, upper, lower, left, right, middle, and dot blocks respectively.

# Clone Brush ('comma'):

Once a text block has been selected by using the 'alt' or 'option' key, it can then be used as a brush anywhere else on the image. Holding down ctrl whilst dragging the mouse will clone the text character immediately underneath the pointer when the drag operation is started, effectively 'smearing' the text character over the canvas.

# Image Stamp ('p'):

Allows an pre-defined image to be cloned on the canvas. Pressing 'alt' or 'option' whilst using this tool will ignore any alpha channel in the stamp.

See also '[Load Image Stamp](#loadimagestamp)', '[Save Image Stamp](#saveimagestamp)', and '[Copy](#copy)'.

# Text ('t'):

Clicking anywhere on the cursor will place a cursor, text can then be entered directly via the keyboard. To escape from text-entry mode, press 'alt' or 'option' and enter.

# Box ('x'):

Draws a rectangle. Pressing 'alt' or 'option' will favour the non-current color in the case of an attribute clash. Pressing 'shift' whilst starting the drag operation will fill the rectangle with the current color, otherwise just the border will be visible.

# Ellipse ('i'):

Draws an ellipse. Pressing 'alt' or 'option' will favour the non-current color in the case of an attribute clash. Pressing 'shift' whilst starting the drag operation will fill the ellipse with the current color, otherwise just the border will be visible.

# Brighten ('b'):

Brightens the half-block, or the foreground color of the text-character directly underneath the cursor. Pressing 'alt' or 'option' key whilst painting will preserve the brightness-status of any other half block sharing the same text character.

# Darken ('d'):

Darkens the half-block, or the foreground color of the text-character directly underneath the cursor.

# Mirror ('m'):

Mirrors the drawing activity in the opposing side of the screen.

# Fill ('n'):

Fill mode operates in a similar way to most paint packages, although it will only operates on text-characters that are only one single color, or are upper and lower 'half-block' characters.  
When conflicts arise with two highlighted colors sharing the same text-character then the editor corrects this by giving the fill color precedence and shifting the other color to the lower-palette, as with the freehand mode, this is reversed by pressing the 'alt' or 'option' key.

# Attribute Brush ('a'):

Changes the foreground attribute of the text-character immediately underneath the pointer to the currently selected color.  
If 'alt' or 'option' is held down whilst using this tool then the background color is changed instead; the color is automatically shifted to the lower palette if a conflict is detected.

<a name="copy"></a>

# Copy ('c'):

With 'copy', a selection from the canvas can be made which may then be used as an image stamp to copy entire text-characters on the canvas. Character codes set to `NULL` will be interpreted as an alpha channel. Pressing the 'alt' or 'option' key will replace the selection with `NULL` values after the selection is made.

# Flip Horizontally ('['):

Flips a selection horizontally. Also changes vertical-left blocks to vertical-right blocks, and vice versa, in the process.

# Flip Vertically (']'):

Flips a selection vertically. Also changes lower-half blocks to upper half blocks, and vice versa, in the process.

# Grid mode ('g'):

Turns on and off, and toggles between, two different types of grids, 'Light' and 'Dark'. The light grid is has higher visibility on darker backgrounds, but less pronounced on lighter backgrounds. The opposite is true for the dark grid.

# Reference ('g'):

Sets the opacity for the reference image used on the background of the canvas.

See also '[Load Reference Image](#loadreferenceimage)'.

# Undo ('z'):

Reverses the previous operation, can be repeated consecutively a maximum of 1000 times.

# Shaded Palette ('space'):

Allows a light, medium, or dark-shaded block to be selected immediately based on the currently selected color.

# Load:

Allows an ANSi, XBin, or image file to be loaded by dragging and dropping a file on to the browser.

# Save:

Provides a link to a file containing ANSi escape sequences.

See also '[Changing the default filename](#changedefaultfilename)'.

# Clear:

Resets the canvas to the initial state. All un-saved work will be lost.

<a name="loadimagestamp"></a>

# Load Image Stamp:

Loads an ANSi, XBin, or image file, which can be used as a stamp using the 'Image Stamp' tool. A pair of vertical pixels represent one character. Transparency is preserved, and the palette of the source image is reduced to its nearest match. Character codes set to `NULL` will be interpreted as an alpha channel for textmode art.

<a name="saveimagestamp"></a>

# Save Image Stamp:

Saves an XBin file based on the current selection for the 'Image Stamp' tool.

See also '[Changing the default filename](#changedefaultfilename)'.

<a name="loadreferenceimage"></a>

# Load Reference Image:

Loads an image file use for the background of the canvas.

# Export as PNG:

Saves a PNG image of the current canvas.

See also '[Changing the default filename](#changedefaultfilename)'.

# Information:

Displays information on the text-character currently under the mouse cursor whilst editing.

<a name="changedefaultfilename"></a>

# Changing the Default Filename:

By default, all files with be named 'ansiedit'. To change the default filename click on the name in the titlebar, type a new name, and press 'Return'.