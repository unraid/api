import { BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { emcmd } from '@app/core/utils/clients/emcmd.js';
import * as PhpLoaderModule from '@app/core/utils/plugins/php-loader.js';
import {
    MANUAL_TIME_REGEX,
    UpdateSystemTimeInput,
} from '@app/unraid-api/graph/resolvers/system-time/system-time.model.js';
import { SystemTimeService } from '@app/unraid-api/graph/resolvers/system-time/system-time.service.js';

vi.mock('@app/core/utils/clients/emcmd.js', () => ({
    emcmd: vi.fn(),
}));

const phpLoaderSpy = vi.spyOn(PhpLoaderModule, 'phpLoader');

describe('SystemTimeService', () => {
    let service: SystemTimeService;
    let configService: ConfigService;

    beforeEach(async () => {
        vi.clearAllMocks();

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                SystemTimeService,
                {
                    provide: ConfigService,
                    useValue: {
                        get: vi.fn(),
                    },
                },
            ],
        }).compile();

        service = module.get<SystemTimeService>(SystemTimeService);
        configService = module.get<ConfigService>(ConfigService);

        vi.mocked(configService.get).mockImplementation((key: string, defaultValue?: any) => {
            if (key === 'store.emhttp.var') {
                return {
                    timeZone: 'UTC',
                    useNtp: true,
                    ntpServer1: 'time1.google.com',
                    ntpServer2: 'time2.google.com',
                    ntpServer3: '',
                    ntpServer4: '',
                };
            }
            if (key === 'store.paths.webGuiBase') {
                return '/usr/local/emhttp/webGui';
            }
            return defaultValue;
        });

        vi.mocked(emcmd).mockResolvedValue({ ok: true } as any);
        phpLoaderSpy.mockResolvedValue('');
    });

    afterEach(() => {
        phpLoaderSpy.mockReset();
    });

    it('returns system time from store state', async () => {
        const result = await service.getSystemTime();
        expect(result.timeZone).toBe('UTC');
        expect(result.useNtp).toBe(true);
        expect(result.ntpServers).toEqual(['time1.google.com', 'time2.google.com', '', '']);
        expect(typeof result.currentTime).toBe('string');
    });

    it('does not override NTP settings when store state is missing', async () => {
        vi.mocked(configService.get).mockImplementation((key: string, defaultValue?: any) => {
            if (key === 'store.emhttp.var') {
                return {};
            }
            if (key === 'store.paths.webGuiBase') {
                return '/usr/local/emhttp/webGui';
            }
            return defaultValue;
        });

        await service.updateSystemTime({ timeZone: 'America/New_York' });

        expect(emcmd).toHaveBeenCalledTimes(1);
        const [commands] = vi.mocked(emcmd).mock.calls[0];
        expect(commands).toEqual({
            setDateTime: 'apply',
            timeZone: 'America/New_York',
        });
    });

    it('defaults to pool.ntp.org when no NTP servers are configured', async () => {
        vi.mocked(configService.get).mockImplementation((key: string, defaultValue?: any) => {
            if (key === 'store.emhttp.var') {
                return {
                    timeZone: 'UTC',
                    useNtp: true,
                    ntpServer1: '',
                    ntpServer2: '',
                    ntpServer3: '',
                    ntpServer4: '',
                };
            }
            if (key === 'store.paths.webGuiBase') {
                return '/usr/local/emhttp/webGui';
            }
            return defaultValue;
        });

        await service.updateSystemTime({ timeZone: 'America/New_York' });

        expect(emcmd).toHaveBeenCalledTimes(1);
        const [commands] = vi.mocked(emcmd).mock.calls[0];
        expect(commands).toEqual({
            setDateTime: 'apply',
            timeZone: 'America/New_York',
            USE_NTP: 'yes',
            NTP_SERVER1: 'pool.ntp.org',
            NTP_SERVER2: '',
            NTP_SERVER3: '',
            NTP_SERVER4: '',
        });
    });

    it('updates time settings, disables NTP, and triggers timezone reset', async () => {
        const oldState = {
            timeZone: 'UTC',
            useNtp: true,
            ntpServer1: 'pool.ntp.org',
            ntpServer2: '',
            ntpServer3: '',
            ntpServer4: '',
        };
        const newState = {
            timeZone: 'America/Los_Angeles',
            useNtp: false,
            ntpServer1: 'time.google.com',
            ntpServer2: '',
            ntpServer3: '',
            ntpServer4: '',
        };

        let callCount = 0;
        vi.mocked(configService.get).mockImplementation((key: string, defaultValue?: any) => {
            if (key === 'store.emhttp.var') {
                callCount++;
                return callCount === 1 ? oldState : newState;
            }
            if (key === 'store.paths.webGuiBase') {
                return '/usr/local/emhttp/webGui';
            }
            return defaultValue;
        });

        const input: UpdateSystemTimeInput = {
            timeZone: 'America/Los_Angeles',
            useNtp: false,
            manualDateTime: '2025-01-22 10:00:00',
            ntpServers: ['time.google.com'],
        };

        const result = await service.updateSystemTime(input);

        expect(emcmd).toHaveBeenCalledTimes(1);
        const [commands, options] = vi.mocked(emcmd).mock.calls[0];
        expect(options).toEqual({ waitForToken: true });
        expect(commands).toEqual({
            setDateTime: 'apply',
            timeZone: 'America/Los_Angeles',
            USE_NTP: 'no',
            NTP_SERVER1: 'time.google.com',
            NTP_SERVER2: '',
            NTP_SERVER3: '',
            NTP_SERVER4: '',
            newDateTime: '2025-01-22 10:00:00',
        });

        expect(phpLoaderSpy).toHaveBeenCalledWith({
            file: '/usr/local/emhttp/webGui/include/ResetTZ.php',
            method: 'GET',
        });

        expect(result.timeZone).toBe('America/Los_Angeles');
        expect(result.useNtp).toBe(false);
        expect(result.ntpServers).toEqual(['time.google.com', '', '', '']);
    });

    it('throws when provided timezone is invalid', async () => {
        await expect(service.updateSystemTime({ timeZone: 'Not/AZone' })).rejects.toBeInstanceOf(
            BadRequestException
        );
        expect(emcmd).not.toHaveBeenCalled();
    });

    it('throws when disabling NTP without manualDateTime', async () => {
        await expect(service.updateSystemTime({ useNtp: false })).rejects.toBeInstanceOf(
            BadRequestException
        );
        expect(emcmd).not.toHaveBeenCalled();
    });

    it('retains manual mode and generates timestamp when not supplied', async () => {
        const manualState = {
            timeZone: 'UTC',
            useNtp: false,
            ntpServer1: '',
            ntpServer2: '',
            ntpServer3: '',
            ntpServer4: '',
        };
        const updatedState = {
            timeZone: 'UTC',
            useNtp: false,
            ntpServer1: 'time.cloudflare.com',
            ntpServer2: '',
            ntpServer3: '',
            ntpServer4: '',
        };

        let callCount = 0;
        vi.mocked(configService.get).mockImplementation((key: string, defaultValue?: any) => {
            if (key === 'store.emhttp.var') {
                callCount++;
                return callCount === 1 ? manualState : updatedState;
            }
            if (key === 'store.paths.webGuiBase') {
                return '/usr/local/emhttp/webGui';
            }
            return defaultValue;
        });

        const result = await service.updateSystemTime({ ntpServers: ['time.cloudflare.com'] });

        const [commands] = vi.mocked(emcmd).mock.calls[0];
        expect(commands.USE_NTP).toBe('no');
        expect(commands.NTP_SERVER1).toBe('time.cloudflare.com');
        expect(commands.newDateTime).toMatch(MANUAL_TIME_REGEX);
        expect(phpLoaderSpy).not.toHaveBeenCalled();
        expect(result.ntpServers).toEqual(['time.cloudflare.com', '', '', '']);
    });
});
