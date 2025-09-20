import { existsSync, readFileSync } from 'fs';
import path from 'path';
import { createServer as createHttpServer } from 'http';
import { createServer as createHttpsServer } from 'https';
import express from 'express';
import session from 'express-session';
import expressWs from 'express-ws';
import text0wnz from './text0wnz.js';

// sec helper
function cleanHeaders(headers) {
	const SENSITIVE_HEADERS = ['authorization', 'cookie', 'set-cookie', 'proxy-authorization', 'x-api-key'];
	const redacted = {};
	for (const [key, value] of Object.entries(headers)) {
		if (SENSITIVE_HEADERS.includes(key.toLowerCase())) {
			redacted[key] = '[REDACTED]';
		} else {
			redacted[key] = value;
		}
	}
	return redacted;
}

// Parse command line arguments
function parseArgs() {
	const args = process.argv.slice(2);
	const config = {
		ssl: false,
		sslDir: '/etc/ssl/private',
		saveInterval: 30 * 60 * 1000, // 30 minutes in milliseconds
		sessionName: 'joint',
		port: 1337,
	};

	for (let i = 0; i < args.length; i++) {
		const arg = args[i];
		const nextArg = args[i + 1];

		switch (arg) {
			case '--ssl':
				config.ssl = true;
				break;
			case '--ssl-dir':
				if (nextArg && !nextArg.startsWith('--')) {
					config.sslDir = nextArg;
					i++; // Skip next argument as we consumed it
				}
				break;
			case '--save-interval':
				if (nextArg && !nextArg.startsWith('--')) {
					const minutes = parseInt(nextArg);
					if (!isNaN(minutes) && minutes > 0) {
						config.saveInterval = minutes * 60 * 1000;
					}
					i++; // Skip next argument as we consumed it
				}
				break;
			case '--session-name':
				if (nextArg && !nextArg.startsWith('--')) {
					config.sessionName = nextArg;
					i++; // Skip next argument as we consumed it
				}
				break;
			case '--help':
				console.log(`Moebius Web Server
Usage: node server.js [port] [options]

Options:
  --ssl                 Enable SSL (requires certificates in ssl-dir)
  --ssl-dir <path>      SSL certificate directory (default: /etc/ssl/private)
  --save-interval <min> Auto-save interval in minutes (default: 30)
  --session-name <name> Session file prefix (default: joint)
  --help                Show this help message

Examples:
  node server.js 8080 --ssl --session-name myart
  node server.js --save-interval 60 --session-name collaborative
`);
				process.exit(0);
				break;
			default:
				// Check if it's a port number
				{
					const port = parseInt(arg);
					if (!isNaN(port) && port > 0 && port <= 65535) {
						config.port = port;
					}
				}
				break;
		}
	}
	return config;
}

const config = parseArgs();
console.log('Server configuration:', config);

// Initialize text0wnz with configuration
text0wnz.initialize(config);

let server;

// Check if SSL certificates exist and use HTTPS, otherwise fallback to HTTP
if (config.ssl) {
	const certPath = path.join(config.sslDir, 'letsencrypt-domain.pem');
	const keyPath = path.join(config.sslDir, 'letsencrypt-domain.key');

	try {
		if (existsSync(certPath) && existsSync(keyPath)) {
			server = createHttpsServer({
				cert: readFileSync(certPath),
				key: readFileSync(keyPath),
			});
			console.log('Using HTTPS server with SSL certificates from:', config.sslDir);
		} else {
			throw new Error(`SSL certificates not found in ${config.sslDir}`);
		}
	} catch(err) {
		console.error('SSL Error:', err.message);
		console.log('Falling back to HTTP server');
		server = createHttpServer();
	}
} else {
	server = createHttpServer();
	console.log('Using HTTP server (SSL disabled)');
}

const app = express();
const allClients = new Set();

// Important: Set up session middleware before WebSocket handling
app.use(session({ resave: false, saveUninitialized: true, secret: 'sauce' }));
app.use(express.static('public'));

// Initialize express-ws with the server AFTER session middleware
expressWs(app, server);

// Debugging middleware for WebSocket upgrade requests
app.use('/server', (req, _res, next) => {
	console.log(`Request to /server endpoint:
  - Method: ${req.method}
  - Headers: ${JSON.stringify(cleanHeaders(req.headers))}
  - Connection header: ${req.headers.connection}
  - Upgrade header: ${req.headers.upgrade}`);
	next();
});

// WebSocket handler function
function handleWebSocketConnection(ws, req) {
	console.log('=== NEW WEBSOCKET CONNECTION ===');
	console.log(`  - Timestamp: ${new Date().toISOString()}
  - Session ID: ${req.sessionID}
  - Remote address: ${req.connection.remoteAddress || req.ip}`);

	allClients.add(ws);

	// Send initial data with error handling
	try {
		const startData = text0wnz.getStart(req.sessionID);
		ws.send(startData);

		const imageData = text0wnz.getImageData();
		if (imageData?.data) {
			ws.send(imageData.data, { binary: true });
		}
	} catch(err) {
		console.error('Error sending initial data:', err);
		ws.close(1011, 'Server error during initialization');
	}

	ws.on('message', msg => {
		try {
			const parsedMsg = JSON.parse(msg);
			text0wnz.message(parsedMsg, req.sessionID, allClients);
		} catch(err) {
			console.error('Error parsing message:', err, msg.toString());
		}
	});

	ws.on('close', (_code, _reason) => {
		allClients.delete(ws);
		text0wnz.closeSession(req.sessionID, allClients);
	});

	ws.on('error', err => {
		console.error('WebSocket error:', err);
		allClients.delete(ws);
	});
}

// WebSocket routes for both direct and proxy connections
app.ws('/', handleWebSocketConnection);
app.ws('/server', handleWebSocketConnection);

server.listen(config.port, () => {
	console.log(`Server listening on port: ${config.port}`);
});

setInterval(() => {
	text0wnz.saveSessionWithTimestamp(() => {});
	text0wnz.saveSession(() => {});
}, config.saveInterval);

process.on('SIGINT', () => {
	text0wnz.saveSession(() => process.exit());
});
