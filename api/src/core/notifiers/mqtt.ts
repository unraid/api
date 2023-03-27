/*!
 * Copyright 2019-2022 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

import mqtt, { type MqttClient } from 'mqtt';
import { Notifier, type NotifierOptions, type NotifierSendOptions } from '@app/core/notifiers/notifier';

interface Options extends NotifierOptions {
	connectionUri: string;
	username: string;
	password: string;
	topic: string;
}

/**
 * MQTT notifier.
 */
export class MqttNotifier extends Notifier {
	private static instance: MqttNotifier;

	/** The current MQTT client. */
	private readonly client!: MqttClient;

	/** The current MQTT topic. */
	private readonly topic!: string;

	constructor(options: Options) {
		super(options);

		if (MqttNotifier.instance) {
			// eslint-disable-next-line no-constructor-return
			return MqttNotifier.instance;
		}

		// Set for later
		this.topic = options.topic;

		const { connectionUri = 'tcp://localhost:1883', username, password } = options;

		// Prevents us reconnecting every time we want to send a notification
		this.client = mqtt.connect(connectionUri, {
			username,
			password,
		});

		MqttNotifier.instance = this;
	}

	async send(options: NotifierSendOptions) {
		const { client, topic } = this;
		const { title, ...rest } = options;

		// Reconect if needed
		if (!client.connected) {
			client.reconnect();
		}

		// Send
		return client.publish(topic, JSON.stringify({
			title,
			...rest,
		}));
	}
}
