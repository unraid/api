/*!
 * Copyright 2019-2020 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

import mm from 'micromongo';
import { bus } from '../bus';
import { LooseObject } from '../types';

type Mutation = 'CREATED' | 'UPDATED' | 'DELETED';

export class State {
	channel?: string;
	_data?: {
		[key: string]: any;
	};
	lastUpdated: Date;

	constructor() {
		this.lastUpdated = new Date();
	}

	set(data: any) {
		this.lastUpdated = new Date();
		this._data = data;

		return this._data;
	}

	set data(data: any) {
		this._data = data;
	}

	/**
	 * Resets state
	 */
	reset() {
		this._data = undefined;
	}

	public emit(mutation: Mutation, node: LooseObject) {
		const channel = this.channel;

		// Bail since we have no channel to post to
		if (!channel) return;

		// Update channel with new state
		bus.emit(channel, {
			[channel]: {
				mutation,
				node
			}
		});
	}
}

export class ArrayState extends State {
	_data: any[];

	constructor() {
		super();

		this._data = [];
	}

	find(query: LooseObject = {}) {
		return mm.find(this.data, query);
	}

	findOne(query: LooseObject = {}) {
		return mm.findOne(this.data, query);
	}
}
