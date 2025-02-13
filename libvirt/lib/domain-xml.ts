/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable no-case-declarations */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/**
 * Copyright 2019 Leon Rinkel <leon@rinkel.me> and vmngr/libvirt contributers.
 *
 * This file is part of the vmngr/libvirt project and is subject to the MIT
 * license as in the LICENSE file in the project root.
 *
 * @brief Contains helper functions to deserialize / serialize domain
 *  descriptions from / to XML.
 */

import xml2js from 'xml2js';

import {
	DomainDesc,
	DomainOsDesc,
	DomainDiskDesc,
	DomainInterfaceDesc,
	DomainGraphicsDesc
} from './domain-desc';

const $ = {};

export const domainOsXml = {
	serialize(osDesc: DomainOsDesc) {
		return {
			$,
			...(osDesc.type ? {
				type: {
					$: {
						...(osDesc.type.arch ? {
							arch: osDesc.type.arch
						} : {}),
						...(osDesc.type.machine ? {
							machine: osDesc.type.machine
						} : {})
					},
					...(osDesc.type.value ? {
						_: osDesc.type.value
					} : {})
				}
			} : {}),
			...(osDesc.boot ? {
				boot: {
					$: {
						...(osDesc.boot.dev ? {
							dev: osDesc.boot.dev
						} : {})
					}
				}
			} : {})
		};
	},

	deserialize(os: any): DomainOsDesc {
		const osDesc: DomainOsDesc = { };

		if (os.type[0]) {
			osDesc.type = { };
			if (os.type[0].$.arch) {
				osDesc.type.arch = os.type[0].$.arch;
			}

			if (os.type[0].$.machine) {
				osDesc.type.machine = os.type[0].$.machine;
			}

			if (os.type[0]._) {
				osDesc.type.value = os.type[0]._;
			}
		}

		if (os.boot[0]) {
			osDesc.boot = { };
			if (os.boot[0].$.dev) {
				osDesc.boot.dev = os.boot[0].$.dev;
			}
		}

		return osDesc;
	}

};

export const domainDiskXml = {
	serialize(diskDesc: DomainDiskDesc) {
		return {
			$: {
				...(diskDesc.type ? { type: diskDesc.type } : {}),
				...(diskDesc.device ? { device: diskDesc.device } : {})
			},
			...(diskDesc.driver ? {
				driver: {
					$: {
						...(diskDesc.driver.name ? { name: diskDesc.driver.name } : {}),
						...(diskDesc.driver.type ? { type: diskDesc.driver.type } : {})
					}
				}
			} : {}),
			...(diskDesc.source ? {
				source: {
					$: {
						...(diskDesc.source.file ? { file: diskDesc.source.file } : {})
					}
				}
			} : {}),
			...(diskDesc.target ? {
				target: {
					$: {
						...(diskDesc.target.dev ? { dev: diskDesc.target.dev } : {}),
						...(diskDesc.target.bus ? { bus: diskDesc.target.bus } : {})
					}
				}
			} : {})
		};
	},

	deserialize(disk: any): DomainDiskDesc {
		const diskDesc: DomainDiskDesc = { };

		if (disk.$.type) {
			diskDesc.type = disk.$.type;
		}

		if (disk.$.device) {
			diskDesc.device = disk.$.device;
		}

		if (disk.driver[0]) {
			diskDesc.driver = { };
			if (disk.driver[0].$.name) {
				diskDesc.driver.name = disk.driver[0].$.name;
			}

			if (disk.driver[0].$.type) {
				diskDesc.driver.type = disk.driver[0].$.type;
			}
		}

		if (disk.source[0]) {
			diskDesc.source = { };
			if (disk.source[0].$.file) {
				diskDesc.source.file = disk.source[0].$.file;
			}
		}

		if (disk.target[0]) {
			diskDesc.target = { };
			if (disk.target[0].$.dev) {
				diskDesc.target.dev = disk.target[0].$.dev;
			}

			if (disk.target[0].$.bus) {
				diskDesc.target.bus = disk.target[0].$.bus;
			}
		}

		return diskDesc;
	}

};

