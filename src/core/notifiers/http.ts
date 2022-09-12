/*!
 * Copyright 2019-2022 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

import { got } from 'got';
import { Notifier, NotifierOptions } from '@app/core/notifiers/notifier';

export interface Options extends NotifierOptions {}

/**
 * HTTP notifier.
 */
export class HttpNotifier extends Notifier {
	readonly $http = got;

	// eslint-disable-next-line @typescript-eslint/no-useless-constructor
	constructor(options: Options) {
		super(options);
	}
}
