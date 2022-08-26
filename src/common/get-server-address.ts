import { Server } from 'http';

export const getServerAddress = (server: Server) => {
    const address = server.address();

    // IP address
    if (address && typeof address === 'object') {
        
        var host = address.family === 'IPv6' ? `[${address.address}]` : address.address;
        var port = address.port;
        return `http://${host}:${port}`;
    }

    // UNIX socket
    return address;
}
