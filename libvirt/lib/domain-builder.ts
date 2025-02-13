/**
 * Copyright 2019 Leon Rinkel <leon@rinkel.me> and vmngr/libvirt contributers.
 *
 * This file is part of the vmngr/libvirt project and is subject to the MIT
 * license as in the LICENSE file in the project root.
 *
 * @brief Contains a builder class to construct domain descriptions.
 */

import {
	DomainDesc,
	DomainDiskDesc,
	DomainInterfaceDesc,
	DomainGraphicsDesc
} from './domain-desc';

export class DomainBuilder {
	private domainDesc: DomainDesc = { };

	fromTemplate(templateDesc: DomainDesc): DomainBuilder {
		this.domainDesc = templateDesc;
		return this;
	}

	setName(name: string): DomainBuilder {
		this.domainDesc.name = name;
		return this;
	}

	setUUID(uuid: string): DomainBuilder {
		this.domainDesc.uuid = uuid;
		return this;
	}

	addDisk(diskDesc: DomainDiskDesc): DomainBuilder {
		if (!this.domainDesc.devices) {
			this.domainDesc.devices = [];
		}

		this.domainDesc.devices.push({ type: 'disk', disk: diskDesc });
		return this;
	}

	removeDisks(): DomainBuilder {
		if (this.domainDesc.devices) {
			this.domainDesc.devices = this.domainDesc.devices.filter(device => device.type !== 'disk');
		}

		return this;
	}

	addInterface(interfaceDesc: DomainInterfaceDesc): DomainBuilder {
		if (!this.domainDesc.devices) {
			this.domainDesc.devices = [];
		}

		this.domainDesc.devices.push({ type: 'interface', interface: interfaceDesc });
		return this;
	}

	removeInterfaces(): DomainBuilder {
		if (this.domainDesc.devices) {
			this.domainDesc.devices = this.domainDesc.devices.filter(device => device.type !== 'interface');
		}

		return this;
	}

	addGraphics(graphicsDesc: DomainGraphicsDesc): DomainBuilder {
		if (!this.domainDesc.devices) {
			this.domainDesc.devices = [];
		}

		this.domainDesc.devices.push({ type: 'graphics', graphics: graphicsDesc });
		return this;
	}

	removeGraphics(): DomainBuilder {
		if (this.domainDesc.devices) {
			this.domainDesc.devices = this.domainDesc.devices.filter(device => device.type !== 'graphics');
		}

		return this;
	}

	build = (): DomainDesc => this.domainDesc;
}
