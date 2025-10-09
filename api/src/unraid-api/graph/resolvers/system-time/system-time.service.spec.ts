import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { emcmd } from '@app/core/utils/clients/emcmd.js';
import * as PhpLoaderModule from '@app/core/utils/plugins/php-loader.js';
import { getters, store } from '@app/store/index.js';
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
    const emhttpSpy = vi.spyOn(getters, 'emhttp');
    const pathsSpy = vi.spyOn(getters, 'paths');
    const dispatchSpy = vi.spyOn(store, 'dispatch');

    beforeEach(async () => {
        vi.clearAllMocks();

        const module: TestingModule = await Test.createTestingModule({
            providers: [SystemTimeService],
        }).compile();

        service = module.get<SystemTimeService>(SystemTimeService);

        emhttpSpy.mockReturnValue({
            var: {
                timeZone: 'UTC',
                useNtp: true,
                ntpServer1: 'time1.google.com',
                ntpServer2: 'time2.google.com',
                ntpServer3: '',
                ntpServer4: '',
            },
        } as any);

        pathsSpy.mockReturnValue({
            webGuiBase: '/usr/local/emhttp/webGui',
        } as any);

        dispatchSpy.mockResolvedValue({} as any);
        vi.mocked(emcmd).mockResolvedValue({ ok: true } as any);
        phpLoaderSpy.mockResolvedValue('');
    });

    afterEach(() => {
        emhttpSpy.mockReset();
        pathsSpy.mockReset();
        dispatchSpy.mockReset();
        phpLoaderSpy.mockReset();
    });

    it('returns system time from store state', async () => {
        const result = await service.getSystemTime();
        expect(result.timeZone).toBe('UTC');
        expect(result.useNtp).toBe(true);
        expect(result.ntpServers).toEqual(['time1.google.com', 'time2.google.com', '', '']);
        expect(typeof result.currentTime).toBe('string');
    });

    it('updates time settings, disables NTP, and triggers timezone reset', async () => {
        const oldState = {
            var: {
                timeZone: 'UTC',
                useNtp: true,
                ntpServer1: 'pool.ntp.org',
                ntpServer2: '',
                ntpServer3: '',
                ntpServer4: '',
            },
        } as any;
        const newState = {
            var: {
                timeZone: 'America/Los_Angeles',
                useNtp: false,
                ntpServer1: 'time.google.com',
                ntpServer2: '',
                ntpServer3: '',
                ntpServer4: '',
            },
        } as any;

        emhttpSpy.mockImplementationOnce(() => oldState).mockReturnValue(newState);

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
        expect(dispatchSpy).toHaveBeenCalledTimes(1);
        expect(typeof dispatchSpy.mock.calls[0][0]).toBe('function');

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
            var: {
                timeZone: 'UTC',
                useNtp: false,
                ntpServer1: '',
                ntpServer2: '',
                ntpServer3: '',
                ntpServer4: '',
            },
        } as any;

        const manualStateAfter = {
            var: {
                ...manualState.var,
                ntpServer1: 'time.cloudflare.com',
            },
        } as any;

        emhttpSpy.mockImplementationOnce(() => manualState).mockReturnValue(manualStateAfter);

        const result = await service.updateSystemTime({ ntpServers: ['time.cloudflare.com'] });

        const [commands] = vi.mocked(emcmd).mock.calls[0];
        expect(commands.USE_NTP).toBe('no');
        expect(commands.NTP_SERVER1).toBe('time.cloudflare.com');
        expect(commands.newDateTime).toMatch(MANUAL_TIME_REGEX);
        expect(phpLoaderSpy).not.toHaveBeenCalled();
        expect(result.ntpServers).toEqual(['time.cloudflare.com', '', '', '']);
    });
});
