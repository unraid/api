/**
 * Copyright 2019 Leon Rinkel <leon@rinkel.me> and vmngr/libvirt contributers.
 *
 * This file is part of the vmngr/libvirt project and is subject to the MIT
 * license as in the LICENSE file in the project root.
 *
 * @brief Contains interfaces to describe domains, networks, etc.
 * @description The interfaces aim to be as close as possible to the libvirt XML
 *  schemas, so that people who are already familiar with describing their
 *  domains etc. using XML dont need much further knowledge to do these same
 *  with these interfaces.
 */

/**
 * @see https://www.libvirt.org/formatdomain.html#elementsOS
 * @todo Interface is not complete nor 100% correct.
 */
export declare interface DomainOsDesc {
	type?: {
		arch?: string;
		machine?: string;
		value?: string;
	};

	boot?: {
		dev?: string;
	};
}

/**
 * @see https://www.libvirt.org/formatdomain.html#elementsDisks
 * @todo Interface is not complete nor 100% correct.
 */
export declare interface DomainDiskDesc {
	type?: 'file';
	device?: 'disk';

	driver?: {
		name?: 'qemu';
		type?: 'qcow2';
	};

	source?: {
		file?: string;
	};

	target?: {
		dev?: string;
		bus?: 'virtio';
	};

}

/**
 * @see https://www.libvirt.org/formatdomain.html#elementsNICS
 * @todo Interface is not complete nor 100% correct.
 */
export declare interface DomainInterfaceDesc {
	type?: 'network';
	source?: {
		network?: string;
	};
	mac?: {
		address?: string;
	};
	model?: {
		type?: 'virtio';
	};
}

/**
 * @see https://www.libvirt.org/formatdomain.html#elementsGraphics
 * @todo Interface is not complete nor 100% correct.
 */
export declare interface DomainGraphicsDesc {
	type?: 'vnc';
	port?: number;
	listen?: string;
	passwd?: string;
}

/**
 * @see https://www.libvirt.org/formatdomain.html
 * @todo Interface is not complete nor 100% correct.
 */
export declare interface DomainDesc {
	type?: 'kvm';
	id?: number;

	name?: string;
	uuid?: string;

	memory?: {
		unit?: 'KiB';
		value?: number;
	};

	currentMemory?: {
		unit?: 'KiB';
		value?: number;
	};

	vcpu?: {
		placement?: 'static';
		value?: number;
	};

	os?: DomainOsDesc;

	devices?: Array<{
		type: 'emulator';
		emulator: {
			value?: string;
		};
	} | {
		type: 'disk';
		disk: DomainDiskDesc;
	} | {
		type: 'interface';
		interface: DomainInterfaceDesc;
	} | {
		type: 'console';
		console: {
			type?: 'pty';
		};
	} | {
		type: 'graphics';
		graphics: DomainGraphicsDesc;
	}>;
}
