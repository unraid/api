/*!
 * Copyright 2019-2020 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

import mm from 'micromongo';
import path from 'path';
import { paths } from '../paths';
import { User } from '../types/states';
import { LooseObject } from '../types';
import { parseConfig } from '../utils/misc';
import { ArrayState } from './state';

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
		role: name === 'root' ? 'admin' : 'user'
	};

	return user;
};

const parse = (states: UserIni[]): User[] => Object.values(states).map(parseUser);

class Users extends ArrayState {
	public channel = 'users';
	private static instance: Users;

	constructor() {
		super();

		if (Users.instance) {
			return Users.instance;
		}

		Users.instance = this;
	}

	get data() {
		if (this._data.length === 0) {
			const statesDirectory = paths.get('states')!;
			const statePath = path.join(statesDirectory, 'users.ini');
			const state = parseConfig<UserIni[]>({
				filePath: statePath,
				type: 'ini'
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
