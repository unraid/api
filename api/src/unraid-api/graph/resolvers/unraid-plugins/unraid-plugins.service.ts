import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'node:crypto';
import { constants as fsConstants } from 'node:fs';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';

import type { ExecaError } from 'execa';
import { execa } from 'execa';

import { createSubscription, pubsub } from '@app/core/pubsub.js';
import {
    InstallPluginInput,
    PluginInstallEvent,
    PluginInstallOperation,
    PluginInstallStatus,
} from '@app/unraid-api/graph/resolvers/unraid-plugins/unraid-plugins.model.js';

const CHANNEL_PREFIX = 'PLUGIN_INSTALL:';

type PluginInstallSubscriberIterator = AsyncIterableIterator<{
    pluginInstallUpdates: PluginInstallEvent;
}>;

type PluginInstallChildProcess = ReturnType<typeof execa>;

type OperationType = 'plugin' | 'language';

const INSTALLER_COMMAND_CANDIDATES: Record<OperationType, string[]> = {
    plugin: [
        '/usr/local/sbin/plugin',
        '/usr/local/emhttp/plugins/dynamix.plugin.manager/scripts/plugin',
        'plugin',
    ],
    language: [
        '/usr/local/sbin/language',
        '/usr/local/emhttp/plugins/dynamix.plugin.manager/scripts/language',
        'language',
    ],
};
const INSTALLER_COMMAND_TIMEOUT_MS = 5 * 60 * 1000;

interface OperationState {
    id: string;
    type: OperationType;
    url: string;
    name?: string | null;
    status: PluginInstallStatus;
    createdAt: Date;
    updatedAt?: Date;
    finishedAt?: Date;
    output: string[];
    bufferedOutput: string;
    forced: boolean;
    child?: PluginInstallChildProcess;
}

@Injectable()
export class UnraidPluginsService {
    private readonly logger = new Logger(UnraidPluginsService.name);
    private readonly operations = new Map<string, OperationState>();
    private readonly operationCleanupTimers = new Map<string, ReturnType<typeof setTimeout>>();
    private readonly installerCommandCache = new Map<OperationType, string>();
    private readonly MAX_OUTPUT_LINES = 500;
    private readonly COMPLETED_OPERATION_TTL_MS: number;

    constructor(private readonly configService: ConfigService) {
        const ttlFromConfig = this.configService.get<number>(
            'plugins.installOperationRetentionMs',
            15 * 60 * 1000
        );
        this.COMPLETED_OPERATION_TTL_MS = Math.max(ttlFromConfig ?? 15 * 60 * 1000, 1000);
    }

    async installPlugin(input: InstallPluginInput): Promise<PluginInstallOperation> {
        return this.startOperation('plugin', input);
    }

    async installLanguage(input: InstallPluginInput): Promise<PluginInstallOperation> {
        return this.startOperation('language', input);
    }

    private async startOperation(
        type: OperationType,
        input: InstallPluginInput
    ): Promise<PluginInstallOperation> {
        const validatedUrl = this.validateInstallUrl(type, input.url);
        const id = randomUUID();
        const createdAt = new Date();

        const operation: OperationState = {
            id,
            type,
            url: validatedUrl,
            name: input.name,
            status: PluginInstallStatus.RUNNING,
            createdAt,
            updatedAt: createdAt,
            output: [],
            bufferedOutput: '',
            forced: input.forced ?? true,
        };

        this.operations.set(id, operation);

        this.logger.log(
            `Starting ${type} installation for "${input.name ?? input.url}" (operation ${id})`
        );

        this.publishEvent(operation, []);

        const args = this.buildArgs(operation);
        const command = await this.resolveInstallerCommand(type);

        const child = execa(command, args, {
            all: true,
            reject: false,
            timeout: INSTALLER_COMMAND_TIMEOUT_MS,
        });

        operation.child = child;

        if (child.all) {
            child.all.on('data', (chunk) => {
                this.handleOutput(operation, chunk.toString());
            });
        } else {
            child.stdout?.on('data', (chunk) => this.handleOutput(operation, chunk.toString()));
            child.stderr?.on('data', (chunk) => this.handleOutput(operation, chunk.toString()));
        }

        child.on('error', (error) => {
            if (operation.status === PluginInstallStatus.RUNNING) {
                this.handleFailure(operation, error);
            }
        });

        child.on('close', (code) => {
            if (operation.status !== PluginInstallStatus.RUNNING) {
                return;
            }

            if (code === 0) {
                this.handleSuccess(operation);
            } else {
                this.handleFailure(operation, new Error(`${type} command exited with ${code}`));
            }
        });

        return this.toGraphqlOperation(operation);
    }

