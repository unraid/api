import { logger } from '@app/core/log';
import { Notifier, type NotifierSendOptions, type NotifierOptions } from '@app/core/notifiers/notifier';
import { execa } from 'execa';

type ValidLocalLevels = 'alert' | 'warning' | 'normal';

export class UnraidLocalNotifier extends Notifier {
	private convertNotifierLevel(level: NotifierOptions['level']): ValidLocalLevels {
		switch (level) {
			case 'error':
				return 'alert';
			case 'warn':
				return 'warning';
			case 'info':
				return 'normal';
			default:
				return 'normal';
		}
	}

	constructor(options: NotifierOptions = {}) {
		super(options);

		this.level = this.convertNotifierLevel(options.level ?? 'info');
		this.helpers = options.helpers ?? {};
		this.template = options.template ?? '{{ data }}';
	}

	async send(options: NotifierSendOptions) {
		const { title, data } = options;
		const { level, helpers } = this;

		const template = this.render({ ...data }, helpers);
		try {
			await execa('/usr/local/emhttp/webGui/scripts/notify', ['-i', `${level}`, '-s', 'Unraid API', '-d', `${template}`, '-e', `${title}`]);
		} catch (error: unknown) {
			logger.warn(`Error sending unraid notification: ${error instanceof Error ? error.message : 'No Error Information'}`);
		}
	}
}
