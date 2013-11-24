# Changing colors:

Keys '1' to '8' will choose the first eight colors without the bold-bit set, holding shift down while making the selection will choose from the highlighted palette.  
The 'q' and 'w' keys will cycle through all sixteen colors in descending, and ascending order respectively. The ordering will loop endlessly.  
Pressing the 'tab' key will change back to the previously selected color, assuming one was already chosen, hitting 'tab' again will change back. This switching can be performed as many times as required.

# Freehand ('f' key):

Freehand mode enables 'half block' characters to be used as large pixels. Since only eight colors can be used for the background in 'blink mode', if two 'half blocks' are drawn on the same text-character space with the bold-shifted palette, then the editor assumes the current color takes precedence and shifts the other color sharing the same space to the lower-palette. Pressing 'alt', or 'option', reverses this precedence, and any other colors sharing the same space with be favored instead.  
Holding shift whilst clicking on the canvas will create a straight line using 'half block' pixels from the last drawing position.

# Shading ('s' key):

Reselecting the option will cycle through the light, medium, and dark varieties of shading.  
Usage is similar to freehand mode, including using the 'shift' key to draw straight lines.  
When choosing the area to shade the background color is chosen from the area directly under the cursor, and this includes 'half-block' pixels. For instance, if a single text-character has a different color in both the upper and lower half of the glyph, then clicking on either the top of the bottom of the glyph will choose a different background color for shading.  
Attribute conflicts are resolved by shifting the background color to the lower palette.

# Vertical Block ('v' key):

Toggles between left and right-handed vertical blocks, operates in the same way as shading mode.

# Extended Brush ('e'):

Allows a selected character from the extended-ASCII set to be used as a brush, as with the other modes this also supports drawing with straight lines, as well as fixing any attribute conflicts.

# Text ('t'):

Clicking anywhere on the cursor will place a cursor, text can then be entered directly via the keyboard. To escape from text-entry mode, press 'alt' or 'option' and enter.

# Brighten ('b'):

Brightens the half-block, or the foreground color of the text-character directly underneath the cursor. Pressing 'alt' or 'option' key whilst painting will preserve the brightness-status of any other half block sharing the same text character.

# Darken ('d'):

Darkens the half-block, or the foreground color of the text-character directly underneath the cursor.

# Mirror ('m' key):

Mirrors the drawing activity in the opposing side of the screen.

# Fill ('n' key):

Fill mode operates in a similar way to most paint packages, although it will only operates on text-characters that are only one single color, or are upper and lower 'half-block' characters.  
When conflicts arise with two highlighted colors sharing the same text-character then the editor corrects this by giving the fill color precedence and shifting the other color to the lower-palette, as with the freehand mode, this is reversed by pressing the 'alt' or 'option' key.

# Color Brush ('o'):

Changes the foreground attribute of the text-character immediately underneath the pointer to the currently selected color.  
If 'alt' or 'option' is held down whilst using this tool then the background color is changed instead; the color is automatically shifted to the lower palette if a conflict is detected.

# Copy ('c'):

With 'copy', a selection from the canvas can be made which may then be used as a brush to copy entire text-characters on the canvas. Character codes set to `NULL` will be interpreted as an alpha channel, unless the shift key is depressed whilst making the selection, in which case no alpha channel will be set. Pressing the 'alt' or 'option' key will replace the selection with `NULL` values after the selection is made.

# Flip Horizontally:

Flips a selection horizontally. Also changes vertical-left blocks to vertical-right blocks, and vice versa, in the process.

# Flip Vertically:

Flips a selection vertically. Also changes lower-half blocks to upper half blocks, and vice versa, in the process.

# Grid mode ('g' key):

Turns on and off, and toggles between, two different types of grids, 'Light' and 'Dark'. The light grid is has higher visibility on darker backgrounds, but less pronounced on lighter backgrounds. The opposite is true for the dark grid.

# Undo ('z'):

Reverses the previous operation, can be repeated consecutively a maximum of 1000 times.

# Load:

Allows an ANSi file to be loaded by dragging and dropping a file on to the browser.

# Save:

Provides a link to a file containing ANSi escape sequences.

# Clear:

Resets the canvas to the initial state. All un-saved work will be lost.

# Information:

Displays information on the text-character currently under the mouse cursor whilst editing.