export const domainInterfaceXml = {
	serialize(interfaceDesc: DomainInterfaceDesc): Record<string, unknown> {
		return {
			$: {
				...(interfaceDesc.type ? { type: interfaceDesc.type } : {})
			},
			...(interfaceDesc.source ? {
				source: {
					$: {
						...(interfaceDesc.source.network ? { network: interfaceDesc.source.network } : {})
					}
				}
			} : {}),
			...(interfaceDesc.mac ? {
				mac: {
					$: {
						...(interfaceDesc.mac.address ? { address: interfaceDesc.mac.address } : {})
					}
				}
			} : {}),
			...(interfaceDesc.model ? {
				model: {
					$: {
						...(interfaceDesc.model.type ? { type: interfaceDesc.model.type } : {})
					}
				}
			} : {})
		};
	},

	deserialize(iface: any): DomainInterfaceDesc {
		const interfaceDesc: DomainInterfaceDesc = { };

		if (iface.$.type) {
			interfaceDesc.type = iface.$.type;
		}

		if (iface.source[0]) {
			interfaceDesc.source = { };
			if (iface.source[0].$.network) {
				interfaceDesc.source.network = iface.source[0].$.network;
			}
		}

		if (iface.mac[0]) {
			interfaceDesc.mac = { };
			if (iface.mac[0].$.address) {
				interfaceDesc.mac.address = iface.mac[0].$.address;
			}
		}

		if (iface.model[0]) {
			interfaceDesc.model = { };
			if (iface.model[0].$.type) {
				interfaceDesc.model.type = iface.model[0].$.type;
			}
		}

		return interfaceDesc;
	}

};

export const domainGraphicsXml = {
	serialize(graphicsDesc: DomainGraphicsDesc) {
		return {
			$: {
				...(graphicsDesc.type ? { type: graphicsDesc.type } : {}),
				...(graphicsDesc.port ? { port: graphicsDesc.port } : {}),
				...(graphicsDesc.listen ? { listen: graphicsDesc.listen } : {}),
				...(graphicsDesc.passwd ? { passwd: graphicsDesc.passwd } : {})
			}
		};
	},
	deserialize(graphics: {
		$: {
			passwd?: string;
			listen?: string;
			port?: number;
			type?: 'vnc';
		};
	}): DomainGraphicsDesc {
		return {
			...(graphics.$.type ? { type: graphics.$.type } : {}),
			...(graphics.$.port ? { port: Number(graphics.$.port) } : {}),
			...(graphics.$.listen ? { listen: graphics.$.listen } : {}),
			...(graphics.$.passwd ? { passwd: graphics.$.passwd } : {})
		};
	}
};

// eslint-disable-next-line complexity
export function domainDescToXml(desc: DomainDesc): string {
	const domain: any = { $: { } };

	if (desc.type) {
		domain.$.type = desc.type;
	}

	if (desc.id) {
		domain.$.id = desc.id;
	}

	if (desc.name) {
		domain.name = desc.name;
	}

	if (desc.uuid) {
		domain.uuid = desc.uuid;
	}

	if (desc.memory) {
		domain.memory = { $: { } };
		if (desc.memory.unit) {
			domain.memory.$.unit = desc.memory.unit;
		}

		if (desc.memory.value) {
			domain.memory._ = desc.memory.value;
		}
	}

	if (desc.currentMemory) {
		domain.currentMemory = { $: { } };
		if (desc.currentMemory.unit) {
			domain.currentMemory.$.unit = desc.currentMemory.unit;
		}

		if (desc.currentMemory.value) {
			domain.currentMemory._ = desc.currentMemory.value;
		}
	}

	if (desc.vcpu) {
		domain.vcpu = { $: { } };
		if (desc.vcpu.placement) {
			domain.vcpu.$.placement = desc.vcpu.placement;
		}

		if (desc.vcpu.value) {
			domain.vcpu._ = desc.vcpu.value;
		}
	}

	if (desc.os) {
		domain.os = domainOsXml.serialize(desc.os);
	}

	if (desc.devices) {
		domain.devices = {
			emulator: [],
			disk: [],
			interface: [],
			console: [],
			graphics: []
		};

		for (const deviceDesc of desc.devices) {
			const device: any = { $: { } };

			switch (deviceDesc.type) {
				case 'emulator':
					const emulatorDesc = deviceDesc.emulator;
					if (emulatorDesc.value) {
						device._ = emulatorDesc.value;
					}

					domain.devices.emulator.push(device);
					break;

				case 'disk':
					domain.devices.disk.push(
						domainDiskXml.serialize(deviceDesc.disk));
					break;

				case 'interface':
					domain.devices.interface.push(
						domainInterfaceXml.serialize(deviceDesc.interface));
					break;

				case 'console':
					const consoleDesc = deviceDesc.console;
					if (consoleDesc.type) {
						device.$.type = consoleDesc.type;
					}

					domain.devices.console.push(device);
					break;

				case 'graphics':
					domain.devices.graphics.push(
						domainGraphicsXml.serialize(deviceDesc.graphics));
					break;

				default:
			}
		}
	}

	const builder = new xml2js.Builder({ headless: true });
	return builder.buildObject({ domain });
}

