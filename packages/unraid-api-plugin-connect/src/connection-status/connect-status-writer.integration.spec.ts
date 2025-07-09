import { ConfigService } from '@nestjs/config';
import { mkdir, readFile, rm } from 'fs/promises';
import { join } from 'path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ConfigType } from '../config/connect.config.js';
import { ConnectStatusWriterService } from './connect-status-writer.service.js';

describe('ConnectStatusWriterService Integration', () => {
    let service: ConnectStatusWriterService;
    let configService: ConfigService<ConfigType, true>;
    const testDir = '/tmp/connect-status-test';
    const testFilePath = join(testDir, 'connectStatus.json');

    beforeEach(async () => {
        vi.clearAllMocks();
        
        // Create test directory
        await mkdir(testDir, { recursive: true });

        configService = {
            get: vi.fn().mockImplementation((key: string) => {
                console.log(`ConfigService.get called with key: ${key}`);
                return {
                    status: 'CONNECTED',
                    error: null,
                    lastPing: Date.now(),
                };
            }),
        } as unknown as ConfigService<ConfigType, true>;

        service = new ConnectStatusWriterService(configService);
        
        // Override the status file path to use our test location
        Object.defineProperty(service, 'statusFilePath', {
            get: () => testFilePath,
        });
    });

    afterEach(async () => {
        await rm(testDir, { recursive: true, force: true });
    });

    it('should write initial PRE_INIT status, then update on event', async () => {
        // First, mock the config to return undefined (no connection metadata)
        vi.mocked(configService.get).mockReturnValue(undefined);
        
        console.log('=== Starting onApplicationBootstrap ===');
        await service.onApplicationBootstrap();
        
        // Wait a bit for the initial write to complete
        await new Promise(resolve => setTimeout(resolve, 50));
        
        // Read initial status
        const initialContent = await readFile(testFilePath, 'utf-8');
        const initialData = JSON.parse(initialContent);
        console.log('Initial status written:', initialData);
        
        expect(initialData.connectionStatus).toBe('PRE_INIT');
        expect(initialData.error).toBeNull();
        expect(initialData.lastPing).toBeNull();
        
        // Now update the mock to return CONNECTED status
        vi.mocked(configService.get).mockReturnValue({
            status: 'CONNECTED',
            error: null,
            lastPing: 1234567890,
        });
        
        console.log('=== Calling writeStatus directly ===');
        await service['writeStatus']();
        
        // Read updated status
        const updatedContent = await readFile(testFilePath, 'utf-8');
        const updatedData = JSON.parse(updatedContent);
        console.log('Updated status after writeStatus:', updatedData);
        
        expect(updatedData.connectionStatus).toBe('CONNECTED');
        expect(updatedData.lastPing).toBe(1234567890);
    });

    it('should handle rapid status changes correctly', async () => {
        const statusChanges = [
            { status: 'PRE_INIT', error: null, lastPing: null },
            { status: 'CONNECTING', error: null, lastPing: null },
            { status: 'CONNECTED', error: null, lastPing: Date.now() },
            { status: 'DISCONNECTED', error: 'Connection lost', lastPing: Date.now() - 5000 },
            { status: 'CONNECTED', error: null, lastPing: Date.now() },
        ];
        
        let changeIndex = 0;
        vi.mocked(configService.get).mockImplementation(() => {
            const change = statusChanges[changeIndex];
            console.log(`Returning status ${changeIndex}: ${change.status}`);
            return change;
        });
        
        await service.onApplicationBootstrap();
        await new Promise(resolve => setTimeout(resolve, 50));
        
        // Simulate the final status change
        changeIndex = statusChanges.length - 1;
        console.log(`=== Calling writeStatus for final status: ${statusChanges[changeIndex].status} ===`);
        await service['writeStatus']();
        
        // Read final status
        const finalContent = await readFile(testFilePath, 'utf-8');
        const finalData = JSON.parse(finalContent);
        console.log('Final status after status change:', finalData);
        
        // Should have the last status
        expect(finalData.connectionStatus).toBe('CONNECTED');
        expect(finalData.error).toBeNull();
    });

    it('should handle multiple write calls correctly', async () => {
        const writes: number[] = [];
        const originalWriteStatus = service['writeStatus'].bind(service);
        
        service['writeStatus'] = async function() {
            const timestamp = Date.now();
            writes.push(timestamp);
            console.log(`writeStatus called at ${timestamp}`);
            return originalWriteStatus();
        };
        
        await service.onApplicationBootstrap();
        await new Promise(resolve => setTimeout(resolve, 50));
        
        const initialWrites = writes.length;
        console.log(`Initial writes: ${initialWrites}`);
        
        // Make multiple write calls
        for (let i = 0; i < 3; i++) {
            console.log(`Calling writeStatus ${i}`);
            await service['writeStatus']();
        }
        
        console.log(`Total writes: ${writes.length}`);
        console.log('Write timestamps:', writes);
        
        // Should have initial write + 3 additional writes
        expect(writes.length).toBe(initialWrites + 3);
    });
});