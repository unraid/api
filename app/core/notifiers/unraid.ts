/*!
 * Copyright 2019-2020 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

import { HttpNotifier, Options as HttpNotifierOptions } from './http';
import { NotifierSendOptions } from './notifier';

type Transport = 'email' | 'push' | 'ios' | 'android';

interface Options extends HttpNotifierOptions {
	transport?: Transport
}

/**
 * Send notification through UNRAID's remote server.
 */
export class UnraidNotifier extends HttpNotifier {
	private readonly transport: Transport;
	private readonly endpoint: string;

	constructor(options: Options) {
		super(options);

		this.transport = options.transport ?? 'email';
		this.endpoint = 'https://forums.unraid.net/api/notifier.php';
	}

	/**
	 * Send notification.
	 */
	async send(options: NotifierSendOptions) {
		const { endpoint, transport } = this;
		const { type = 'generic', title = 'Unraid Server Notification' } = options;
		const { ...body } = options.data;

		const headers = {
			Accept: 'application/json, text/plain, */*',
			'Content-Type': 'application/json'
		};

		return this.$http(endpoint, {
			method: 'POST',
			headers,
			body: JSON.stringify({
				type,
				title,
				body,
				transport
			})
		});
	}
}
