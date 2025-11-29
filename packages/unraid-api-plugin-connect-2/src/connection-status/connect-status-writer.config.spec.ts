import { ConfigService } from '@nestjs/config';
import { access, constants, mkdir, readFile, rm } from 'fs/promises';
import { join } from 'path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ConfigType } from '../config/connect.config.js';
import { ConnectStatusWriterService } from './connect-status-writer.service.js';

describe('ConnectStatusWriterService Config Behavior', () => {
    let service: ConnectStatusWriterService;
    let configService: ConfigService<ConfigType, true>;
    const testDir = '/tmp/connect-status-config-test';
    const testFilePath = join(testDir, 'connectStatus.json');
    
    // Simulate config changes
    let configStore: any = {};

    beforeEach(async () => {
        vi.clearAllMocks();
        
        // Reset config store
        configStore = {};
        
        // Create test directory
        await mkdir(testDir, { recursive: true });
        
        // Create a ConfigService mock that behaves like the real one
        configService = {
            get: vi.fn().mockImplementation((key: string) => {
                console.log(`ConfigService.get('${key}') called, returning:`, configStore[key]);
                return configStore[key];
            }),
            set: vi.fn().mockImplementation((key: string, value: any) => {
                console.log(`ConfigService.set('${key}', ${JSON.stringify(value)}) called`);
                configStore[key] = value;
            }),
        } as unknown as ConfigService<ConfigType, true>;

        service = new ConnectStatusWriterService(configService);
        
        // Override the status file path to use our test location
        Object.defineProperty(service, 'statusFilePath', {
            get: () => testFilePath,
        });
    });

    afterEach(async () => {
        await service.onModuleDestroy();
        await rm(testDir, { recursive: true, force: true });
    });

    it('should write status when config is updated directly', async () => {
        // Initialize service - should write PRE_INIT
        await service.onApplicationBootstrap();
        await new Promise(resolve => setTimeout(resolve, 50));
        
        let content = await readFile(testFilePath, 'utf-8');
        let data = JSON.parse(content);
        console.log('Initial status:', data);
        expect(data.connectionStatus).toBe('PRE_INIT');
        
        // Update config directly (simulating what ConnectionService does)
        console.log('\n=== Updating config to CONNECTED ===');
        configService.set('connect.mothership', {
            status: 'CONNECTED',
            error: null,
            lastPing: Date.now(),
        });
        
        // Call the writeStatus method directly (since @OnEvent handles the event)
        await service['writeStatus']();
        
        content = await readFile(testFilePath, 'utf-8');
        data = JSON.parse(content);
        console.log('Status after config update:', data);
        expect(data.connectionStatus).toBe('CONNECTED');
    });

    it('should test the actual flow with multiple status updates', async () => {
        await service.onApplicationBootstrap();
        await new Promise(resolve => setTimeout(resolve, 50));
        
        const statusUpdates = [
            { status: 'CONNECTING', error: null, lastPing: null },
            { status: 'CONNECTED', error: null, lastPing: Date.now() },
            { status: 'DISCONNECTED', error: 'Lost connection', lastPing: Date.now() - 10000 },
            { status: 'RECONNECTING', error: null, lastPing: Date.now() - 10000 },
            { status: 'CONNECTED', error: null, lastPing: Date.now() },
        ];
        
        for (const update of statusUpdates) {
            console.log(`\n=== Updating to ${update.status} ===`);
            
            // Update config
            configService.set('connect.mothership', update);
            
            // Call writeStatus directly
            await service['writeStatus']();
            
            const content = await readFile(testFilePath, 'utf-8');
            const data = JSON.parse(content);
            console.log(`Status file shows: ${data.connectionStatus}`);
            expect(data.connectionStatus).toBe(update.status);
        }
    });

    it('should handle case where config is not set before event', async () => {
        await service.onApplicationBootstrap();
        await new Promise(resolve => setTimeout(resolve, 50));
        
        // Delete the config
        delete configStore['connect.mothership'];
        
        // Call writeStatus without config
        console.log('\n=== Calling writeStatus with no config ===');
        await service['writeStatus']();
        
        const content = await readFile(testFilePath, 'utf-8');
        const data = JSON.parse(content);
        console.log('Status with no config:', data);
        expect(data.connectionStatus).toBe('PRE_INIT');
        
        // Now set config and call writeStatus again
        console.log('\n=== Setting config and calling writeStatus ===');
        configService.set('connect.mothership', {
            status: 'CONNECTED',
            error: null,
            lastPing: Date.now(),
        });
        await service['writeStatus']();
        
        const content2 = await readFile(testFilePath, 'utf-8');
        const data2 = JSON.parse(content2);
        console.log('Status after setting config:', data2);
        expect(data2.connectionStatus).toBe('CONNECTED');
    });

    describe('cleanup on shutdown', () => {
        it('should delete status file on module destroy', async () => {
            await service.onApplicationBootstrap();
            await new Promise(resolve => setTimeout(resolve, 50));

            // Verify file exists
            await expect(access(testFilePath, constants.F_OK)).resolves.not.toThrow();

            // Cleanup
            await service.onModuleDestroy();

            // Verify file is deleted
            await expect(access(testFilePath, constants.F_OK)).rejects.toThrow();
        });

        it('should handle cleanup when file does not exist', async () => {
            // Don't bootstrap (so no file is written)
            await expect(service.onModuleDestroy()).resolves.not.toThrow();
        });
    });
});