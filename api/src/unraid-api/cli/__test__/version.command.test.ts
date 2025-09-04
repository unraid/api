import { Test, TestingModule } from '@nestjs/testing';

import { afterEach, beforeEach, describe, expect, it, MockInstance, vi } from 'vitest';

import { LogService } from '@app/unraid-api/cli/log.service.js';
import { VersionCommand } from '@app/unraid-api/cli/version.command.js';

let API_VERSION_MOCK = '4.18.2+build123';

vi.mock('@app/environment.js', async (importOriginal) => {
    const actual = (await importOriginal()) as any;
    return {
        ...actual,
        get API_VERSION() {
            return API_VERSION_MOCK;
        },
    };
});

describe('VersionCommand', () => {
    let command: VersionCommand;
    let logService: LogService;
    let consoleLogSpy: MockInstance<typeof console.log>;

    beforeEach(async () => {
        API_VERSION_MOCK = '4.18.2+build123'; // Reset to default before each test
        consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                VersionCommand,
                {
                    provide: LogService,
                    useValue: {
                        info: vi.fn(),
                    },
                },
            ],
        }).compile();

        command = module.get<VersionCommand>(VersionCommand);
        logService = module.get<LogService>(LogService);
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('run', () => {
        it('should output version with logger when no options provided', async () => {
            await command.run([]);

            expect(logService.info).toHaveBeenCalledWith('Unraid API v4.18.2+build123');
            expect(consoleLogSpy).not.toHaveBeenCalled();
        });

        it('should output version with logger when json option is false', async () => {
            await command.run([], { json: false });

            expect(logService.info).toHaveBeenCalledWith('Unraid API v4.18.2+build123');
            expect(consoleLogSpy).not.toHaveBeenCalled();
        });

        it('should output JSON when json option is true', async () => {
            await command.run([], { json: true });

            expect(logService.info).not.toHaveBeenCalled();
            expect(consoleLogSpy).toHaveBeenCalledWith(
                JSON.stringify({
                    version: '4.18.2',
                    build: 'build123',
                    combined: '4.18.2+build123',
                })
            );
        });

        it('should handle version without build info', async () => {
            API_VERSION_MOCK = '4.18.2'; // Set version without build info

            const module: TestingModule = await Test.createTestingModule({
                providers: [
                    VersionCommand,
                    {
                        provide: LogService,
                        useValue: {
                            info: vi.fn(),
                        },
                    },
                ],
            }).compile();

            const commandWithoutBuild = module.get<VersionCommand>(VersionCommand);

            await commandWithoutBuild.run([], { json: true });

            expect(consoleLogSpy).toHaveBeenCalledWith(
                JSON.stringify({
                    version: '4.18.2',
                    build: undefined,
                    combined: '4.18.2',
                })
            );
        });
    });

    describe('parseJson', () => {
        it('should return true', () => {
            expect(command.parseJson()).toBe(true);
        });
    });
});
