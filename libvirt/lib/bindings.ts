/**
 * Copyright 2019 Leon Rinkel <leon@rinkel.me> and vmngr/libvirt contributers.
 *
 * This file is part of the vmngr/libvirt project and is subject to the MIT
 * license as in the LICENSE file in the project root.
 *
 * @brief Contains actual libvirt bindings and related declarations.
 */

// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-var-requires,@typescript-eslint/no-unsafe-call,@typescript-eslint/no-require-imports
export const { Hypervisor } = require('bindings')('libvirt');
// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-var-requires,@typescript-eslint/no-unsafe-call,@typescript-eslint/no-require-imports
export const { Domain } = require('bindings')('libvirt');

export const ConnectListAllDomainsFlags = {
	ACTIVE: 1,
	INACTIVE: 2,
	PERSISTENT: 4,
	TRANSIENT: 8,
	RUNNING: 16,
	PAUSED: 32,
	SHUTOFF: 64,
	OTHER: 128,
	MANAGEDSAVE: 256,
	NO_MANAGEDSAVE: 512,
	AUTOSTART: 1024,
	NO_AUTOSTART: 2048,
	HAS_SNAPSHOT: 4096,
	NO_SNAPSHOT: 8192,
	HAS_CHECKPOINT: 16384,
	NO_CHECKPOINT: 32768
};

export const DomainGetXMLDescFlags = {
	SECURE: 1,
	INACTIVE: 2,
	UPDATE_CPU: 4,
	MIGRATABLE: 8
};

// https://libvirt.org/manpages/virsh.html#list
export const DomainState = {
	NOSTATE: 0,
	RUNNING: 1,
	// Docs are wrong this is not IDLE this is BLOCKED
	// libvirt-domain.h can prove this
	BLOCKED: 2,
	PAUSED: 3,
	SHUTDOWN: 4,
	SHUTOFF: 5,
	CRASHED: 6,
	PMSUSPENDED: 7
};
