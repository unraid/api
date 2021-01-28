/*!
 * Copyright 2019-2020 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

import fetch from 'node-fetch';
import { Notifier, NotifierOptions } from './notifier';

export interface Options extends NotifierOptions {}

/**
 * HTTP notifier.
 */
export class HttpNotifier extends Notifier {
	readonly $http = fetch;

	constructor(options: Options) {
		super(options);
	}
}
