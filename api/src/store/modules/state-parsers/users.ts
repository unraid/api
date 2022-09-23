import { User, Users } from '@app/core/types/states/user';

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

export const parse = (states: UserIni[]): Users => Object.values(states).map(parseUser);
