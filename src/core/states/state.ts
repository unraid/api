/*!
 * Copyright 2019-2022 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

import mm from 'micromongo';
import { bus } from '@app/core/bus';
import { LooseObject } from '@app/core/types';

type Mutation = 'CREATED' | 'UPDATED' | 'DELETED';

export class State {
	channel?: string;
	_data?: Record<string, any>;
	_source: 'nchan' | 'file' = 'nchan';

	lastUpdated: Date;

	constructor() {
		this.lastUpdated = new Date();
	}

	set(data: any) {
		this.lastUpdated = new Date();
		this._data = data;

		return this._data;
	}

	get data() {
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
		if (!channel) {
			return;
		}

		// Update channel with new state
		bus.emit(channel, {
			[channel]: {
				mutation,
				node
			}
		});
	}

	/**
	 * Switch between nchan and file as the source of data
	 */
	switchSource(source: 'nchan' | 'file', timeout = 60_000) {
		// If the source hasn't changed just return
		if (this._source === source) return;

		// Save original source for timeout
		const originalSource = this._source;

		// Switch the source and clear the data
		this._source = source;
		this._data = undefined;

		// Flip back to the original source after the timeout
		if (timeout) {
			setTimeout(() => {
				this._source = originalSource;
			}, timeout);
		}
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