    private validateInstallUrl(type: OperationType, candidateUrl: string): string {
        const normalized = candidateUrl.trim();
        let parsedUrl: URL;
        try {
            parsedUrl = new URL(normalized);
        } catch {
            throw new Error(`Invalid ${type} URL: "${candidateUrl}".`);
        }

        if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
            throw new Error(`Unsupported URL protocol for ${type} install: ${parsedUrl.protocol}`);
        }

        if (type === 'plugin' && !parsedUrl.pathname.toLowerCase().endsWith('.plg')) {
            throw new Error(`Plugin URL must point to a .plg file: "${candidateUrl}".`);
        }

        return parsedUrl.toString();
    }

    async listInstalledPlugins(): Promise<string[]> {
        const paths = this.configService.get<Record<string, string>>('store.paths', {});
        const dynamixBase = paths?.['dynamix-base'] ?? '/boot/config/plugins/dynamix';
        const pluginsDir = path.resolve(dynamixBase, '..');

        try {
            const entries = await fs.readdir(pluginsDir, { withFileTypes: true });
            return entries
                .filter((entry) => entry.isFile() && entry.name.endsWith('.plg'))
                .map((entry) => entry.name);
        } catch (error: unknown) {
            if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
                this.logger.warn(`Plugin directory not found at ${pluginsDir}.`);
                return [];
            }

            this.logger.error('Failed to read plugin directory.', error);
            return [];
        }
    }

    getOperation(id: string): PluginInstallOperation | null {
        const operation = this.operations.get(id);
        if (!operation) {
            return null;
        }
        return this.toGraphqlOperation(operation);
    }

    listOperations(): PluginInstallOperation[] {
        return Array.from(this.operations.values()).map((operation) =>
            this.toGraphqlOperation(operation)
        );
    }

    subscribe(operationId: string): PluginInstallSubscriberIterator {
        if (!this.operations.has(operationId)) {
            throw new Error(`Unknown plugin installation operation: ${operationId}`);
        }
        return createSubscription<{
            pluginInstallUpdates: PluginInstallEvent;
        }>(this.getChannel(operationId));
    }

    private buildArgs(operation: OperationState): string[] {
        const args = ['install', operation.url];
        // 'language' command doesn't support 'forced' flag in same way, or at all?
        // Checking doc: language install LANGUAGE-FILE
        // plugin install PLUGIN-FILE [forced]

        if (operation.type === 'plugin' && operation.forced) {
            args.push('forced');
        }
        return args;
    }

    private async resolveInstallerCommand(type: OperationType): Promise<string> {
        const cached = this.installerCommandCache.get(type);
        if (cached) {
            return cached;
        }

        const candidates = INSTALLER_COMMAND_CANDIDATES[type];

        for (const candidate of candidates) {
            if (!candidate.includes('/')) {
                this.installerCommandCache.set(type, candidate);
                return candidate;
            }

            try {
                await fs.access(candidate, fsConstants.X_OK);
                this.installerCommandCache.set(type, candidate);
                return candidate;
            } catch {
                // Try next candidate.
            }
        }

        // Should be unreachable because final candidate is command name.
        const fallback = type;
        this.installerCommandCache.set(type, fallback);
        return fallback;
    }

    private handleOutput(operation: OperationState, chunk: string) {
        const timestamp = new Date();
        operation.updatedAt = timestamp;
        operation.bufferedOutput += chunk;

        const lines = this.extractCompleteLines(operation);
        if (!lines.length) {
            return;
        }

        operation.output.push(...lines);
        this.trimOutput(operation);
        this.publishEvent(operation, lines);
    }

    private extractCompleteLines(operation: OperationState): string[] {
        const lines = operation.bufferedOutput.split(/\r?\n/);
        operation.bufferedOutput = lines.pop() ?? '';
        return lines.map((line) => line.trimEnd()).filter((line) => line.length > 0);
    }

    private handleSuccess(operation: OperationState) {
        if (operation.status !== PluginInstallStatus.RUNNING) {
            return;
        }

        const timestamp = new Date();
        operation.status = PluginInstallStatus.SUCCEEDED;
        operation.finishedAt = timestamp;
        operation.updatedAt = timestamp;

        const trailingOutput = this.flushBuffer(operation);
        if (trailingOutput.length) {
            operation.output.push(...trailingOutput);
        }
        this.trimOutput(operation);
        this.publishEvent(operation, trailingOutput);
        this.publishEvent(operation, [], true);
        this.scheduleOperationCleanup(operation.id);
        this.logger.log(
            `Plugin installation for "${operation.name ?? operation.url}" completed successfully (operation ${operation.id})`
        );
    }

    private handleFailure(operation: OperationState, error: unknown) {
        if (operation.status !== PluginInstallStatus.RUNNING) {
            return;
        }

        const timestamp = new Date();
        operation.status = PluginInstallStatus.FAILED;
        operation.finishedAt = timestamp;
        operation.updatedAt = timestamp;

        const trailingOutput = this.flushBuffer(operation);
        if (trailingOutput.length) {
            operation.output.push(...trailingOutput);
        }

        const errorLine = this.normalizeError(error);
        if (errorLine) {
            operation.output.push(errorLine);
        }

        this.trimOutput(operation);
        const outputLines = [...trailingOutput];
        if (errorLine) {
            outputLines.push(errorLine);
        }
        this.publishEvent(operation, outputLines);
        this.publishEvent(operation, [], true);
        this.scheduleOperationCleanup(operation.id);

        this.logger.error(
            `Plugin installation for "${operation.name ?? operation.url}" failed (operation ${operation.id})`,
            error instanceof Error ? error.stack : undefined
        );
    }

    private flushBuffer(operation: OperationState): string[] {
        if (!operation.bufferedOutput) {
            return [];
        }
        const buffered = operation.bufferedOutput.trim();
        operation.bufferedOutput = '';
        return buffered.length ? [buffered] : [];
    }

    private normalizeError(error: unknown): string | null {
        const extracted = this.extractErrorOutput(error);
        if (extracted) {
            const trimmed = extracted.trim();
            if (trimmed.length) {
                return trimmed;
            }
        }

        if (error && typeof error === 'object' && 'code' in error) {
            const code = (error as { code?: unknown }).code;
            if (code === 'ENOENT') {
                return 'Plugin command not found on this system.';
            }
        }

        if (error instanceof Error && error.message) {
            return error.message;
        }

        return null;
    }

    private extractErrorOutput(error: unknown): string {
        if (!error || typeof error !== 'object') {
            return '';
        }

        const candidate = error as ExecaError & { all?: unknown };
        return (
            this.coerceToString(candidate.all) ??
            this.coerceToString(candidate.stderr) ??
            this.coerceToString(candidate.stdout) ??
            this.coerceToString(candidate.shortMessage) ??
            this.coerceToString(candidate.message) ??
            ''
        );
    }

    private coerceToString(value: unknown): string | null {
        if (!value) {
            return null;
        }

        if (typeof value === 'string') {
            return value;
        }

        if (value instanceof Uint8Array) {
            return Buffer.from(value).toString('utf-8');
        }

        if (Array.isArray(value)) {
            const combined = value
                .map((entry) => this.coerceToString(entry) ?? '')
                .filter((entry) => entry.length > 0)
                .join('\n');
            return combined.length ? combined : null;
        }

        return null;
    }

    private trimOutput(operation: OperationState) {
        if (operation.output.length <= this.MAX_OUTPUT_LINES) {
            return;
        }
        const excess = operation.output.length - this.MAX_OUTPUT_LINES;
        operation.output.splice(0, excess);
    }

    private publishEvent(operation: OperationState, output: string[], final = false) {
        const event: PluginInstallEvent = {
            operationId: operation.id,
            status: operation.status,
            output: output.length ? output : undefined,
            timestamp: new Date(),
        };

        void pubsub.publish(this.getChannel(operation.id), {
            pluginInstallUpdates: event,
        });

        if (final) {
            // no-op placeholder for future cleanup hooks
        }
    }

    private toGraphqlOperation(operation: OperationState): PluginInstallOperation {
        return {
            id: operation.id,
            url: operation.url,
            name: operation.name,
            status: operation.status,
            createdAt: operation.createdAt,
            updatedAt: operation.updatedAt ?? null,
            finishedAt: operation.finishedAt ?? null,
            output: [...operation.output],
        };
    }

    private getChannel(operationId: string): string {
        return `${CHANNEL_PREFIX}${operationId}`;
    }

    private scheduleOperationCleanup(operationId: string) {
        const existing = this.operationCleanupTimers.get(operationId);
        if (existing) {
            clearTimeout(existing);
        }

        const timer = setTimeout(() => {
            this.operations.delete(operationId);
            this.operationCleanupTimers.delete(operationId);
        }, this.COMPLETED_OPERATION_TTL_MS);

        if (typeof (timer as { unref?: () => void }).unref === 'function') {
            (timer as { unref: () => void }).unref();
        }

        this.operationCleanupTimers.set(operationId, timer);
    }
}
