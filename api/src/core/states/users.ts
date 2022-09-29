/*!
 * Copyright 2019-2022 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

import mm from 'micromongo';
import path from 'path';
import { User } from '@app/core/types/states/user';
import { LooseObject } from '@app/core/types';
import { parseConfig } from '@app/core/utils/misc/parse-config';
import { ArrayState } from '@app/core/states/state';
import { getters } from '@app/store';

type BooleanString = 'yes' | 'no';

interface UserIni {
	idx: string;
	name: string;
	desc?: string;
	passwd: BooleanString;
}

const parseUser = (state: UserIni): User => {
	const { idx, name, desc, passwd } = state;
	const user: User = {
		id: idx,
		name,
		description: desc ?? '',
		password: passwd === 'yes',
		role: name === 'root' ? 'admin' : 'user',
	};

	return user;
};

const parse = (states: UserIni[]): User[] => Object.values(states).map(parseUser);

export class Users extends ArrayState {
	private static instance: Users;
	public channel = 'users';

	constructor() {
		super();

		if (Users.instance) {
			// eslint-disable-next-line no-constructor-return
			return Users.instance;
		}

		Users.instance = this;
	}

	get data() {
		if (this._data.length === 0) {
			const statesDirectory = getters.paths().states;
			const statePath = path.join(statesDirectory, 'users.ini');
			const state = parseConfig<UserIni[]>({
				filePath: statePath,
				type: 'ini',
			});
			this._data = this.parse(state);
		}

		return this._data;
	}

	parse(state: UserIni[]): User[] {
		const data = parse(state);

		// Update users channel with new users
		this.emit('UPDATED', data);

		// Update local data
		this.set(data);

		return data;
	}

	find(query?: LooseObject): User[] {
		return mm.find(this.data, query);
	}

	findOne(query: LooseObject = {}): User | void {
		return mm.findOne(this.data, query);
	}
}

export const usersState = new Users();
