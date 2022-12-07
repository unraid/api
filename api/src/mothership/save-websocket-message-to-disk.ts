import { createStream as createRotatingFileStream, type RotatingFileStream } from 'rotating-file-stream';

let outgoingStream: RotatingFileStream;
export const saveOutgoingWebsocketMessageToDisk = (message: string) => {
	// Start stream if it doesn't exist
	if (!outgoingStream) {
		outgoingStream = createRotatingFileStream('/var/log/unraid-api/relay-outgoing-messages.log', {
			size: '10M', // Rotate every 10 MegaBytes written
			interval: '1d', // Rotate daily
			compress: 'gzip', // Compress rotated files
			maxFiles: parseInt(process.env.LOG_MOTHERSHIP_MESSAGES_MAX_FILES ?? '2', 10), // Keep a maximum of 2 log files
		});
	}

	outgoingStream.write(`[${new Date().toISOString()}] ${message}\n`);
};

let incomingStream: RotatingFileStream;
export const saveIncomingWebsocketMessageToDisk = (message: string) => {
	// Start stream if it doesn't exist
	if (!incomingStream) {
		incomingStream = createRotatingFileStream('/var/log/unraid-api/relay-incoming-messages.log', {
			size: '10M', // Rotate every 10 MegaBytes written
			interval: '1d', // Rotate daily
			compress: 'gzip', // Compress rotated files
			maxFiles: parseInt(process.env.LOG_MOTHERSHIP_MESSAGES_MAX_FILES ?? '2', 10), // Keep a maximum of 2 log files
		});
	}

	incomingStream.write(`[${new Date().toISOString()}] ${message}\n`);
};
