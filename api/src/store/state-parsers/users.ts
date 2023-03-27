import { type User } from '@app/core/types/states/user';
import type { StateFileToIniParserMap } from '@app/store/types';

type BooleanString = 'yes' | 'no';

export type IniUser = {
	idx: string;
	name: string;
	desc?: string;
	passwd: BooleanString;
};

export type UsersIni = IniUser[];

const parseUser = (state: IniUser): User => {
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

export const parse: StateFileToIniParserMap['users'] = states => Object.values(states).map(parseUser);
