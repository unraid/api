/*!
 * Copyright 2019-2022 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

import Mustache from 'mustache';
import { type LooseObject } from '@app/core/types';

export type NotifierLevel = 'info' | 'warn' | 'error';

export type NotifierOptions = Partial<{
	level: NotifierLevel;
	helpers?: Record<string, unknown>;
	template?: string;
}>;

export interface NotifierSendOptions {
	/** Which type of notification. */
	type?: string;
	/** The notification's title. */
	title: string;
	/** Static data passed for rendering. */
	data: LooseObject;
	/** Functions to generate dynamic data for rendering. */
	computed?: LooseObject;
}

/**
 * Base notifier.
 * @param Alert level.
 * @param Helpers to pass to the notifer.
 * @param Template for the notifer to render.
 * @private
 */
export class Notifier {
	template: string;
	helpers: LooseObject;
	level: string;

	constructor(options: NotifierOptions) {
		this.template = options.template ?? '{{{ data }}}';
		this.helpers = options.helpers ?? {};
		this.level = options.level ?? 'info';
	}

	/**
	 * Render template.
	 * @param data Static data for template rendering.
	 * @param helpers Functions for template rendering.
	 * @param computed Functions to generate dynamic data for rendering.
	 */
	render(data: LooseObject, helpers: LooseObject, computed?: LooseObject): string {
		/**
		 * Globally exposed helpers + computed functions from user.
		 */
		const computedFunctions = {
			json: JSON.stringify(data, null, 2),
			...computed,
		};

		return Mustache.render(this.template, {
			...data,
			...helpers,
			...computedFunctions,
		});
	}

	/**
	 * Generates a mustache helper.
	 * @param func Function to be wrapped.
	 */
	generateHelper(func: (text: string) => string) {
		return () => (text: string, render: (text: string) => string) => func(render(text));
	}
}
