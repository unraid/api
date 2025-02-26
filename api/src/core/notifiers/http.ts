import { got } from 'got';

import type { NotifierOptions } from '@app/core/notifiers/notifier.js';
import { Notifier } from '@app/core/notifiers/notifier.js';

export type Options = NotifierOptions;

/**
 * HTTP notifier.
 */
export class HttpNotifier extends Notifier {
    readonly $http = got;

    constructor(options: Options) {
        super(options);
    }
}
