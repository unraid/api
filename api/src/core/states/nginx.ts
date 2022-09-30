/*!
 * Copyright 2022 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

import { Nginx } from '@app/core/types/states/nginx';
import { IniStringBooleanOrAuto } from '@app/core/types/ini';
import { State } from '@app/core/states/state';
import { parseConfig } from '@app/core/utils/misc/parse-config';
import { getters } from '@app/store';

export interface NginxIni {
	nginxCertname: string;
	nginxCertpath: string;
	nginxDefaulturl: string;
	nginxLanfqdn: string;
	nginxLanfqdn6: string;
	nginxLanip: string;
	nginxLanmdns: string;
	nginxLanname: string;
	nginxPort: string;
	nginxPortssl: string;
	nginxUsessl: IniStringBooleanOrAuto;
	nginxWanfqdn: string;
	nginxWanfqdn6: string;
	nginxWanip: string;
	nginxWanaccess: string;
}

const parse = (state: NginxIni): Nginx => ({
	certificateName: state.nginxCertname,
	certificatePath: state.nginxCertpath,
	defaultUrl: state.nginxDefaulturl,
	httpPort: Number(state.nginxPort),
	httpsPort: Number(state.nginxPortssl),
	lanFqdn: state.nginxLanfqdn,
	lanFqdn6: state.nginxLanfqdn6,
	lanIp: state.nginxLanip,
	lanMdns: state.nginxLanmdns,
	lanName: state.nginxLanname,
	sslEnabled: state.nginxUsessl !== 'no',
	sslMode: state.nginxUsessl,
	wanAccessEnabled: state.nginxWanaccess === 'yes',
	wanFqdn: state.nginxWanfqdn,
	wanFqdn6: state.nginxWanfqdn6,
	wanIp: state.nginxWanip,
});

interface ParseOptions {
	/** If the internal store should be updated with the new data. */
	set?: boolean;
	/** If the main bus should receive an event with the new data. */
	emit?: boolean;
}

export class NginxState extends State {
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
			const statePath = getters.paths()['nginx-state'];
			const state = parseConfig<NginxIni>({
				filePath: statePath,
				type: 'ini',
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
