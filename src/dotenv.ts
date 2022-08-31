import { config } from 'dotenv';

export const env = process.env.NODE_ENV === 'production'
	? config({
		path: '/usr/local/bin/unraid-api/.env',

	})
	: config({ debug: true });
