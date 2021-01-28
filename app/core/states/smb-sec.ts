/*!
 * Copyright 2019-2020 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

import path from 'path';
import { paths } from '../paths';
import { ArrayState } from './state';
import { parseConfig } from '../utils/misc';
import { SecIni } from '../types';

/**
 * Security
 */
type SecSecurity =
	/**
	 * When logged into the server as Guest, a macOS user can view and read/write all shares set as Public.
	 * Files created or modified in the share will be owned by user nobody of the users group.
	 * macOS users logged in with a user name/password previously created on the server can also view and read/write all shares set as Public.
	 * In this case, files created or modified on the server will be owned by the logged in user.
	 */
	'Public' |
	/**
	 * When logged into the server as Guest, a macOS user can view and read(but not write) all shares set as Secure.
	 * macOS users logged in with a user name/password previously created on the server can also view and read all shares set as Secure.
	 * If their access right is set to read/write for the share on the server, they may also write the share.
	 */
	'Secure' |
	/**
	 * When logged onto the server as Guest, no Private shares are visible or accessible to any macOS user.
	 * macOS users logged in with a user name/password previously created on the server may
	 * have read or read/write(or have no access)according their access right for the share on the server. */
	'Private';

interface SmbSecIni extends SecIni {
	/**
	 * This limits the reported volume size, preventing TimeMachine from using the entire real disk space for backup.
	 * For example, setting this value to "1024" would limit the reported disk space to 1GB.
	 */
	volsizelimit: string;
	security: SecSecurity;
}

const parse = (state: SmbSecIni[]) => {
	return Object.entries(state).map(([_name, state]) => {
		const { export: enabled, security, writeList, readList, volsizelimit, ...rest } = state;

		return {
			enabled: enabled === 'e',
			security,
			writeList: writeList ? writeList.split(',') : [],
			readList: readList ? readList.split(',') : [],
			timemachine: {
				volsizelimit: Number.parseInt(volsizelimit, 10)
			},
			...rest
		};
	});
};

class SmbSec extends ArrayState {
	public channel = 'smb-sec';
	private static instance: SmbSec;

	constructor() {
		super();

		if (SmbSec.instance) {
			return SmbSec.instance;
		}

		SmbSec.instance = this;
	}

	get data() {
		if (this._data.length === 0) {
			const statesDirectory = paths.get('states')!;
			const statePath = path.join(statesDirectory, 'sec.ini');
			const state = parseConfig<SmbSecIni[]>({
				filePath: statePath,
				type: 'ini'
			});
			this._data = this.parse(state);
		}

		return this._data;
	}

	parse(state: SmbSecIni[]): any[] {
		const data = parse(state);
		this.set(data);
		return data;
	}

	find(query?: Record<string, unknown>): any[] {
		return super.find(query);
	}
}

export const smbSecState = new SmbSec();
