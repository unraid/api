/*!
 * Copyright 2019-2020 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

import { Notifier, NotifierOptions, NotifierSendOptions } from './notifier';
import { log } from '../log';

/**
 * Console notifier.
 */
export class ConsoleNotifier extends Notifier {
	private readonly log: typeof log;

	constructor(options: NotifierOptions) {
		super(options);

		this.level = options.level || 'info';
		this.helpers = options.helpers ?? {};
		this.template = options.template ?? '{{{ json }}}';
		this.log = log;
	}

	/**
	 * Send notification.
	 */
	send(options: NotifierSendOptions) {
		const { title, data } = options;
		const { level, helpers } = this;
		// Render template
		const template = this.render({ ...data }, helpers);

		this.log[level](title, template);
	}
}
