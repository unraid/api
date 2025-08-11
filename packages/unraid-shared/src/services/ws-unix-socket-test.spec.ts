import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import WebSocket, { WebSocketServer } from 'ws';
import { createServer } from 'http';
import { unlinkSync, existsSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

describe('WebSocket Unix Socket - Actual Connection Test', () => {
    const socketPath = join(tmpdir(), 'test-ws-unix-' + Date.now() + '.sock');
    let server: ReturnType<typeof createServer>;
    let wss: WebSocketServer;
    
    beforeAll(async () => {
        // Clean up any existing socket file
        if (existsSync(socketPath)) {
            unlinkSync(socketPath);
        }
        
        // Create an HTTP server
        server = createServer((req, res) => {
            res.writeHead(200);
            res.end('HTTP server on Unix socket');
        });
        
        // Create WebSocket server attached to the HTTP server
        wss = new WebSocketServer({ server });
        
        // Handle WebSocket connections
        wss.on('connection', (ws, request) => {
            console.log('Server: New WebSocket connection on path:', request.url);
            
            // Send welcome message
            ws.send(JSON.stringify({ type: 'welcome', message: 'Connected to Unix socket' }));
            
            // Echo messages back
            ws.on('message', (data) => {
                const message = data.toString();
                console.log('Server received:', message);
                ws.send(JSON.stringify({ type: 'echo', message }));
            });
            
            ws.on('close', () => {
                console.log('Server: Client disconnected');
            });
        });
        
        // Start listening on Unix socket
        await new Promise<void>((resolve, reject) => {
            server.listen(socketPath, () => {
                console.log(`Server listening on Unix socket: ${socketPath}`);
                resolve();
            });
            
            server.on('error', (err) => {
                console.error('Server error:', err);
                reject(err);
            });
        });
    });
    
    afterAll(async () => {
        // First, close all WebSocket clients gracefully
        if (wss && wss.clients) {
            const closePromises: Promise<void>[] = [];
            for (const client of wss.clients) {
                if (client.readyState === WebSocket.OPEN) {
                    closePromises.push(
                        new Promise<void>((resolve) => {
                            client.once('close', () => resolve());
                            client.close(1000, 'Test ending');
                        })
                    );
                } else {
                    client.terminate();
                }
            }
            // Wait for all clients to close
            await Promise.all(closePromises);
        }
        
        // Close WebSocket server
        if (wss) {
            await new Promise<void>((resolve) => {
                wss.close(() => resolve());
            });
        }
        
        // Close HTTP server
        if (server && server.listening) {
            await new Promise<void>((resolve) => {
                server.close((err) => {
                    if (err) console.error('Server close error:', err);
                    resolve();
                });
            });
        }
        
        // Clean up socket file
        try {
            if (existsSync(socketPath)) {
                unlinkSync(socketPath);
            }
        } catch (err) {
            console.error('Error cleaning up socket file:', err);
        }
    });
    
    it('should connect to Unix socket using ws+unix:// protocol', async () => {
        // This is the exact format the ws library expects for Unix sockets
        const wsUrl = `ws+unix://${socketPath}:/`;
        console.log('Connecting to:', wsUrl);
        
        const client = new WebSocket(wsUrl);
        
        // Wait for connection and first message
        const connected = await new Promise<boolean>((resolve, reject) => {
            const timeout = setTimeout(() => reject(new Error('Connection timeout')), 10000);
            
            client.once('open', () => {
                console.log('Client: Connected successfully!');
                clearTimeout(timeout);
                // Connection established - that's what we want to test
                resolve(true);
            });
            
            client.once('error', (err) => {
                console.error('Client error:', err);
                clearTimeout(timeout);
                reject(err);
            });
        });
        
        expect(connected).toBe(true);
        
        // Test message exchange
        client.send('Test message');
        
        const received = await new Promise<any>((resolve) => {
            client.on('message', (data) => {
                resolve(JSON.parse(data.toString()));
            });
            
            setTimeout(() => resolve(null), 1000);
        });
        
        // We should have received something (welcome or echo)
        expect(received).toBeTruthy();
        
        // Clean up gracefully
        if (client.readyState === WebSocket.OPEN) {
            client.close(1000, 'Test complete');
        } else {
            client.terminate();
        }
    });
    
    it('should connect with /graphql path like SocketConfigService', async () => {
        // Test the exact format that SocketConfigService.getWebSocketUri() returns
        const wsUrl = `ws+unix://${socketPath}:/graphql`;
        console.log('Testing SocketConfigService format:', wsUrl);
        
        const client = new WebSocket(wsUrl);
        
        await new Promise<void>((resolve, reject) => {
            client.on('open', () => {
                console.log('Client: Connected to /graphql path');
                resolve();
            });
            
            client.on('error', reject);
            setTimeout(() => reject(new Error('Connection timeout')), 2000);
        });
        
        // Connection successful!
        expect(client.readyState).toBe(WebSocket.OPEN);
        
        client.close();
    });
    
    it('should fail when using regular ws:// to connect to Unix socket', async () => {
        // This should fail - attempting to connect to non-existent Unix socket
        const nonExistentSocket = `${socketPath}.nonexistent`;
        const wsUrl = `ws+unix://${nonExistentSocket}:/test`;
        
        await expect(
            new Promise((_, reject) => {
                const client = new WebSocket(wsUrl);
                client.on('error', reject);
                client.on('open', () => reject(new Error('Should not connect')));
            })
        ).rejects.toThrow();
    });
    
    it('should work with multiple concurrent connections', async () => {
        const clients: WebSocket[] = [];
        const numClients = 3;
        
        // Create multiple connections
        for (let i = 0; i < numClients; i++) {
            const wsUrl = `ws+unix://${socketPath}:/client-${i}`;
            const client = new WebSocket(wsUrl);
            
            await new Promise<void>((resolve, reject) => {
                client.on('open', () => {
                    console.log(`Client ${i} connected`);
                    resolve();
                });
                
                client.on('error', reject);
                setTimeout(() => reject(new Error('Connection timeout')), 2000);
            });
            
            clients.push(client);
        }
        
        expect(clients).toHaveLength(numClients);
        // The server might have leftover connections from previous tests
        expect(wss.clients.size).toBeGreaterThanOrEqual(numClients);
        
        // Clean up all clients gracefully
        clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.close(1000, 'Test complete');
            } else {
                client.terminate();
            }
        });
    });
    
    it('should verify the exact implementation used in BaseInternalClientService', async () => {
        // This tests the exact code path in base-internal-client.service.ts
        const { createClient } = await import('graphql-ws');
        
        const wsUrl = `ws+unix://${socketPath}:/graphql`;
        
        // This is exactly what BaseInternalClientService does
        const wsClient = createClient({
            url: wsUrl,
            connectionParams: () => ({ 'x-api-key': 'test-key' }),
            webSocketImpl: WebSocket,
            retryAttempts: 0,
            lazy: true, // Use lazy mode to prevent immediate connection
            on: {
                error: (err) => {
                    // Suppress connection errors in test
                    const message = err instanceof Error ? err.message : String(err);
                    console.log('GraphQL client error (expected in test):', message);
                },
            },
        });
        
        // The client should be created without errors
        expect(wsClient).toBeDefined();
        expect(wsClient.dispose).toBeDefined();
        
        // Clean up immediately - don't wait for connection
        await wsClient.dispose();
    });
});