/*!
 * Copyright 2022 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

import { paths } from '../paths';
import { Nginx } from '../types/states';
import { IniStringBooleanOrAuto } from '../types/ini';
import { State } from './state';
import { parseConfig } from '../utils/misc';

interface NginxIni {
	nginxLanip: string;
	nginxLanname: string;
	nginxLanmdns: string;
	nginxCertpath: string;
	nginxUsessl: IniStringBooleanOrAuto;
	nginxPort: string;
	nginxPortssl: string;
	nginxCertname: string;
	nginxLanfqdn: string;
	nginxWanfqdn: string;
	nginxWanip: string;
}

const parse = (state: NginxIni): Nginx => {
	return {
		lanIp: state.nginxLanip,
		lanName: state.nginxLanname,
		lanMdns: state.nginxLanmdns,
		certificatePath: state.nginxCertpath,
		sslMode: state.nginxUsessl,
		sslEnabled: state.nginxUsessl !== 'no',
		httpPort: Number(state.nginxPort),
		httpsPort: Number(state.nginxPortssl),
		certificateName: state.nginxCertname,
		lanFqdn: state.nginxLanfqdn,
		wanFqdn: state.nginxWanfqdn,
		wanIp: state.nginxWanip
	};
};

interface ParseOptions {
	/** If the internal store should be updated with the new data. */
	set?: boolean;
	/** If the main bus should receive an event with the new data. */
	emit?: boolean;
}

class NginxState extends State {
	private static instance: NginxState;
	public channel = 'nginx';
	_data: Nginx | undefined;

	constructor() {
		super();

		if (NginxState.instance) {
			// eslint-disable-next-line no-constructor-return
			return NginxState.instance;
		}

		NginxState.instance = this;
	}

	get data() {
		if (!this._data) {
			const statePath = paths.get('nginx-state')!;
			const state = parseConfig<NginxIni>({
				filePath: statePath,
				type: 'ini'
			});
			this._data = this.parse(state);
		}

		return this._data;
	}

	parse(state: NginxIni, options?: ParseOptions): Nginx {
		const { set, emit } = { emit: true, set: true, ...options };
		const data = parse(state);

		// Update nginx channel with new data
		if (emit) {
			this.emit('UPDATED', data);
		}

		if (set) {
			this.set(data);
		}

		return data;
	}
}

export const nginxState = new NginxState();
