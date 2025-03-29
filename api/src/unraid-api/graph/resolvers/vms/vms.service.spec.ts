import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { execSync } from 'child_process';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { VmDomain } from '@app/graphql/generated/api/types.js';
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

// Helper function to clean up domain
const cleanupDomain = async () => {
    try {
        const domains = await execSync(`virsh -c ${LIBVIRT_URI} list --all --name`)
            .toString()
            .split('\n');
        if (domains.includes(TEST_VM_NAME)) {
            try {
                execSync(`virsh -c ${LIBVIRT_URI} shutdown ${TEST_VM_NAME}`);
                await new Promise((resolve) => setTimeout(resolve, 1000));
            } catch (error) {
                // Ignore errors during shutdown
            }
            try {
                execSync(`virsh -c ${LIBVIRT_URI} destroy ${TEST_VM_NAME}`);
                await new Promise((resolve) => setTimeout(resolve, 1000));
            } catch (error) {
                // Ignore errors during force shutdown
            }
            try {
                execSync(`virsh -c ${LIBVIRT_URI} undefine ${TEST_VM_NAME}`);
                await new Promise((resolve) => setTimeout(resolve, 1000));
            } catch (error) {
                // Ignore errors during undefine
            }
        }
    } catch (error) {
        // Ignore errors during cleanup
    }
};

// Helper function to verify libvirt session is working
const verifyLibvirtSession = async () => {
    try {
        await execSync(`virsh -c ${LIBVIRT_URI} list --all`);
        return true;
    } catch (error) {
        console.error('Libvirt session verification failed:', error);
        return false;
    }
};

describe('VmsService', () => {
    let service: VmsService;

    beforeEach(async () => {
        // Override the LIBVIRT_URI environment variable for testing
        process.env.LIBVIRT_URI = LIBVIRT_URI;

        // Verify libvirt session is working
        const isSessionWorking = await verifyLibvirtSession();
        if (!isSessionWorking) {
            throw new Error(
                'Libvirt session is not working. Please ensure libvirt is running and accessible.'
            );
        }

        const module: TestingModule = await Test.createTestingModule({
            providers: [VmsService],
        }).compile();

        service = module.get<VmsService>(VmsService);

        // Initialize the service
        await service.onModuleInit();

        // Wait for service to initialize
        await new Promise((resolve) => setTimeout(resolve, 2000));
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('Integration Tests', () => {
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

        beforeEach(async () => {
            console.log('Setting up test environment...');
            console.log('TMP_DIR:', TMP_DIR);
            console.log('DISK_IMAGE:', DISK_IMAGE);
            console.log('DOMAIN_XML:', DOMAIN_XML);

            // Clean up any existing test VM and files
            await cleanupDomain();
            cleanupDiskImage();
            cleanupDomainXml();

            // Create a small disk image for the VM
            execSync(`qemu-img create -f qcow2 ${DISK_IMAGE} 1G`);
            console.log('Created disk image');

            // Write domain XML to file
            writeFileSync(DOMAIN_XML, domainXml.trim());
            console.log('Created domain XML file');
            console.log('XML content:', readFileSync(DOMAIN_XML, 'utf-8'));

            // Define the domain using the XML file
            execSync(`virsh -c ${LIBVIRT_URI} define ${DOMAIN_XML}`);
            console.log('Defined domain');

            // Verify domain was created
            const domains = await execSync(`virsh -c ${LIBVIRT_URI} list --all --name`)
                .toString()
                .split('\n');
            console.log('Available domains:', domains);

            // Wait for the domain to be defined
            let retries = 0;
            let testVm: VmDomain | null = null;
            while (retries < 5 && !testVm) {
                const domains = await service.getDomains();
                testVm = domains.find((d) => d.name === TEST_VM_NAME) ?? null;
                if (!testVm) {
                    await new Promise((resolve) => setTimeout(resolve, 1000));
                    retries++;
                }
            }

            if (!testVm) {
                throw new Error('Failed to find test VM after defining it');
            }

            // Wait for the service to initialize
            await new Promise((resolve) => setTimeout(resolve, 2000));
        });

        afterEach(async () => {
            await cleanupDomain();
            cleanupDiskImage();
            cleanupDomainXml();
        });

        it('should list domains including our test VM', async () => {
            const domains = await service.getDomains();
            console.log('Found domains:', domains); // Debug log
            const testVm = domains.find((d) => d.name === TEST_VM_NAME);

            expect(testVm).toBeDefined();
            expect(testVm?.state).toBe('SHUTOFF');
        });

        it('should start and stop the test VM', async () => {
            // Get the domain's UUID
            const domains = await service.getDomains();
            const testVm = domains.find((d) => d.name === TEST_VM_NAME);
            expect(testVm).toBeDefined();
            expect(testVm?.uuid).toBeDefined();

            // Start the VM
            const startResult = await service.startVm(testVm!.uuid);
            expect(startResult).toBe(true);

            // Wait for VM to start
            await new Promise((resolve) => setTimeout(resolve, 2000));

            // Verify VM is running
            const runningDomains = await service.getDomains();
            const runningTestVm = runningDomains.find((d) => d.name === TEST_VM_NAME);
            expect(runningTestVm?.state).toBe('RUNNING');

            // Stop the VM
            const stopResult = await service.stopVm(testVm!.uuid);
            expect(stopResult).toBe(true);

            // Wait for VM to stop
            await new Promise((resolve) => setTimeout(resolve, 5000));

            // Verify VM is stopped
            const stoppedDomains = await service.getDomains();
            const stoppedTestVm = stoppedDomains.find((d) => d.name === TEST_VM_NAME);
            expect(stoppedTestVm?.state).toBe('SHUTOFF');
        }, 30000); // Increase timeout to 30 seconds

        it('should handle errors when VM is not available', async () => {
            // Try to start a non-existent VM
            await expect(service.startVm('999')).rejects.toThrow('Failed to start VM');
            await expect(service.stopVm('999')).rejects.toThrow('Failed to stop VM');
        });
    });
});
