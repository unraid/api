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
	nginxCertname: string;
	nginxCertpath: string;
	nginxDefaulturl: string;
	nginxLanfqdn: string;
	nginxLanip: string;
	nginxLanmdns: string;
	nginxLanname: string;
	nginxPort: string;
	nginxPortssl: string;
	nginxUsessl: IniStringBooleanOrAuto;
	nginxWanfqdn: string;
	nginxWanip: string;
	nginxWanaccess: string;
}

const parse = (state: NginxIni): Nginx => {
	return {
		certificateName: state.nginxCertname,
		certificatePath: state.nginxCertpath,
		defaultUrl: state.nginxDefaulturl,
		httpPort: Number(state.nginxPort),
		httpsPort: Number(state.nginxPortssl),
		lanFqdn: state.nginxLanfqdn,
		lanIp: state.nginxLanip,
		lanMdns: state.nginxLanmdns,
		lanName: state.nginxLanname,
		sslEnabled: state.nginxUsessl !== 'no',
		sslMode: state.nginxUsessl,
		wanAccessEnabled: state.nginxWanaccess === 'yes',
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
