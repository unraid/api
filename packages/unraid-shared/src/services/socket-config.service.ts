import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Shared service for socket detection and address resolution.
 * Used by InternalGraphQLClientFactory and other services that need socket configuration.
 */
@Injectable()
export class SocketConfigService {
    private readonly PROD_NGINX_PORT = 80;

    constructor(private readonly configService: ConfigService) {}

    /**
     * Get the nginx port from configuration
     */
    getNginxPort(): number {
        return Number(this.configService.get('store.emhttp.nginx.httpPort', this.PROD_NGINX_PORT));
    }

    /**
     * Check if the API is running on a Unix socket
     */
    isRunningOnSocket(): boolean {
        const port = this.configService.get<string>('PORT', '/var/run/unraid-api.sock');
        return port.includes('.sock');
    }

    /**
     * Get the socket path from config
     */
    getSocketPath(): string {
        return this.configService.get<string>('PORT', '/var/run/unraid-api.sock');
    }

    /**
     * Get the numeric port if not running on socket
     */
    getNumericPort(): number | undefined {
        const port = this.configService.get<string>('PORT', '/var/run/unraid-api.sock');
        if (port.includes('.sock')) {
            return undefined;
        }
        const numericPort = Number(port);
        // Check if the conversion resulted in a valid finite number
        // Also check for reasonable port range (0 is not a valid port)
        if (!Number.isFinite(numericPort) || numericPort <= 0 || numericPort > 65535) {
            return undefined;
        }
        return numericPort;
    }

    /**
     * Get the API address for HTTP or WebSocket requests.
     * @param protocol - The protocol to use ('http' or 'ws')
     * @returns The full API endpoint URL
     */
    getApiAddress(protocol: 'http' | 'ws' = 'http'): string {
        const numericPort = this.getNumericPort();
        if (numericPort) {
            return `${protocol}://127.0.0.1:${numericPort}/graphql`;
        }
        const nginxPort = this.getNginxPort();
        if (nginxPort !== this.PROD_NGINX_PORT) {
            return `${protocol}://127.0.0.1:${nginxPort}/graphql`;
        }
        return `${protocol}://127.0.0.1/graphql`;
    }

    /**
     * Get the WebSocket URI for subscriptions.
     * Handles both Unix socket and TCP connections.
     * @param enableSubscriptions - Whether subscriptions are enabled
     * @returns The WebSocket URI or undefined if subscriptions are disabled
     */
    getWebSocketUri(enableSubscriptions: boolean = false): string | undefined {
        if (!enableSubscriptions) {
            return undefined;
        }

        if (this.isRunningOnSocket()) {
            // For Unix sockets, use the ws+unix:// protocol
            // Format: ws+unix://socket/path:/url/path
            const socketPath = this.getSocketPath();
            return `ws+unix://${socketPath}:/graphql`;
        }

        return this.getApiAddress('ws');
    }
}