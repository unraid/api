import { config } from 'dotenv';

export const env = process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test'
	? config({ debug: true, path: `./.env.${process.env.NODE_ENV}` }) : config({
		path: '/usr/local/bin/unraid-api/.env',
	});
