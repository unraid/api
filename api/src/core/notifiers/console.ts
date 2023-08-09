import { Notifier, type NotifierOptions, type NotifierSendOptions } from '@app/core/notifiers/notifier';
import { logger } from '@app/core/log';

/**
 * Console notifier.
 */
export class ConsoleNotifier extends Notifier {
	private readonly log: typeof logger;

	constructor(options: NotifierOptions = {}) {
		super(options);

		this.level = options.level ?? 'info';
		this.helpers = options.helpers ?? {};
		this.template = options.template ?? '{{{ data }}}';
		this.log = logger;
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
