# GitHub Copilot Instructions for moebius-web

>[!NOTE]
>this project, `moebius-web` is being rebranded as `teXt0wnz` or `text.0w.nz`

## Project Overview

teXt0wnz is a web-based ANSI art editor that operates in two modes: server-side (collaborative) and client-side (standalone).

This is a single-page application for creating ANSI/ASCII art with various drawing tools, color palettes, export capabilities, and real-time collaboration features.

### Client-Side Implementation (Drawing Editor)

Important Files:

#### Sources
```
public/
├── css/
│   └── style.css          # tailwindcss style sheet
├── fonts/                 # folder of png format fonts
├── img/                   # static assets
├── js/
│   ├── canvas.js          # textArtCanvas
│   ├── file.js            # File open/save
│   ├── font.js            # font management
│   ├── freehand_tools.js  # drawing tool logic
│   ├── keyboard.js        # keybind listeners/handlers
│   ├── main.js            # main interypoint
│   ├── network.js         # WebSocket handler
│   ├── palette.js         # color palette logic
│   ├── state.js           # global state machine
│   ├── toolbar.js         # ui toolbar
│   ├── ui.js              # ui helpers
│   └── worker.js          # webworker hanlder (not built)
└── index.html             # single page application
```

#### built files
```
dist/
├── ui/                    # all static assets moved into this dir
│   ├── fonts/             # same as public/fonts
│   ├── editor-[has].js    # minified js
│   └── stylez-[hash].css  # minified css
└── index.html             # single page app (vite updated)
```

**See the project `README.md` for more info about the frontend.**

---

### Server-Side Implementation (Collaboration Engine)
- `server.js` - **Express server entry point**, WebSocket setup, SSL configuration, session management
- `src/ansiedit.js` - **Core collaboration engine**, message handling, canvas state management, persistence
- `src/binary_text.js` - **Binary format handler** for ANSI art storage and loading

## Development Guidelines

### 1. Code Structure Patterns

**Tool Implementation Pattern** (see `public/js/freehand_tools.js`):
```javascript
const createToolController = () => {
    "use strict";

    function enable() {
        // Add event listeners
        document.addEventListener("onTextCanvasDown", canvasDown);
        document.addEventListener("onTextCanvasDrag", canvasDrag);
        document.addEventListener("onTextCanvasUp", canvasUp);
    }

    function disable() {
        // Remove event listeners
        document.removeEventListener("onTextCanvasDown", canvasDown);
        // ...
    }

    return {
        "enable": enable,
        "disable": disable
    };
}
```

**Event Handling Pattern**:
```javascript
// Use custom events for canvas interaction
document.addEventListener("onTextCanvasDown", canvasDown);
document.addEventListener("onTextCanvasDrag", canvasDrag);
document.addEventListener("onTextCanvasUp", canvasUp);
```

**UI Integration Pattern**:
```javascript
// Register tools with toolbar
Toolbar.add($(toolId), tool.enable, tool.disable);

// Use $ function for DOM element access
function $(divName) {
    return document.getElementById(divName);
}
```

### 2. Adding New Features

3. **Canvas interaction**: Use the established event system (`onTextCanvasDown`, etc.)
4. **UI integration**: Register with `Toolbar.add()` and create corresponding HTML elements

### 3. Code Style

- Use meaningful variable names (`textArtCanvas`, `characterBrush`, etc.)
- Follow existing indentation (tabs)
- Use explicit returns with named properties: `return { "enable": enable, "disable": disable };`

### 4. Key Application Concepts

**Canvas System:**
- `textArtCanvas` - Main drawing surface
- Uses character-based coordinates (not pixel-based)
- Supports undo/redo operations via `State.textArtCanvas.startUndo()`

**Color Management:**
- `palette` - Color palette management
- Foreground/background color system
- Support for ICE colors (extended palette)

**Drawing Modes:**
- Half-block characters for pixel-like drawing
- Character-based drawing with extended ASCII
- Attribute brushes for color-only changes

