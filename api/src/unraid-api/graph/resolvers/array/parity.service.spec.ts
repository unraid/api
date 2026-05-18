import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { readFile } from 'fs/promises';

import { GraphQLError } from 'graphql';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { emcmd } from '@app/core/utils/clients/emcmd.js';
import { ParityService } from '@app/unraid-api/graph/resolvers/array/parity.service.js';

vi.mock('@app/core/utils/clients/emcmd.js', () => ({
    emcmd: vi.fn(),
}));

vi.mock('@app/store/index.js', () => ({
    getters: {
        emhttp: vi.fn(),
        paths: vi.fn(),
    },
}));

vi.mock('fs/promises', () => ({
    readFile: vi.fn(),
}));

describe('ParityService', () => {
    let service: ParityService;
    let mockEmhttp: ReturnType<typeof vi.fn>;
    let mockEmcmd: ReturnType<typeof vi.fn>;

    beforeEach(async () => {
        vi.resetAllMocks();

        const storeMock = await import('@app/store/index.js');
        mockEmhttp = vi.mocked(storeMock.getters.emhttp);
        mockEmhttp.mockReturnValue({ var: { mdResync: 0 } } as never);
        vi.mocked(storeMock.getters.paths).mockReturnValue({
            'parity-checks': '/dev/null',
        } as never);

        // getParityHistory() is called after every updateParityCheck — stub the
        // file read so the trailing call resolves successfully.
        vi.mocked(readFile).mockResolvedValue(Buffer.from(''));

        mockEmcmd = vi.mocked(emcmd);
        mockEmcmd.mockResolvedValue({} as never);

        const module: TestingModule = await Test.createTestingModule({
            providers: [ParityService],
        }).compile();

        service = module.get<ParityService>(ParityService);
    });

    describe('updateParityCheck', () => {
        // Regression test for #1815. emhttpd identifies parity-check actions
        // by the form-field NAME, not the value — so posting `cmdCheck=Resume`
        // falls through to the plain `cmdCheck` submit handler (start a
        // fresh check), discarding mdResyncPos and restarting from byte 0.
        // The web UI submits `cmdCheckResume=`, and so must we.
        it('resume sends `cmdCheckResume` (matches the Unraid web UI)', async () => {
            mockEmhttp.mockReturnValue({ var: { mdResync: 17578328012 } } as never);

            await service.updateParityCheck({ wantedState: 'resume', correct: false });

            expect(mockEmcmd).toHaveBeenCalledWith({
                startState: 'STARTED',
                cmdCheckResume: '',
            });
        });

        it('pause sends `cmdCheckPause`', async () => {
            mockEmhttp.mockReturnValue({ var: { mdResync: 17578328012 } } as never);

            await service.updateParityCheck({ wantedState: 'pause', correct: false });

            expect(mockEmcmd).toHaveBeenCalledWith({
                startState: 'STARTED',
                cmdCheckPause: '',
            });
        });

        it('cancel sends `cmdCheckCancel`', async () => {
            mockEmhttp.mockReturnValue({ var: { mdResync: 17578328012 } } as never);

            await service.updateParityCheck({ wantedState: 'cancel', correct: false });

            expect(mockEmcmd).toHaveBeenCalledWith({
                startState: 'STARTED',
                cmdCheckCancel: '',
            });
        });

        it('start sends `cmdCheck: "Check"`', async () => {
            await service.updateParityCheck({ wantedState: 'start', correct: false });

            expect(mockEmcmd).toHaveBeenCalledWith({
                startState: 'STARTED',
                cmdCheck: 'Check',
            });
        });

        it('start with correct: true also writes corrections', async () => {
            await service.updateParityCheck({ wantedState: 'start', correct: true });

            expect(mockEmcmd).toHaveBeenCalledWith({
                startState: 'STARTED',
                cmdCheck: 'Check',
                optionCorrect: 'correct',
            });
        });

        it('rejects `start` when a parity check is already running', async () => {
            mockEmhttp.mockReturnValue({ var: { mdResync: 17578328012 } } as never);

            await expect(
                service.updateParityCheck({ wantedState: 'start', correct: false })
            ).rejects.toThrow(GraphQLError);
            expect(mockEmcmd).not.toHaveBeenCalled();
        });

        it('rejects an unknown wantedState', async () => {
            await expect(
                service.updateParityCheck({
                    // @ts-expect-error: deliberately invalid state to verify guard
                    wantedState: 'bogus',
                    correct: false,
                })
            ).rejects.toThrow(GraphQLError);
            expect(mockEmcmd).not.toHaveBeenCalled();
        });

        it('wraps emcmd failures as GraphQLError', async () => {
            mockEmcmd.mockRejectedValue(new Error('emhttpd unavailable'));

            await expect(
                service.updateParityCheck({ wantedState: 'start', correct: false })
            ).rejects.toThrowError(/emhttpd unavailable/);
        });
    });
});
