/*!
 * Copyright 2019-2022 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

export type PciDeviceClass = 'vga' | 'audio' | 'gpu' | 'other';

/**
 * PCI device
 */
export interface PciDevice {
	id: string;
	allowed: boolean;
	class: PciDeviceClass;
	vendorname: string;
	productname: string;
	typeid: string;
	serial: string;
	product: string;
	manufacturer: string;
	guid: string;
	name: string;
}
