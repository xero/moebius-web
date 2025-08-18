![preview](https://github.com/xero/moebius-web/assets/227907/3d71fc0d-6d84-498f-aa70-67f7196ab2db)

This was the web-based precursor to [moebius](https://blocktronics.github.io/moebius/), the best ansi editor around.

Code for both projects by the amazing [andy](http://github.com/andyherbert)

Revival, on-going dev, and maintenance by [xero](https://github.com/xero)

# Demo

The public working version (without netcode) is a available at [xero.github.io/moebius-web](https://xero.github.io/moebius-web/)

My personal instance is available at [ansi.0w.nz](https://ansi.0w.nz) - sometimes I have joints enabled, other times I don't. I also dev here, so it may be broken at any time.

# Client Usage

Moebius-web is a comprehensive web-based ANSI/ASCII art editor that operates entirely in the browser. This client-side application provides a full suite of drawing tools, color management, and file operations for creating text-based artwork.

## Features Overview

### Drawing Tools

**Keyboard Mode (K)** - Text input mode that allows typing characters directly onto the canvas with full keyboard navigation support.

**Freestyle/Freehand (F)** - Free drawing tool using half-block characters as large pixels. Supports pressure-sensitive drawing and straight lines when holding Shift.

**Character Brush (B)** - Draw with any character from the extended ASCII character set. Includes a character picker panel for easy selection.

**Fill Tool (N)** - Flood fill that works on single-color text characters or half-block pixels. Respects color boundaries and handles attribute conflicts intelligently.

**Attribute Brush (A)** - Paint-only tool that changes foreground/background colors without affecting the character itself. Hold Alt to paint background colors.

**Line Tool** - Draw straight lines between two points with immediate preview. Supports color conflict resolution.

**Square Tool** - Draw rectangles with outline or filled modes. Toggle between outline and filled using the floating panel.

**Circle Tool** - Draw circles and ellipses with outline or filled modes. Includes real-time preview during drawing.

**Selection Tool** - Select rectangular areas for copying, cutting, and manipulation. Includes flip horizontal/vertical and move operations.

**Sample Tool (Alt)** - Color picker that samples colors from existing artwork. Works as a quick color selection method.

### Color Management

- **16-color ANSI palette** with foreground/background color selection
- **iCE colors support** for extended color capabilities
- **Color swapping** and default color restoration
- **Real-time color preview** in the palette picker
- **Smart conflict resolution** when overlapping half-block colors

### File Operations

**Supported Import Formats:**
- ANSI (.ans) files
- Binary Text (.bin) files
- XBin (.xb) files
- Standard image formats (PNG, JPEG, GIF) with palette reduction

**Supported Export Formats:**
- Save as ANSI (.ans)
- Save as Binary Text (.bin)
- Save as XBin (.xb)
- Export as PNG image
- Export as UTF-8 ANSI

### Canvas Operations

- **Unlimited undo/redo** (up to 1000 operations)
- **Canvas resizing** with width/height controls
- **Grid overlay** for precise alignment
- **SAUCE metadata** editing (title, author, group)
- **Font selection** from multiple character sets

## Comprehensive Key Mappings

### Main Tool Shortcuts
| Key | Tool | Description |
|-----|------|-------------|
| `K` | Keyboard Mode | Enter text input mode with cursor navigation |
| `F` | Freestyle | Free drawing with half-block pixels |
| `B` | Character Brush | Draw with selected ASCII characters |
| `N` | Fill | Flood fill tool |
| `A` | Attribute Brush | Paint colors only (no characters) |
| `G` | Grid Toggle | Show/hide alignment grid |

### Color Shortcuts
| Key | Action | Description |
|-----|--------|-------------|
| `D` | Default Colors | Reset to default foreground/background |
| `Q` | Swap Colors | Exchange foreground and background colors |
| `1`-`8` | Select Colors | Choose from basic color palette |
| `Shift+1`-`8` | Bright Colors | Choose from highlighted palette |
| `F1`-`F12` | Special Characters | Insert predefined special characters |

### File Operations
| Key Combination | Action | Description |
|-----------------|--------|-------------|
| `Ctrl+Z` | Undo | Reverse last operation |
| `Ctrl+Y` | Redo | Restore undone operation |
| `Ctrl+X` | Cut | Cut selected area to clipboard |
| `Ctrl+C` | Copy | Copy selected area to clipboard |
| `Ctrl+V` | Paste | Paste from clipboard |
| `Ctrl+Shift+V` | System Paste | Paste from system clipboard |
| `Ctrl+Delete` | Delete | Delete selected area |

### Keyboard Mode Navigation
| Key | Action | Description |
|-----|--------|-------------|
| `Arrow Keys` | Navigate | Move cursor in text mode |
| `Home` | Line Start | Jump to beginning of line |
| `End` | Line End | Jump to end of line |
| `Page Up/Down` | Page Jump | Move cursor by screen height |
| `Tab` | Tab Character | Insert tab character |
| `Backspace` | Delete Left | Delete character to the left |
| `Enter` | New Line | Move to next line |

### Advanced Editing (Alt + Key)
| Key Combination | Action | Description |
|-----------------|--------|-------------|
| `Alt+Up` | Insert Row | Insert row above cursor |
| `Alt+Down` | Delete Row | Delete current row |
| `Alt+Right` | Insert Column | Insert column at cursor |
| `Alt+Left` | Delete Column | Delete current column |
| `Alt+E` | Erase Row | Clear entire row |
| `Alt+Shift+E` | Erase Column | Clear entire column |
| `Alt+Home` | Erase to Row Start | Clear from cursor to line beginning |
| `Alt+End` | Erase to Row End | Clear from cursor to line end |
| `Alt+Page Up` | Erase to Column Start | Clear from cursor to column top |
| `Alt+Page Down` | Erase to Column End | Clear from cursor to column bottom |

### Selection Operations
| Key | Action | Description |
|-----|--------|-------------|
| `[` | Flip Horizontal | Mirror selection horizontally |
| `]` | Flip Vertical | Mirror selection vertically |
| `M` | Move Mode | Toggle selection move mode |

### Special Function Keys
| Key | Character | Description |
|-----|-----------|-------------|
| `F1` | `░` | Light shade block |
| `F2` | `▒` | Medium shade block |
| `F3` | `▓` | Dark shade block |
| `F4` | `█` | Full block |
| `F5` | `▀` | Upper half block |
| `F6` | `▄` | Lower half block |
| `F7` | `▌` | Left half block |
| `F8` | `▐` | Right half block |
| `F9` | `■` | Small solid square |
| `F10` | `○` | Circle |
| `F11` | `•` | Bullet |
| `F12` | `NULL` | Blank/transparent |

### Menu Access
| Action | Key | Description |
|--------|-----|-------------|
| Canvas Resize | Menu → Edit | Change canvas dimensions |
| Font Selection | Menu → View | Choose character set |
| iCE Colors | Menu → View | Enable extended colors |
| SAUCE Info | Menu → File | Edit artwork metadata |

## Mouse Controls

- **Left Click**: Primary drawing action
- **Drag**: Continue drawing/create shapes
- **Shift+Click**: Draw straight lines in freehand mode
- **Alt+Click**: Color sampling/alternative drawing modes
- **Right Click**: Access context menus

## Tips and Workflow

1. **Start with Keyboard Mode** to lay out text and structure
2. **Use Grid** for precise alignment of elements
3. **Freestyle Tool** is best for artistic details and shading
4. **Character Brush** for textures and patterns
5. **Fill Tool** for quick color blocking
6. **Selection Tool** for moving and copying artwork sections
7. **Save frequently** using Ctrl+S or File menu options
8. **Use F-keys** for quick access to common block characters
9. **Alt+sampling** to pick colors from existing artwork
10. **Undo/Redo** extensively - it's unlimited within the session



# Install

If you want to use this as a local only editor, you can just put the "public" folder on a web-server and you're good to go.

For a group server setup, set the following:

## Group Server

Requires `node`, and `npm`, or `bun`
```sh
bun i
```
You can get free SSL certs from let's encrypt. I personally use [acme-nginx](https://github.com/kshcherban/acme-nginx) to do all the work for me:

```sh
acme-nginx -d "ansi.blocktronics.org"
```

## process management

### systemd (Recommended for Servers)
- Built-in service manager on most Linux distributions.
- Extremely lightweight, reliable, and secure (no extra processes or userland code to maintain).
- Create a unit file for the server:
```INI
[Unit]
Description=Moebius Web Node.js Server
After=network.target

[Service]
ExecStart=/usr/bin/node /www/ansi/server.js <ops>
Restart=always
User=youruser
Environment=NODE_ENV=production
WorkingDirectory=/www/ansi/
StandardOutput=syslog
StandardError=syslog

[Install]
WantedBy=multi-user.target
```
- Reload systemd and enable:
```sh
sudo systemctl daemon-reload
sudo systemctl enable --now moebius-web.service
```
- Memory: Minimal—just your Node.js process.
- Monitoring: Use `journalctl` or your system's logging.

### forever
- Simple Node.js CLI tool for restarting scripts.
- Install: npm install -g forever
- Run: forever start server.js <ops>
- Memory: Very low—almost just your script.
- Downsides: Less robust than systemd


The server runs on port `1337` by default. But you can override it via an argument to server.js. You will need to update the port the client uses in `public/js/network.js` on line #113.

Now you need to setup a webserver to actually serve up the `/public` directory to the web. Here's an nginx example:

Create or edit an nginx config: `/etc/nginx/sites-available/moebius`

```
server {
	listen 80;
	listen 443 ssl;

	default_type text/plain;

	root /www/ansi/public;
	index index.php index.html index.htm;

	server_name ansi.0w.nz;
	include snippets/ssl.conf;

	location ~ /.well-known {
		allow all;
	}

	location / {
		try_files $uri $uri/;
	}
	location /server {
		proxy_http_version 1.1;
		proxy_set_header Upgrade $http_upgrade;
		proxy_set_header Connection $connection_upgrade;
		proxy_set_header Host $host;
		proxy_set_header X-Real-IP $remote_addr;
		proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
		proxy_set_header X-Forwarded-Proto $scheme;
		proxy_read_timeout 86400;
		proxy_redirect off;
		proxy_pass http://localhost:1337/;  # use the correct port, and note the trailing slash
	}
}
```

> Note that the webroot should contain the `/public` directory.
> proxy_pass should be the correct port you specified with a trailing slash.

Make sure you define your SSL setting in `/etc/nginx/snippets/ssl.conf`. At minimum point to the cert and key:

    ssl_certificate /etc/ssl/private/letsencrypt-domain.pem;
    ssl_certificate_key /etc/ssl/private/letsencrypt-domain.key;

Restart nginx and visit your domain. Time to draw some **rad ANSi!**

# License

Distributed under the MIT licence. See LICENCE.txt

Uses Google's Material Icons. https://material.io/icons/
