import { Test } from '@nestjs/testing';
import { mkdtemp, readdir, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { AuthAction, Resource, Role } from '@unraid/shared/graphql.model.js';
import { InquirerService } from 'nest-commander';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { getters } from '@app/store/index.js';
import { ApiKeyService } from '@app/unraid-api/auth/api-key.service.js';
import { ApiKeyCommand } from '@app/unraid-api/cli/apikey/api-key.command.js';
import { LogService } from '@app/unraid-api/cli/log.service.js';

describe('API key CLI persistence', () => {
    let directory: string;
    let command: ApiKeyCommand;
    let service: ApiKeyService;
    const prompt = vi.fn();
    const log = vi.fn();
    const error = vi.fn();
    const permissions = [{ resource: Resource.ARRAY, actions: [AuthAction.READ_ANY] }];

    beforeEach(async () => {
        vi.clearAllMocks();
        directory = await mkdtemp(join(tmpdir(), 'unraid-api-key-'));
        vi.spyOn(getters, 'paths').mockReturnValue({ ...getters.paths(), 'auth-keys': directory });
        vi.spyOn(process, 'exit').mockImplementation(() => {
            throw new Error('Unexpected process.exit');
        });

        const module = await Test.createTestingModule({
            providers: [
                ApiKeyCommand,
                ApiKeyService,
                { provide: LogService, useValue: { log, error } },
                { provide: InquirerService, useValue: { prompt } },
            ],
        }).compile();
        command = module.get(ApiKeyCommand);
        service = module.get(ApiKeyService);
    });

    afterEach(async () => {
        vi.restoreAllMocks();
        await rm(directory, { recursive: true, force: true });
    });

    it.each([
        { roles: undefined, withPermissions: true, expectedRoles: [] },
        { roles: [], withPermissions: true, expectedRoles: [] },
        { roles: [Role.VIEWER], withPermissions: true, expectedRoles: [Role.VIEWER] },
        { roles: [Role.VIEWER], withPermissions: false, expectedRoles: [Role.VIEWER] },
    ])('persists CLI grants for %j', async ({ roles, withPermissions, expectedRoles }) => {
        await command.run([], {
            create: true,
            name: 'Array Read Test',
            roles,
            permissions: withPermissions ? command.parsePermissions('ARRAY:READ_ANY') : undefined,
        });

        const [key] = await service.loadAllFromDisk();
        expect(key).toMatchObject({
            name: 'Array Read Test',
            roles: expectedRoles,
            permissions: withPermissions ? permissions : [],
        });
        expect(key.key).toMatch(/^[a-f0-9]{64}$/);
        expect(log).toHaveBeenCalledWith(key.key);
        expect(error).not.toHaveBeenCalled();
        expect(prompt).not.toHaveBeenCalled();
        expect(process.exit).not.toHaveBeenCalled();
        expect(JSON.parse(await readFile(join(directory, `${key.id}.json`), 'utf8'))).toMatchObject({
            roles: expectedRoles,
            permissions: withPermissions ? permissions : [],
        });
    });

    it('clears existing roles when overwriting with permissions only', async () => {
        const existing = await service.create({ name: 'Array Read Test', roles: [Role.ADMIN] });
        vi.spyOn(service, 'findByField').mockReturnValue(existing);

        const key = await service.create({ name: existing.name, permissions, overwrite: true });

        expect(key).toMatchObject({ id: existing.id, roles: [], permissions });
        expect(await service.loadAllFromDisk()).toEqual([key]);
    });

    it.each([undefined, []])('rejects an empty grant set with roles=%j', async (roles) => {
        await expect(service.create({ name: 'No Grants', roles, permissions: [] })).rejects.toThrow();
        expect(await readdir(directory)).toEqual([]);
    });
});
