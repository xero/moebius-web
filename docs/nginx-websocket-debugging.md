# WebSocket Nginx Proxy Debugging Guide

## Current Issue
The WebSocket connection gets a 101 Switching Protocols response but immediately closes with error code 1006, suggesting the upgrade handshake works but the actual WebSocket connection fails.

## Enhanced Server Debugging
The server now includes extensive logging that will help diagnose the issue:

1. **Connection attempts** - logged with full headers and request details
2. **WebSocket state tracking** - logs when connections are established/closed
3. **Message flow** - logs all incoming/outgoing messages
4. **Error handling** - detailed error logging with timestamps

## Testing Steps

### 1. Direct Connection Test (Without Nginx)
First, test if the WebSocket server works directly:

```bash
# Start server on port 1337
node server.js 1337

# In browser, navigate to: http://localhost:1337
# Check if collaborative features work
```

### 2. Nginx Configuration Options

#### Option A: Current Configuration (with potential fix)
```nginx
location /server {
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection $connection_upgrade;
    proxy_set_header Host $http_host;
    proxy_set_header X-Real-Ip $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Nginx-Proxy true;
    proxy_redirect off;
    # Try adding trailing slash:
    proxy_pass http://localhost:1337/;
}
```

#### Option B: Alternative Configuration
```nginx
location /server/ {
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection $connection_upgrade;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_cache_bypass $http_upgrade;
    proxy_redirect off;
    proxy_pass http://localhost:1337/server/;
}
```

#### Option C: Root Proxy (Simple)
```nginx
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
    proxy_pass http://localhost:1337;
}
```

### 3. Debugging Commands

#### Check nginx error logs:
```bash
sudo tail -f /var/log/nginx/error.log
```

#### Check if nginx is properly forwarding WebSocket headers:
```bash
# In server terminal, look for these headers in connection logs:
# - connection: upgrade
# - upgrade: websocket
# - x-forwarded-for: client_ip
```

#### Test WebSocket connection with wscat:
```bash
# Install wscat if needed
npm install -g wscat

# Test direct connection:
wscat -c ws://localhost:1337

# Test through nginx:
wscat -c wss://ansi.0w.nz/server
```

## Common Issues and Solutions

### Issue 1: Path Mismatch
**Problem**: Nginx forwards `/server` to backend, but backend expects different path
**Solution**: Ensure server has `app.ws("/server", ...)` handler (✅ Already implemented)

### Issue 2: SSL/TLS Mismatch  
**Problem**: Frontend uses `wss://` but backend expects `ws://`
**Solution**: Server correctly handles HTTP backend with HTTPS frontend through nginx (✅ Implemented)

### Issue 3: Connection Headers
**Problem**: Nginx not properly forwarding WebSocket upgrade headers
**Solution**: Verify `proxy_set_header Connection $connection_upgrade;` is working

### Issue 4: Timeouts
**Problem**: Connection established but times out quickly
**Solution**: Add `proxy_read_timeout 86400;` to nginx config

## Expected Log Output

When working correctly, you should see:
```
=== NEW WEBSOCKET CONNECTION ===
  - Timestamp: 2024-01-XX...
  - Session ID: abc123
  - URL: /server
  - X-Forwarded-For: xxx.xxx.xxx.xxx
=====================================
Total connected clients: 1
Sending start data to client (length: XXX)
Sending image data to client, size: XXXX
```

## Troubleshooting Next Steps

1. **Test direct connection** first to isolate nginx issues
2. **Check nginx error logs** for any proxy-related errors  
3. **Try different nginx configurations** above
4. **Use wscat** to test raw WebSocket connection
5. **Check server logs** for detailed connection information