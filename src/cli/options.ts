import { parse, ArgsParseOptions, ArgumentConfig } from 'ts-command-line-args';
import { levels } from '@app/core/log';

export type Flags = {
	command?: string;
	help?: boolean;
	debug?: boolean;
	port?: string;
	'log-level'?: string;
	environment?: string;
};

export const args: ArgumentConfig<Flags> = {
	command: { type: String, defaultOption: true, optional: true },
	help: { type: Boolean, optional: true, alias: 'h', description: 'Prints this usage guide.' },
	debug: { type: Boolean, optional: true, alias: 'd', description: 'Enabled debug mode.' },
	port: { type: String, optional: true, alias: 'p', description: 'Set the graphql port.' },
	environment: { type: String, typeLabel: '{underline production/staging/development}', optional: true, description: 'Set the working environment.' },
	'log-level': { type: (level?: string) => levels.includes(level as any) ? level : undefined, typeLabel: `{underline ${levels.join('/')}}`, optional: true, description: 'Set the log level.' },
};

export const options: ArgsParseOptions<Flags> = {
	helpArg: 'help',
	optionSections: [{
		hide: ['command'],
	}],
	baseCommand: 'unraid-api',
	headerContentSections: [{ header: 'Unraid API', content: 'Thanks for using the official Unraid API' }, {
		header: 'Usage:',
		content: '$ unraid-api {underline command} <options>',
	}, {
		header: 'Options:',
	}],
	footerContentSections: [{ header: '', content: 'Copyright © 2021 Lime Technology, Inc.' }],
};

export const mainOptions = parse<Flags>(args, { ...options, partial: true, stopAtFirstUnknown: true });
