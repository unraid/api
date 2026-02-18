import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { execSync } from 'child_process';
import { existsSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

import { ConnectListAllDomainsFlags, Hypervisor } from '@unraid/libvirt';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { VmDomain } from '@app/unraid-api/graph/resolvers/vms/vms.model.js';
import { VmsService } from '@app/unraid-api/graph/resolvers/vms/vms.service.js';

const TEST_VM_NAME = 'test-integration-vm';
const TMP_DIR = tmpdir();
const DISK_IMAGE = join(TMP_DIR, 'test-vm.img');
const DOMAIN_XML = join(TMP_DIR, 'test-vm.xml');
const LIBVIRT_URI = 'qemu:///session'; // Use session for testing

// Helper function to determine architecture-specific configuration
function getArchConfig(): { arch: string; machine: string; emulator: string } {
    if (process.platform === 'darwin') {
        if (process.arch === 'arm64') {
            return {
                arch: 'aarch64',
                machine: 'virt',
                emulator: '/opt/homebrew/bin/qemu-system-aarch64',
            };
        } else {
            return {
                arch: 'x86_64',
                machine: 'q35',
                emulator: '/opt/homebrew/bin/qemu-system-x86_64',
            };
        }
    } else {
        if (process.arch === 'arm64') {
            return {
                arch: 'aarch64',
                machine: 'virt',
                emulator: '/usr/bin/qemu-system-aarch64',
            };
        } else {
            return {
                arch: 'x86_64',
                machine: 'q35',
                emulator: '/usr/bin/qemu-system-x86_64',
            };
        }
    }
}

// Helper function to verify QEMU installation
const verifyQemuInstallation = () => {
    const archConfig = getArchConfig();
    const qemuPath = archConfig.emulator;

    if (!existsSync(qemuPath)) {
        throw new Error(`QEMU not found at ${qemuPath}. Please install QEMU first.`);
    }

    return archConfig;
};

// Helper function to clean up disk image
const cleanupDiskImage = () => {
    try {
        if (existsSync(DISK_IMAGE)) {
            try {
                execSync(`qemu-img info ${DISK_IMAGE} --force-share`);
            } catch (error) {
                // Ignore errors from force-share
            }
            execSync(`rm -f ${DISK_IMAGE}`);
        }
    } catch (error) {
        console.error('Error cleaning up files:', error);
    }
};

// Helper function to clean up domain XML
const cleanupDomainXml = () => {
    try {
        if (existsSync(DOMAIN_XML)) {
            execSync(`rm -f ${DOMAIN_XML}`);
        }
    } catch (error) {
        console.error('Error cleaning up domain XML:', error);
    }
};

// Helper function to clean up domain using libvirt
const cleanupDomain = async (hypervisor: Hypervisor) => {
    try {
        // Get both active and inactive domains
        const activeDomains = await hypervisor.connectListAllDomains(ConnectListAllDomainsFlags.ACTIVE);
        const inactiveDomains = await hypervisor.connectListAllDomains(
            ConnectListAllDomainsFlags.INACTIVE
        );
        const domains = [...activeDomains, ...inactiveDomains];
        console.log('Found domains during cleanup:', domains);

        // Find the test domain
        let testDomain: any = null;
        for (const domain of domains) {
            const name = await hypervisor.domainGetName(domain);
            if (name === TEST_VM_NAME) {
                testDomain = domain;
                break;
            }
        }

        if (testDomain) {
            console.log('Found test domain during cleanup');
            try {
                const info = await hypervisor.domainGetInfo(testDomain);
                console.log('Domain state during cleanup:', info.state);
                if (info.state === 1) {
                    // RUNNING
                    console.log('Domain is running, destroying it');
                    await hypervisor.domainDestroy(testDomain);
                    await new Promise((resolve) => setTimeout(resolve, 2000));
                }
            } catch (error) {
                console.error('Error during domain shutdown:', error);
            }
            try {
                console.log('Undefining domain');
                await hypervisor.domainUndefine(testDomain);
                await new Promise((resolve) => setTimeout(resolve, 2000));
            } catch (error) {
                console.error('Error during domain undefine:', error);
            }
        }
    } catch (error) {
        console.error('Error during domain cleanup:', error);
    }
};

// Helper function to verify libvirt connection
const verifyLibvirtConnection = async (hypervisor: Hypervisor) => {
    try {
        await hypervisor.connectOpen();
        return true;
    } catch (error) {
        console.error('Libvirt connection verification failed:', error);
        return false;
    }
};

// Check if qemu-img is available before running tests
const isQemuAvailable = () => {
    try {
        execSync('qemu-img --version', { stdio: 'ignore' });
        return true;
    } catch (error) {
        return false;
    }
};

const describeVmService = isQemuAvailable() ? describe : describe.skip;

describeVmService('VmsService', () => {
    let service: VmsService;
    let hypervisor: Hypervisor;
    let testVm: VmDomain | null = null;
    const archConfig = getArchConfig();
    const domainXml = `
        <domain type='qemu'>
            <name>${TEST_VM_NAME}</name>
            <memory unit='KiB'>524288</memory>
            <vcpu>1</vcpu>
            <os>
                <type arch='${archConfig.arch}' machine='${archConfig.machine}'>hvm</type>
                <boot dev='hd'/>
            </os>
            <devices>
                <emulator>${archConfig.emulator}</emulator>
                <disk type='file' device='disk'>
                    <driver name='qemu' type='qcow2'/>
                    <source file='${DISK_IMAGE}'/>
                    <target dev='vda' bus='virtio'/>
                </disk>
                <console type='pty'/>
            </devices>
        </domain>
    `;

    beforeAll(async () => {
        // Override the LIBVIRT_URI environment variable for testing
        process.env.LIBVIRT_URI = LIBVIRT_URI;

        // Create hypervisor instance for direct libvirt operations
        hypervisor = new Hypervisor({ uri: LIBVIRT_URI });

        // Verify libvirt connection is working
        const isConnectionWorking = await verifyLibvirtConnection(hypervisor);
        if (!isConnectionWorking) {
            throw new Error(
                'Libvirt connection is not working. Please ensure libvirt is running and accessible.'
            );
        }

        const module: TestingModule = await Test.createTestingModule({
            providers: [VmsService],
        }).compile();

        service = module.get<VmsService>(VmsService);

        // Initialize the service
        await service.onApplicationBootstrap();
    });

    afterAll(async () => {
        await cleanupDomain(hypervisor);
        cleanupDiskImage();
        cleanupDomainXml();
    });

    beforeEach(async () => {
        // Only set up test VM if it doesn't exist
        if (!testVm) {
            console.log('Setting up test environment...');
            console.log('TMP_DIR:', TMP_DIR);
            console.log('DISK_IMAGE:', DISK_IMAGE);
            console.log('DOMAIN_XML:', DOMAIN_XML);

            // Clean up any existing test VM and files
            await cleanupDomain(hypervisor);
            cleanupDiskImage();
            cleanupDomainXml();

            // Create a small disk image for the VM
            execSync(`qemu-img create -f qcow2 ${DISK_IMAGE} 1G`);
            console.log('Created disk image');

            // Write domain XML to file
            writeFileSync(DOMAIN_XML, domainXml.trim());
            console.log('Created domain XML file');

            // Define the domain using libvirt
            const domain = await hypervisor.domainDefineXML(domainXml.trim());
            console.log('Defined domain');

            // Wait for the domain to be defined in the service
            let retries = 0;
            const maxRetries = 5; // Reduced from 10
            while (retries < maxRetries && !testVm) {
                try {
                    const domains = await service.getDomains();
                    testVm = domains.find((d) => d.name === TEST_VM_NAME) ?? null;
                    if (testVm) break;
                } catch (error) {
                    console.error('Error getting domains from service:', error);
                }
                await new Promise((resolve) => setTimeout(resolve, 1000)); // Reduced from 2000
                retries++;
            }

            if (!testVm) {
                throw new Error('Failed to find test VM in service after defining it');
            }
        }
    });

    it('should list domains including our test VM', async () => {
        const domains = await service.getDomains();
        const testVm = domains.find((d) => d.name === TEST_VM_NAME);

        expect(testVm).toBeDefined();
        expect(testVm?.state).toBe('SHUTOFF');
    });

    it('should start and stop the test VM', async () => {
        expect(testVm).toBeDefined();
        expect(testVm?.id).toBeDefined();

        // Start the VM
        const startResult = await service.startVm(testVm!.id);
        expect(startResult).toBe(true);

        // Wait for VM to start with a more targeted approach
        let isRunning = false;
        let attempts = 0;
        while (!isRunning && attempts < 5) {
            const runningDomains = await service.getDomains();
            const runningTestVm = runningDomains.find((d) => d.name === TEST_VM_NAME);
            isRunning = runningTestVm?.state === 'RUNNING';
            if (!isRunning) {
                await new Promise((resolve) => setTimeout(resolve, 1000));
                attempts++;
            }
        }
        expect(isRunning).toBe(true);

        // Stop the VM
        const stopResult = await service.stopVm(testVm!.id);
        expect(stopResult).toBe(true);

        // Wait for VM to stop with a more targeted approach
        let isStopped = false;
        attempts = 0;
        while (!isStopped && attempts < 5) {
            const stoppedDomains = await service.getDomains();
            const stoppedTestVm = stoppedDomains.find((d) => d.name === TEST_VM_NAME);
            isStopped = stoppedTestVm?.state === 'SHUTOFF';
            if (!isStopped) {
                await new Promise((resolve) => setTimeout(resolve, 1000));
                attempts++;
            }
        }
        expect(isStopped).toBe(true);
    }, 15000); // Reduced timeout from 30000

    it('should handle errors when VM is not available', async () => {
        await expect(service.startVm('999')).rejects.toThrow('Failed to set VM state: Invalid UUID');
        await expect(service.stopVm('999')).rejects.toThrow('Failed to set VM state: Invalid UUID');
    });
});
