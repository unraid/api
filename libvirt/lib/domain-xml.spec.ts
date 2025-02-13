/* eslint-disable @typescript-eslint/no-unsafe-argument */
/**
 * Copyright 2019 Leon Rinkel <leon@rinkel.me> and vmngr/libvirt contributers.
 *
 * This file is part of the vmngr/libvirt project and is subject to the MIT
 * license as in the LICENSE file in the project root.
 *
 * @brief Tests for domain-xml.ts.
 */

import { expect } from 'chai';
import xml2js from 'xml2js';

import {
	DomainOsDesc,
	DomainDiskDesc,
	DomainInterfaceDesc,
	DomainGraphicsDesc,
	DomainDesc
} from './domain-desc';
import {
	domainOsXml,
	domainDiskXml,
	domainInterfaceXml,
	domainGraphicsXml,
	domainDescToXml,
	domainDescFromXml
} from './domain-xml';

describe('DomainOs', () => {
	describe('serialize', () => {
		it('should work', () => {
			const os = domainOsXml.serialize({
				type: { arch: 'x86_64', machine: 'q35', value: 'hvm' },
				boot: { dev: 'hd' }
			});

			const builder = new xml2js.Builder({ headless: true });
			const actualXml = builder.buildObject({ os });

			const expectedXml =
`<os>
  <type arch="x86_64" machine="q35">hvm</type>
  <boot dev="hd"/>
</os>`;

			expect(actualXml).to.equal(expectedXml);
		});
	});

	describe('deserialize', () => {
		it('should work', async () => {
			const parsed = await xml2js.parseStringPromise(
				`<os>
  <type arch="x86_64" machine="q35">hvm</type>
  <boot dev="hd"/>
</os>`) as Record<string, any>;
			const actualOsDesc = domainOsXml.deserialize(parsed.os);

			const expectedOsDesc: DomainOsDesc = {
				type: { arch: 'x86_64', machine: 'q35', value: 'hvm' },
				boot: { dev: 'hd' }
			};

			expect(actualOsDesc).to.deep.equal(expectedOsDesc);
		});
	});
});

describe('DomainDisk', () => {
	describe('serialize', () => {
		it('should work', () => {
			const disk = domainDiskXml.serialize({
				type: 'file', device: 'disk',
				driver: { name: 'qemu', type: 'qcow2' },
				source: { file: '/home/leon/test1.img' },
				target: { dev: 'vda', bus: 'virtio' }
			});

			const builder = new xml2js.Builder({ headless: true });
			const actualXml = builder.buildObject({ disk });

			const expectedXml =
`<disk type="file" device="disk">
  <driver name="qemu" type="qcow2"/>
  <source file="/home/leon/test1.img"/>
  <target dev="vda" bus="virtio"/>
</disk>`;

			expect(actualXml).to.equal(expectedXml);
		});
	});

	describe('deserialize', () => {
		it('should work', async () => {
			const parsed = await xml2js.parseStringPromise(
				`<disk type="file" device="disk">
  <driver name="qemu" type="qcow2"/>
  <source file="/home/leon/test1.img"/>
  <target dev="vda" bus="virtio"/>
</disk>`) as Record<string, any>;
			const actualDiskDesc = domainDiskXml.deserialize(parsed.disk);

			const expectedDiskDesc: DomainDiskDesc = {
				type: 'file', device: 'disk',
				driver: { name: 'qemu', type: 'qcow2' },
				source: { file: '/home/leon/test1.img' },
				target: { dev: 'vda', bus: 'virtio' }
			};

			expect(actualDiskDesc).to.deep.equal(expectedDiskDesc);
		});
	});
});

describe('DomainInterface', () => {
	describe('serialize', () => {
		it('should work', () => {
			const iface = domainInterfaceXml.serialize({
				type: 'network',
				source: { network: 'default' },
				mac: { address: '52:54:00:8e:c6:5f' },
				model: { type: 'virtio' }
			});

			const builder = new xml2js.Builder({ headless: true });
			const actualXml = builder.buildObject({ interface: iface });

			const expectedXml =
`<interface type="network">
  <source network="default"/>
  <mac address="52:54:00:8e:c6:5f"/>
  <model type="virtio"/>
</interface>`;

			expect(actualXml).to.equal(expectedXml);
		});
	});

	describe('deserialize', () => {
		it('should work', async () => {
			const parsed = await xml2js.parseStringPromise(
				`<interface type="network">
<source network="default"/>
<mac address="52:54:00:8e:c6:5f"/>
<model type="virtio"/>
</interface>`) as Record<string, any>;
			const actualInterfaceDesc = domainInterfaceXml
				.deserialize(parsed.interface);

			const expectedInterfaceDesc: DomainInterfaceDesc = {
				type: 'network',
				source: { network: 'default' },
				mac: { address: '52:54:00:8e:c6:5f' },
				model: { type: 'virtio' }
			};

			expect(actualInterfaceDesc).to.deep.equal(expectedInterfaceDesc);
		});
	});
});