**Collaboration System:**
- Silent server connection checking on startup
- User choice between local and collaboration modes
- Real-time canvas settings synchronization (size, font, ice colors, letter spacing)
- WebSocket-based message protocol for drawing commands and state changes
- Automatic server state persistence and session management

## Server-Side Development Guidelines

### 1. Server Architecture

**Express Server (`server.js`):**
- Configurable SSL/HTTP setup with automatic certificate detection
- WebSocket routing for both direct and proxy connections (`/` and `/server` endpoints)
- Session middleware integration with express-session
- Comprehensive logging and error handling
- Configurable auto-save intervals and session naming

**Collaboration Engine (`src/ansiedit.js`):**
- Centralized canvas state management (imageData object)
- Real-time message broadcasting to all connected clients
- Session persistence with both timestamped backups and current state
- User session tracking and cleanup
- Canvas settings synchronization (size, font, colors, spacing)

### 2. WebSocket Message Protocol

**Client-to-Server Messages:**
```javascript
["join", username] - User joins collaboration session
["nick", newUsername] - User changes display name
["chat", message] - Chat message
["draw", blocks] - Drawing command with array of canvas blocks
["resize", {columns, rows}] - Canvas size change
["fontChange", {fontName}] - Font selection change
["iceColorsChange", {iceColors}] - Ice colors toggle
["letterSpacingChange", {letterSpacing}] - Letter spacing toggle
```

**Server-to-Client Messages:**
```javascript
["start", sessionData, sessionID, userList] - Initial session data
["join", username, sessionID] - User joined notification
["part", sessionID] - User left notification
["nick", username, sessionID] - User name change
["chat", username, message] - Chat message broadcast
["draw", blocks] - Drawing command broadcast
["resize", {columns, rows}] - Canvas resize broadcast
["fontChange", {fontName}] - Font change broadcast
["iceColorsChange", {iceColors}] - Ice colors broadcast
["letterSpacingChange", {letterSpacing}] - Letter spacing broadcast
```

### 3. Canvas State Management

**ImageData Object Structure:**
```javascript
{
  columns: number,        // Canvas width in characters
  rows: number,          // Canvas height in characters
  data: Uint16Array,     // Character/attribute data
  iceColours: boolean,   // Extended color palette enabled
  letterSpacing: boolean, // 9px font spacing enabled
  fontName: string       // Selected font name
}
```

**State Synchronization:**
- All canvas settings automatically sync across connected clients
- New users receive current collaboration state instead of broadcasting defaults
- Settings changes are persisted to session files
- Graceful handling of mid-session joins without disrupting existing users

### 4. Session Management

**File Structure:**
- `{sessionName}.bin` - Binary canvas data (current state)
- `{sessionName}.json` - Chat history and metadata
- `{sessionName} {timestamp}.bin` - Timestamped backups

**Configuration Options:**
```bash
node server.js [port] [options]
--ssl                 # Enable SSL (requires certificates)
--ssl-dir <path>      # SSL certificate directory
--save-interval <min> # Auto-save interval in minutes
--session-name <name> # Session file prefix
```

### 5. Adding New Collaboration Features

**Server-Side Message Handler Pattern:**
```javascript
// In src/ansiedit.js message() function
case "newFeature":
  if (msg[1] && msg[1].someProperty) {
    console.log("Server: Updating feature to", msg[1].someProperty);
    imageData.someProperty = msg[1].someProperty;
  }
  break;
```

**Client-Side Integration Pattern:**
```javascript
// In public/js/network.js
const sendNewFeature = value => {
  if (collaborationMode && connected && !applyReceivedSettings && !initializing) {
    worker.postMessage({ "cmd": "newFeature", "someProperty": value });
  }
}

const onNewFeature = value => {
  if (applyReceivedSettings) return; // Prevent loops
  applyReceivedSettings = true;
  // Apply the change to UI/canvas
  applyReceivedSettings = false;
}
```

### 6. Error Handling & Debugging

