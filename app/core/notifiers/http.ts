/*!
 * Copyright 2019-2020 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

import got from 'got';
import { Notifier, NotifierOptions } from './notifier';

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