describe('DomainGraphics', () => {
	describe('serialize', () => {
		it('should work', () => {
			const graphics = domainGraphicsXml.serialize({
				type: 'vnc',
				port: -1,
				listen: '0.0.0.0',
				passwd: 'test1'
			});

			const builder = new xml2js.Builder({ headless: true });
			const actualXml = builder.buildObject({ graphics });

			const expectedXml =
'<graphics type="vnc" port="-1" listen="0.0.0.0" passwd="test1"/>';

			expect(actualXml).to.equal(expectedXml);
		});
	});

	describe('deserialize', () => {
		it('should work', async () => {
			const parsed = await xml2js.parseStringPromise('<graphics type="vnc" port="-1" listen="0.0.0.0" passwd="test1"/>') as Record<string, any>;
			const actualGraphicsDesc = domainGraphicsXml
				.deserialize(parsed.graphics);

			const expectedGraphicsDesc: DomainGraphicsDesc = {
				type: 'vnc',
				port: -1,
				listen: '0.0.0.0',
				passwd: 'test1'
			};

			expect(actualGraphicsDesc).to.deep.equal(expectedGraphicsDesc);
		});
	});
});

describe('domainDescToXml', () => {
	it('should work', () => {
		const domain: DomainDesc = {

			type: 'kvm',

			name: 'test1',
			uuid: '148d0864-2354-4c27-b82c-731bdd3f320c',

			memory: { value: 1048576 },
			currentMemory: { value: 1048576 },

			vcpu: { value: 1 },

			os: {
				type: { arch: 'x86_64', machine: 'q35', value: 'hvm' },
				boot: { dev: 'hd' }
			},

			devices: [

				{
					type: 'emulator',
					emulator: { value: '/usr/bin/qemu-system-x86_64' }
				},

				{
					type: 'disk',
					disk: {
						type: 'file', device: 'disk',
						driver: { name: 'qemu', type: 'qcow2' },
						source: { file: '/home/leon/test1.img' },
						target: { dev: 'vda', bus: 'virtio' }
					}
				},

				{
					type: 'interface',
					interface: {
						type: 'network',
						source: { network: 'default' },
						mac: { address: '52:54:00:8e:c6:5f' },
						model: { type: 'virtio' }
					}
				},

				{
					type: 'console',
					console: { type: 'pty' }
				},

				{
					type: 'graphics',
					graphics: {
						type: 'vnc',
						port: -1,
						listen: '0.0.0.0',
						passwd: 'test1'
					}
				}

			]

		};

		const actualXml = domainDescToXml(domain);

		const expectedXml =
`<domain type="kvm">
  <name>test1</name>
  <uuid>148d0864-2354-4c27-b82c-731bdd3f320c</uuid>
  <memory>1048576</memory>
  <currentMemory>1048576</currentMemory>
  <vcpu>1</vcpu>
  <os>
    <type arch="x86_64" machine="q35">hvm</type>
    <boot dev="hd"/>
  </os>
  <devices>
    <emulator>/usr/bin/qemu-system-x86_64</emulator>
    <disk type="file" device="disk">
      <driver name="qemu" type="qcow2"/>
      <source file="/home/leon/test1.img"/>
      <target dev="vda" bus="virtio"/>
    </disk>
    <interface type="network">
      <source network="default"/>
      <mac address="52:54:00:8e:c6:5f"/>
      <model type="virtio"/>
    </interface>
    <console type="pty"/>
    <graphics type="vnc" port="-1" listen="0.0.0.0" passwd="test1"/>
  </devices>
</domain>`;

		expect(actualXml).to.equal(expectedXml);
	});
});

describe('domainDescFromXml', () => {
	it('should work', async () => {
		const xml =
`<domain type="kvm">
  <name>test1</name>
  <uuid>148d0864-2354-4c27-b82c-731bdd3f320c</uuid>
  <memory>1048576</memory>
  <currentMemory>1048576</currentMemory>
  <vcpu>1</vcpu>
  <os>
    <type arch="x86_64" machine="q35">hvm</type>
    <boot dev="hd"/>
  </os>
  <devices>
    <emulator>/usr/bin/qemu-system-x86_64</emulator>
    <disk type="file" device="disk">
      <driver name="qemu" type="qcow2"/>
      <source file="/home/leon/test1.img"/>
      <target dev="vda" bus="virtio"/>
    </disk>
    <interface type="network">
      <source network="default"/>
      <mac address="52:54:00:8e:c6:5f"/>
      <model type="virtio"/>
    </interface>
    <console type="pty"/>
    <graphics type="vnc" port="-1" listen="0.0.0.0" passwd="test1"/>
  </devices>
</domain>`;

		const actualDomainDesc = await domainDescFromXml(xml);

		const expectedDomainDesc: DomainDesc = {

			type: 'kvm',

			name: 'test1',
			uuid: '148d0864-2354-4c27-b82c-731bdd3f320c',

			memory: { value: 1048576 },
			currentMemory: { value: 1048576 },

			vcpu: { value: 1 },

			os: {
				type: { arch: 'x86_64', machine: 'q35', value: 'hvm' },
				boot: { dev: 'hd' }
			},

			devices: [

				{
					type: 'emulator',
					emulator: { value: '/usr/bin/qemu-system-x86_64' }
				},

				{
					type: 'disk',
					disk: {
						type: 'file', device: 'disk',
						driver: { name: 'qemu', type: 'qcow2' },
						source: { file: '/home/leon/test1.img' },
						target: { dev: 'vda', bus: 'virtio' }
					}
				},

				{
					type: 'interface',
					interface: {
						type: 'network',
						source: { network: 'default' },
						mac: { address: '52:54:00:8e:c6:5f' },
						model: { type: 'virtio' }
					}
				},

				{
					type: 'console',
					console: { type: 'pty' }
				},

				{
					type: 'graphics',
					graphics: {
						type: 'vnc',
						port: -1,
						listen: '0.0.0.0',
						passwd: 'test1'
					}
				}

			]

		};

		expect(actualDomainDesc).to.deep.equal(expectedDomainDesc);
	});
});