**Server Logging:**
- Comprehensive WebSocket connection logging with client details
- Message type and payload logging for debugging
- Error tracking with proper cleanup on connection failures
- Client count tracking and connection state monitoring

**Common Issues:**
- WebSocket state validation before sending messages
- Proper client cleanup on disconnection
- Settings broadcast loop prevention with flags
- Silent connection check vs explicit connection handling

### 7. Deployment Considerations

**Dependencies:**
- express ^4.15.3 - Web server framework
- express-session ^1.18.2 - Session management
- express-ws ^5.0.2 - WebSocket integration
- pm2 ^5.3.0 - Process management

**Production Setup:**
- SSL certificate configuration with automatic fallback
- Process management with PM2 for auto-restart
- Configurable auto-save intervals to prevent data loss
- Session naming for multiple concurrent art sessions

## Testing & Development

## How to Run

### build and install

```
bun i
bun bake
```

- these commands will setup the node_modules and build the application to the `dist` folder
- Now you need is a static web server pointed at the `dist/` directory.

### Fastest way to run (from the project root):

```sh
cd dist
python3 -m http.server 8080
```

Then open [http://localhost:8080/](http://localhost:8080/) in your browser.

- **Any static web server will work** (e.g. Python, PHP, Ruby, `npx serve`, etc).
- Just make sure your web server's root is the `dist/` directory.

## Summary

- **Just build and serve the `dist/` folder as static files.**

### Local Development Setup
1. **Client-only**: Start local server: `python3 -m http.server 8080` from `public/` directory
2. **With collaboration**: Run `bun server 1337` then access at `http://localhost:1337`
3. Use browser dev tools for debugging
4. Test collaboration with multiple browser tabs/windows

### Testing with Playwright
```javascript
// Basic test structure
await page.goto('http://localhost:8080'); // or 1337 for collaboration
// Test drawing tools, UI interactions, file operations, collaboration
```

### Key Test Scenarios
- Tool selection and canvas interaction
- Keyboard shortcuts (F, B, K, etc.)
- File import/export operations
- Undo/redo functionality
- Color palette operations
- **Collaboration mode selection and canvas settings sync**
- **Multi-user drawing and real-time updates**
- **Server connection handling and graceful fallback**

## Common Tasks

### Adding a New Drawing Tool
2. Implement in `public/js/freehand_tools.js` or create new file
3. Register with toolbar in `public/js/main.js`
4. Add HTML elements to `public/index.html` if needed
5. Add keyboard shortcut to paint shortcuts configuration

### Modifying UI Components
1. Edit `public/js/ui.js` for component logic
2. Update `public/index.html` for structure
3. Modify `public/css/style.css` for styling

### File Format Support
1. Add loader to `public/js/loaders.js`
2. Add saver to `public/js/savers.js`
3. Wire up in `public/js/document_onload.js`

### Adding Collaboration Features
1. Define WebSocket message protocol in both client and server
2. Add message handler to `src/ansiedit.js` with proper state management
3. Add client-side sync functions to `public/js/network.js`
4. Hook into UI components in `public/js/document_onload.js`
5. Test with multiple clients to ensure proper synchronization

### Server Configuration & Deployment
1. Configure session settings and auto-save intervals
2. Set up SSL certificates for production deployment
3. Use PM2 or similar for process management and auto-restart
4. Monitor server logs for WebSocket connection issues and state synchronization

## Important Notes

- **Always test changes locally** before committing
- **Always run `bun lint:fix`** before committing
- **Preserve existing functionality** - this is a working art editor used by artists
- **Test both local and collaboration modes** when making changes that affect canvas or UI
- **Maintain the established patterns** for consistency and reliability
- **Validate server message protocol changes** with multiple connected clients

## Dependencies & Browser Support

- Pure JavaScript for client-side
- Node.js with Express framework for server-side collaboration
- Works in modern browsers with Canvas, File API, and WebSocket support
- Uses Web Workers for real-time collaboration communication
