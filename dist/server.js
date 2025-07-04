"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_1 = require("http");
const url_1 = require("url");
const next_1 = __importDefault(require("next"));
const ws_1 = require("ws");
const crypto_1 = require("crypto");
const dev = process.env.NODE_ENV !== 'production';
const hostname = process.env.NODE_ENV === 'production' ? '0.0.0.0' : 'localhost';
const port = parseInt(process.env.PORT || '3000', 10);
// Create Next.js app with custom server enabled
const app = (0, next_1.default)({ dev, hostname, port, customServer: true });
const handle = app.getRequestHandler();
app.prepare().then(() => {
    // Create HTTP server
    const server = (0, http_1.createServer)(async (req, res) => {
        try {
            const parsedUrl = (0, url_1.parse)(req.url || '', true);
            await handle(req, res, parsedUrl);
        }
        catch (err) {
            console.error('Error occurred handling', req.url, err);
            res.statusCode = 500;
            res.end('internal server error');
        }
    });
    // Create WebSocket server on the same port, but only for our API path
    const wss = new ws_1.WebSocketServer({
        noServer: true
    });
    // Handle WebSocket upgrade requests
    server.on('upgrade', (request, socket, head) => {
        const { pathname } = (0, url_1.parse)(request.url || '');
        // Set headers for Cloudflare compatibility
        socket.on('error', (error) => {
            console.error('Socket error during upgrade:', error);
        });
        if (pathname === '/api/socket') {
            // Handle our custom WebSocket connections
            wss.handleUpgrade(request, socket, head, (ws) => {
                wss.emit('connection', ws, request);
            });
        }
        else if (pathname === '/_next/webpack-hmr') {
            // Accept HMR WebSocket and keep it alive (prevents the error)
            const key = request.headers['sec-websocket-key'];
            if (!key) {
                socket.destroy();
                return;
            }
            const acceptKey = (0, crypto_1.createHash)('sha1')
                .update(key + '258EAFA5-E914-47DA-95CA-C5AB0DC85B11')
                .digest('base64');
            socket.write([
                'HTTP/1.1 101 Switching Protocols',
                'Upgrade: websocket',
                'Connection: Upgrade',
                `Sec-WebSocket-Accept: ${acceptKey}`,
                '',
                ''
            ].join('\r\n'));
            // Keep the connection alive but don't send HMR data
            socket.on('close', () => {
                // Connection closed
            });
        }
        else {
            // Close other WebSocket connections
            socket.destroy();
        }
    });
    // WebSocket connection handling
    wss.on('connection', (ws, request) => {
        // Get real client IP from Cloudflare headers
        const clientIP = request.headers['cf-connecting-ip'] ||
            request.headers['x-forwarded-for'] ||
            request.socket.remoteAddress;
        console.log('New WebSocket connection established from:', clientIP);
        // Send welcome message
        ws.send(JSON.stringify({
            type: 'connected',
            message: 'P2P sync WebSocket connection established',
            timestamp: Date.now(),
            clientId: generateClientId()
        }));
        // Handle incoming messages
        ws.on('message', (data) => {
            try {
                const message = JSON.parse(data.toString());
                console.log('Received P2P message:', message.type, 'from client:', message.clientId);
                // Broadcast to all connected clients except sender
                wss.clients.forEach((client) => {
                    if (client !== ws && client.readyState === ws_1.WebSocket.OPEN) {
                        client.send(data.toString());
                    }
                });
            }
            catch (error) {
                console.error('Error parsing WebSocket message:', error);
                ws.send(JSON.stringify({
                    type: 'error',
                    message: 'Failed to parse message',
                    timestamp: Date.now()
                }));
            }
        });
        // Handle connection close
        ws.on('close', (code, reason) => {
            console.log('WebSocket connection closed:', code, reason.toString());
        });
        // Handle errors
        ws.on('error', (error) => {
            console.error('WebSocket error:', error);
        });
        // Send ping every 30 seconds to keep connection alive
        const pingInterval = setInterval(() => {
            if (ws.readyState === ws_1.WebSocket.OPEN) {
                ws.ping();
            }
            else {
                clearInterval(pingInterval);
            }
        }, 30000);
        // Handle pong responses
        ws.on('pong', () => {
            console.log('Received pong from client');
        });
    });
    // Start the server
    server.listen(port, () => {
        console.log(`> Ready on http://${hostname}:${port}`);
        console.log(`> WebSocket server ready on ws://${hostname}:${port}/api/socket`);
    });
});
// Generate unique client ID
function generateClientId() {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}
// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
    process.exit(1);
});
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});
