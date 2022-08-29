import { Server } from 'http';

export const getServerAddress = (server: Server) => {
	const address = server.address();

	// IP address
	if (address && typeof address === 'object') {
		const host = address.family === 'IPv6' ? `[${address.address}]` : address.address;
		const { port } = address;
		return `http://${host}:${port}`;
	}

	// UNIX socket
	return address;
};
