import { execa } from 'execa';

import type { NotifierOptions, NotifierSendOptions } from '@app/core/notifiers/notifier.js';
import { logger } from '@app/core/log.js';
import { Notifier } from '@app/core/notifiers/notifier.js';

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

        this.level = options.importance ?? this.convertNotifierLevel(options.level ?? 'info');
        this.template = options.template ?? '{{ message }}';
    }

    async send(options: NotifierSendOptions) {
        const { title, data } = options;
        const { level } = this;

        const template = this.render(data);
        try {
            await execa('/usr/local/emhttp/webGui/scripts/notify', [
                '-i',
                `${level}`,
                '-s',
                'Unraid API',
                '-d',
                `${template}`,
                '-e',
                `${title}`,
            ]);
        } catch (error: unknown) {
            logger.warn(
                `Error sending unraid notification: ${error instanceof Error ? error.message : 'No Error Information'}`
            );
        }
    }
}
