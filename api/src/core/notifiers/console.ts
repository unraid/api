import type { NotifierOptions, NotifierSendOptions } from '@app/core/notifiers/notifier.js';
import { logger } from '@app/core/log.js';
import { Notifier } from '@app/core/notifiers/notifier.js';

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
        const { level } = this;
        // Render template
        const template = this.render({ ...data });

        this.log[level](title, template);
    }
}
