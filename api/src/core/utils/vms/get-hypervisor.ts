/*!
 * Copyright 2019-2022 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

import { access } from 'fs/promises';
import { constants } from 'fs';

import path from 'path';
import { Hypervisor } from '@vmngr/libvirt';
import { libvirtLogger } from '@app/core/log';
import { Exception } from 'bycontract';

const uri = process.env.LIBVIRT_URI ?? 'qemu:///system';

let hypervisor: Hypervisor | null;

const libvirtPid = '/var/run/libvirt/libvirtd.pid';

const isLibvirtRunning = async (): Promise<boolean> => {
    try {
        await access(libvirtPid, constants.F_OK | constants.R_OK);
        return true;
    } catch (error) {
        return false;
    }
};

export const getHypervisor = async (): Promise<Hypervisor> => {
    // Return hypervisor if it's already connected
    const running = await isLibvirtRunning();

    if (hypervisor && running) {
        return hypervisor;
    }

	if (!running) {
		hypervisor = null;
		throw new Error('Libvirt is not running');
	}




    hypervisor = new Hypervisor({ uri });
    await hypervisor.connectOpen().catch((error: unknown) => {
        libvirtLogger.error(
            `Failed starting VM hypervisor connection with "${
                (error as Error).message
            }"`
        );

        throw error;
    });

    return hypervisor;
};
