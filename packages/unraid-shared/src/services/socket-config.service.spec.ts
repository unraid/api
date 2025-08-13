import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ConfigService } from '@nestjs/config';

import { SocketConfigService } from './socket-config.service.js';

describe('SocketConfigService', () => {
    let service: SocketConfigService;
    let configService: ConfigService;

    beforeEach(() => {
        configService = new ConfigService();
        service = new SocketConfigService(configService);
    });

    afterEach(() => {
        // Clean up all spies and mocks after each test
        vi.restoreAllMocks();
    });

    describe('getNginxPort', () => {
        it('should return configured nginx port', () => {
            vi.spyOn(configService, 'get').mockReturnValue('8080');
            
            const port = service.getNginxPort();
            
            expect(port).toBe(8080);
            expect(configService.get).toHaveBeenCalledWith('store.emhttp.nginx.httpPort', 80);
        });

        it('should return default port when not configured', () => {
            vi.spyOn(configService, 'get').mockImplementation((key, defaultValue) => defaultValue);
            
            const port = service.getNginxPort();
            
            expect(port).toBe(80);
        });
    });

    describe('isRunningOnSocket', () => {
        it('should return true when PORT contains .sock', () => {
            vi.spyOn(configService, 'get').mockReturnValue('/var/run/unraid-api.sock');
            
            expect(service.isRunningOnSocket()).toBe(true);
        });

        it('should return false when PORT is numeric', () => {
            vi.spyOn(configService, 'get').mockReturnValue('3000');
            
            expect(service.isRunningOnSocket()).toBe(false);
        });

        it('should use default socket path when PORT not set', () => {
            // Mock to simulate PORT not being set in configuration
            // When PORT returns undefined, ConfigService should use the default value
            vi.spyOn(configService, 'get').mockImplementation((key, defaultValue) => {
                if (key === 'PORT') {
                    // Simulate ConfigService behavior: return default when config is undefined
                    return defaultValue; // This simulates PORT not being in config
                }
                return defaultValue;
            });
            
            expect(service.isRunningOnSocket()).toBe(true);
            expect(configService.get).toHaveBeenCalledWith('PORT', '/var/run/unraid-api.sock');
        });
    });

    describe('getSocketPath', () => {
        it('should return configured socket path', () => {
            const socketPath = '/custom/socket.sock';
            vi.spyOn(configService, 'get').mockReturnValue(socketPath);
            
            expect(service.getSocketPath()).toBe(socketPath);
        });

        it('should return default socket path when not configured', () => {
            vi.spyOn(configService, 'get').mockImplementation((key, defaultValue) => defaultValue);
            
            expect(service.getSocketPath()).toBe('/var/run/unraid-api.sock');
        });
    });

    describe('getNumericPort', () => {
        it('should return numeric port when configured', () => {
            vi.spyOn(configService, 'get').mockReturnValue('3000');
            
            expect(service.getNumericPort()).toBe(3000);
        });

        it('should return undefined when running on socket', () => {
            vi.spyOn(configService, 'get').mockReturnValue('/var/run/unraid-api.sock');
            
            expect(service.getNumericPort()).toBeUndefined();
        });

        it('should handle string ports correctly', () => {
            vi.spyOn(configService, 'get').mockReturnValue('8080');
            
            expect(service.getNumericPort()).toBe(8080);
        });

        it('should return undefined for non-numeric port values', () => {
            vi.spyOn(configService, 'get').mockReturnValue('invalid-port');
            
            expect(service.getNumericPort()).toBeUndefined();
        });

        it('should return undefined for empty string port', () => {
            vi.spyOn(configService, 'get').mockReturnValue('');
            
            expect(service.getNumericPort()).toBeUndefined();
        });

        it('should return undefined for port with mixed characters', () => {
            vi.spyOn(configService, 'get').mockReturnValue('3000abc');
            
            expect(service.getNumericPort()).toBeUndefined();
        });

        it('should return undefined for port 0', () => {
            vi.spyOn(configService, 'get').mockReturnValue('0');
            
            expect(service.getNumericPort()).toBeUndefined();
        });

        it('should return undefined for negative port', () => {
            vi.spyOn(configService, 'get').mockReturnValue('-1');
            
            expect(service.getNumericPort()).toBeUndefined();
        });

        it('should return undefined for port above 65535', () => {
            vi.spyOn(configService, 'get').mockReturnValue('70000');
            
            expect(service.getNumericPort()).toBeUndefined();
        });

        it('should return valid port 65535', () => {
            vi.spyOn(configService, 'get').mockReturnValue('65535');
            
            expect(service.getNumericPort()).toBe(65535);
        });
    });

    describe('getApiAddress', () => {
        it('should return HTTP address with numeric port', () => {
            vi.spyOn(configService, 'get').mockImplementation((key) => {
                if (key === 'PORT') return '3000';
                return undefined;
            });
            
            expect(service.getApiAddress('http')).toBe('http://127.0.0.1:3000/graphql');
        });

        it('should return WS address with numeric port', () => {
            vi.spyOn(configService, 'get').mockImplementation((key) => {
                if (key === 'PORT') return '3000';
                return undefined;
            });
            
            expect(service.getApiAddress('ws')).toBe('ws://127.0.0.1:3000/graphql');
        });

        it('should use nginx port when no numeric port configured', () => {
            vi.spyOn(configService, 'get').mockImplementation((key, defaultValue) => {
                if (key === 'PORT') return '/var/run/unraid-api.sock';
                if (key === 'store.emhttp.nginx.httpPort') return '8080';
                return defaultValue;
            });
            
            expect(service.getApiAddress('http')).toBe('http://127.0.0.1:8080/graphql');
        });

        it('should omit port when nginx port is default (80)', () => {
            vi.spyOn(configService, 'get').mockImplementation((key, defaultValue) => {
                if (key === 'PORT') return '/var/run/unraid-api.sock';
                if (key === 'store.emhttp.nginx.httpPort') return '80';
                return defaultValue;
            });
            
            expect(service.getApiAddress('http')).toBe('http://127.0.0.1/graphql');
        });

        it('should default to http protocol', () => {
            vi.spyOn(configService, 'get').mockImplementation((key) => {
                if (key === 'PORT') return '3000';
                return undefined;
            });
            
            expect(service.getApiAddress()).toBe('http://127.0.0.1:3000/graphql');
        });

        it('should fallback to nginx port when PORT is invalid', () => {
            vi.spyOn(configService, 'get').mockImplementation((key, defaultValue) => {
                if (key === 'PORT') return 'invalid-port';
                if (key === 'store.emhttp.nginx.httpPort') return '8080';
                return defaultValue;
            });
            
            expect(service.getApiAddress('http')).toBe('http://127.0.0.1:8080/graphql');
        });

        it('should use default port when PORT is invalid and nginx port is default', () => {
            vi.spyOn(configService, 'get').mockImplementation((key, defaultValue) => {
                if (key === 'PORT') return 'not-a-number';
                if (key === 'store.emhttp.nginx.httpPort') return '80';
                return defaultValue;
            });
            
            expect(service.getApiAddress('http')).toBe('http://127.0.0.1/graphql');
        });
    });

    describe('getWebSocketUri', () => {
        it('should return undefined when subscriptions disabled', () => {
            expect(service.getWebSocketUri(false)).toBeUndefined();
        });

        it('should return ws+unix:// URI when running on socket', () => {
            const socketPath = '/var/run/unraid-api.sock';
            vi.spyOn(configService, 'get').mockReturnValue(socketPath);
            
            const uri = service.getWebSocketUri(true);
            
            expect(uri).toBe(`ws+unix://${socketPath}:/graphql`);
        });

        it('should return ws:// URI when running on TCP port', () => {
            vi.spyOn(configService, 'get').mockImplementation((key) => {
                if (key === 'PORT') return '3000';
                return undefined;
            });
            
            const uri = service.getWebSocketUri(true);
            
            expect(uri).toBe('ws://127.0.0.1:3000/graphql');
        });

        it('should handle custom socket paths', () => {
            const customSocket = '/custom/path/api.sock';
            vi.spyOn(configService, 'get').mockReturnValue(customSocket);
            
            const uri = service.getWebSocketUri(true);
            
            expect(uri).toBe(`ws+unix://${customSocket}:/graphql`);
        });

        it('should use TCP port for WebSocket when running on TCP port', () => {
            // Configure to use TCP port instead of Unix socket
            // This naturally causes isRunningOnSocket() to return false
            vi.spyOn(configService, 'get').mockImplementation((key, defaultValue) => {
                if (key === 'PORT') return '3001'; // TCP port, not a socket
                if (key === 'store.emhttp.nginx.httpPort') return '8080';
                return defaultValue;
            });
            
            const uri = service.getWebSocketUri(true);
            
            // When PORT is numeric, it uses that port directly for WebSocket
            expect(uri).toBe('ws://127.0.0.1:3001/graphql');
        });
    });

    describe('integration scenarios', () => {
        it('should handle production configuration correctly', () => {
            // Production typically runs on Unix socket
            vi.spyOn(configService, 'get').mockImplementation((key, defaultValue) => {
                if (key === 'PORT') return '/var/run/unraid-api.sock';
                if (key === 'store.emhttp.nginx.httpPort') return '80';
                return defaultValue;
            });
            
            expect(service.isRunningOnSocket()).toBe(true);
            expect(service.getSocketPath()).toBe('/var/run/unraid-api.sock');
            expect(service.getNumericPort()).toBeUndefined();
            expect(service.getApiAddress('http')).toBe('http://127.0.0.1/graphql');
            expect(service.getWebSocketUri(true)).toBe('ws+unix:///var/run/unraid-api.sock:/graphql');
        });

        it('should handle development configuration correctly', () => {
            // Development typically runs on TCP port
            vi.spyOn(configService, 'get').mockImplementation((key, defaultValue) => {
                if (key === 'PORT') return '3001';
                return defaultValue;
            });
            
            expect(service.isRunningOnSocket()).toBe(false);
            expect(service.getNumericPort()).toBe(3001);
            expect(service.getApiAddress('http')).toBe('http://127.0.0.1:3001/graphql');
            expect(service.getWebSocketUri(true)).toBe('ws://127.0.0.1:3001/graphql');
        });
    });
});