// eslint-disable-next-line complexity
export async function domainDescFromXml(xml: string): Promise<DomainDesc> {
	const domainDesc: DomainDesc = { };
	const parsed = await xml2js.parseStringPromise(xml);

	if (!parsed.domain) {
		throw new Error('Unable to parse domain xml');
	}

	if (parsed.domain.$.type) {
		domainDesc.type = parsed.domain.$.type;
	}

	if (parsed.domain.$.id) {
		domainDesc.id = parsed.domain.$.id;
	}

	if (parsed.domain.name?.[0]) {
		domainDesc.name = parsed.domain.name[0];
	}

	if (parsed.domain.uuid?.[0]) {
		domainDesc.uuid = parsed.domain.uuid[0];
	}

	if (parsed.domain.memory?.[0]) {
		if (typeof parsed.domain.memory[0] === 'object') {
			domainDesc.memory = {
				value: Number(parsed.domain.memory[0]._),
				unit: parsed.domain.memory[0].$.unit
			};
		} else if (typeof parsed.domain.memory[0] === 'string') {
			domainDesc.memory = {
				value: Number(parsed.domain.memory[0])
			};
		}
	}

	if (parsed.domain.currentMemory?.[0]) {
		if (typeof parsed.domain.currentMemory[0] === 'object') {
			domainDesc.currentMemory = {
				value: Number(parsed.domain.currentMemory[0]._),
				unit: parsed.domain.currentMemory[0].$.unit
			};
		} else if (typeof parsed.domain.currentMemory[0] === 'string') {
			domainDesc.currentMemory = {
				value: Number(parsed.domain.currentMemory[0])
			};
		}
	}

	if (parsed.domain.vcpu?.[0]) {
		if (typeof parsed.domain.vcpu[0] === 'object') {
			domainDesc.vcpu = {
				value: Number(parsed.domain.vcpu[0]._),
				placement: parsed.domain.vcpu[0].$.placement
			};
		} else if (typeof parsed.domain.vcpu[0] === 'string') {
			domainDesc.vcpu = {
				value: Number(parsed.domain.vcpu[0])
			};
		}
	}

	if (parsed.domain.os?.[0]) {
		domainDesc.os = domainOsXml.deserialize(parsed.domain.os[0]);
	}

	if (parsed.domain.devices?.[0]) {
		domainDesc.devices = [];

		if (parsed.domain.devices[0].emulator) {
			domainDesc.devices.push({
				type: 'emulator',
				emulator: {
					value: parsed.domain.devices[0].emulator[0]
				}
			});
		}

		if (parsed.domain.devices[0].disk) {
			for (const disk of parsed.domain.devices[0].disk) {
				domainDesc.devices.push({
					type: 'disk',
					disk: domainDiskXml.deserialize(disk)
				});
			}
		}

		if (parsed.domain.devices[0].interface) {
			for (const iface of parsed.domain.devices[0].interface) {
				domainDesc.devices.push({
					type: 'interface',
					interface: domainInterfaceXml.deserialize(iface)
				});
			}
		}

		if (parsed.domain.devices[0].console) {
			for (const cnsole of parsed.domain.devices[0].console) {
				domainDesc.devices.push({
					type: 'console',
					console: { type: cnsole.$.type }
				});
			}
		}

		if (parsed.domain.devices[0].graphics) {
			for (const graphics of parsed.domain.devices[0].graphics) {
				domainDesc.devices.push({
					type: 'graphics',
					graphics: domainGraphicsXml.deserialize(graphics)
				});
			}
		}
	}

	return domainDesc;
}
