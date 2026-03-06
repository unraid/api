import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { readFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';

import type { Var } from '@app/core/types/states/var.js';
import type { TimeZoneOption } from '@app/unraid-api/graph/resolvers/system-time/system-time.model.js';
import { emcmd } from '@app/core/utils/clients/emcmd.js';
import { phpLoader } from '@app/core/utils/plugins/php-loader.js';
import {
    SystemTime,
    UpdateSystemTimeInput,
} from '@app/unraid-api/graph/resolvers/system-time/system-time.model.js';

const MAX_NTP_SERVERS = 4;
const DEFAULT_NTP_SERVER = 'pool.ntp.org';

@Injectable()
export class SystemTimeService {
    private readonly logger = new Logger(SystemTimeService.name);

    constructor(private readonly configService: ConfigService) {}

    public async getSystemTime(): Promise<SystemTime> {
        return this.buildSystemTime(this.readVarState());
    }

    public async updateSystemTime(input: UpdateSystemTimeInput): Promise<SystemTime> {
        const current = this.configService.get<Partial<Var>>('store.emhttp.var', {});

        const desiredTimeZone = (input.timeZone ?? current.timeZone)?.trim();
        if (!desiredTimeZone) {
            throw new BadRequestException('A valid time zone is required.');
        }
        this.validateTimeZone(desiredTimeZone);

        const hasCurrentUseNtp = typeof current.useNtp !== 'undefined';
        const hasCurrentNtpServers = this.hasNtpServerState(current);
        const currentServers = hasCurrentNtpServers
            ? this.normalizeNtpServers(undefined, current)
            : null;
        const hasConfiguredServers = currentServers
            ? currentServers.some((server) => server.length > 0)
            : false;
        const allowDefaultNtp = input.useNtp !== false;

        let desiredUseNtp = input.useNtp ?? (hasCurrentUseNtp ? Boolean(current.useNtp) : undefined);
        let desiredServers: string[] | null = null;

        if (input.ntpServers !== undefined) {
            desiredServers = this.normalizeNtpServers(input.ntpServers, current);
        } else if (hasCurrentNtpServers) {
            if (!hasConfiguredServers && allowDefaultNtp) {
                desiredServers = this.normalizeNtpServers([DEFAULT_NTP_SERVER], current);
                desiredUseNtp = true;
            } else {
                desiredServers = currentServers;
            }
        }

        const commands: Record<string, string> = {
            setDateTime: 'apply',
            timeZone: desiredTimeZone,
        };

        if (typeof desiredUseNtp !== 'undefined') {
            commands.USE_NTP = desiredUseNtp ? 'yes' : 'no';
        }

        if (desiredServers) {
            desiredServers.forEach((server, index) => {
                commands[`NTP_SERVER${index + 1}`] = server;
            });
        }

        const switchingToManual = desiredUseNtp === false && Boolean(current.useNtp);
        if (desiredUseNtp === false) {
            let manualDateTime = input.manualDateTime?.trim();
            if (switchingToManual && !manualDateTime) {
                throw new BadRequestException(
                    'manualDateTime is required when disabling NTP synchronization.'
                );
            }
            if (!manualDateTime) {
                manualDateTime = this.formatManualDateTime(new Date());
            }
            commands.newDateTime = manualDateTime;
        }

        const timezoneChanged = desiredTimeZone !== (current.timeZone ?? '');
        const useNtpLabel = typeof desiredUseNtp === 'undefined' ? 'unchanged' : String(desiredUseNtp);

        this.logger.log(
            `Updating system time settings (zone=${desiredTimeZone}, useNtp=${useNtpLabel}, timezoneChanged=${timezoneChanged})`
        );

        try {
            await emcmd(commands, { waitForToken: true });
            this.logger.log('emcmd executed successfully for system time update.');
        } catch (error) {
            this.logger.error('Failed to update system time via emcmd', error as Error);
            throw error;
        }

        if (timezoneChanged) {
            await this.resetTimezoneWatcher();
        }

        const refreshed = this.readVarState();
        if (timezoneChanged && refreshed.timeZone !== desiredTimeZone) {
            this.logger.warn(
                `System time state still reports ${refreshed.timeZone ?? 'unknown'} after update to ${desiredTimeZone}.`
            );
        }

        return this.buildSystemTime(refreshed);
    }

    public async getTimeZoneOptions(): Promise<TimeZoneOption[]> {
        const timeZoneFile = this.getTimeZoneListPath();
        try {
            const contents = await readFile(timeZoneFile, 'utf-8');
            return this.parseTimeZoneOptions(contents);
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            this.logger.warn(`Failed to read time zone list from ${timeZoneFile}: ${message}`);
            return [];
        }
    }

    private extractNtpServers(varState: Partial<Var>): string[] {
        const servers = [
            varState.ntpServer1 ?? '',
            varState.ntpServer2 ?? '',
            varState.ntpServer3 ?? '',
            varState.ntpServer4 ?? '',
        ].map((value) => value?.trim() ?? '');

        while (servers.length < MAX_NTP_SERVERS) {
            servers.push('');
        }

        return servers;
    }

    private readVarState(): Partial<Var> {
        return this.configService.get<Partial<Var>>('store.emhttp.var', {});
    }

    private buildSystemTime(varState: Partial<Var>): SystemTime {
        const ntpServers = this.extractNtpServers(varState);

        return {
            currentTime: new Date().toISOString(),
            timeZone: varState.timeZone ?? 'UTC',
            useNtp: Boolean(varState.useNtp),
            ntpServers,
        };
    }

    private normalizeNtpServers(override: string[] | undefined, current: Partial<Var>): string[] {
        if (!override) {
            return this.extractNtpServers(current);
        }

        const sanitized = override
            .slice(0, MAX_NTP_SERVERS)
            .map((server) => this.sanitizeNtpServer(server));

        const result: string[] = [];
        for (let i = 0; i < MAX_NTP_SERVERS; i += 1) {
            result[i] = sanitized[i] ?? '';
        }

        return result;
    }

    private sanitizeNtpServer(server?: string): string {
        if (!server) {
            return '';
        }
        return server.trim().slice(0, 40);
    }

    private getTimeZoneListPath(): string {
        const webGuiBase = this.configService.get<string>(
            'store.paths.webGuiBase',
            '/usr/local/emhttp/webGui'
        );
        return resolve(webGuiBase, '..', 'plugins', 'dynamix', 'include', 'timezones.key');
    }

    private parseTimeZoneOptions(contents: string): TimeZoneOption[] {
        return contents
            .split('\n')
            .map((line) => line.trim())
            .filter((line) => line.length > 0)
            .map((line) => {
                const separatorIndex = line.indexOf('|');
                if (separatorIndex === -1) {
                    const value = line.trim();
                    return value ? { value, label: value } : null;
                }
                const value = line.slice(0, separatorIndex).trim();
                if (!value) {
                    return null;
                }
                const label = line.slice(separatorIndex + 1).trim() || value;
                return { value, label };
            })
            .filter((entry): entry is TimeZoneOption => Boolean(entry));
    }

    private hasNtpServerState(varState: Partial<Var>): boolean {
        return (
            typeof varState.ntpServer1 !== 'undefined' ||
            typeof varState.ntpServer2 !== 'undefined' ||
            typeof varState.ntpServer3 !== 'undefined' ||
            typeof varState.ntpServer4 !== 'undefined'
        );
    }

    private validateTimeZone(timeZone: string) {
        try {
            new Intl.DateTimeFormat('en-US', { timeZone });
        } catch (error) {
            this.logger.warn(`Invalid time zone provided: ${timeZone}`);
            throw new BadRequestException(`Invalid time zone: ${timeZone}`);
        }
    }

    private formatManualDateTime(date: Date): string {
        const pad = (value: number) => value.toString().padStart(2, '0');
        return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
    }

    private async resetTimezoneWatcher() {
        const webGuiBase = this.configService.get<string>(
            'store.paths.webGuiBase',
            '/usr/local/emhttp/webGui'
        );
        const scriptPath = join(webGuiBase, 'include', 'ResetTZ.php');

        try {
            await phpLoader({ file: scriptPath, method: 'GET' });
            this.logger.debug('Executed ResetTZ.php to refresh timezone watchers.');
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            this.logger.warn(`Failed to execute ResetTZ.php at ${scriptPath}: ${message}`);
        }
    }
}
