/*!
 * Copyright 2019-2020 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

import sendmail from 'sendmail';
import { logger } from '../log';
import { Notifier, NotifierOptions, NotifierSendOptions } from './notifier';

interface Options extends NotifierOptions {
	to: string;
	from?: string;
	replyTo?: string;
}

interface SendOptions extends NotifierSendOptions {}

/**
 * Email notifer
 */
export class EmailNotifier extends Notifier {
	private readonly to: string;
	private readonly from: string;
	private readonly replyTo: string;

	constructor(options: Options) {
		super(options);

		this.to = options.to;
		// @todo: replace with `no-reply@host.tld`.
		this.from = options.from ?? 'no-reply@tower.local';
		// @todo: replace with `user@host.tld`.
		this.replyTo = options.replyTo ?? 'root@tower.local';
	}

	send(options: SendOptions) {
		const { type = 'generic', title = 'Unraid Server Notification' } = options;
		const { to, from, replyTo, level } = this;
		// Only show info when in debug
		const silent = level !== 'debug';
		const sendMail = sendmail({ silent });

		// Default html templates
		const templates = {
			generic: `
				<h1>{{ title }}</h1>
				<p><pre>{{ json }}</pre></p>
			`.trim()
		};

		// Render template
		this.template = Object.keys(templates).includes(type) ? templates[type] : templates.generic;
		const html = this.render({ ...options, json: JSON.stringify(options.data, null, 2) }, this.helpers);

		sendMail({
			from,
			to,
			replyTo,
			subject: title,
			html
		}, (error, reply) => {
			logger.error(error?.stack);
			logger.info(reply);
		});
	}
}
