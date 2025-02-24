import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { readFileSync, writeFileSync } from 'fs';

import { beforeEach, describe, expect, it } from 'vitest';

import { getters } from '@app/store/index.js';
import { WriteFlashFileService } from '@app/unraid-api/cron/write-flash-file.service.js';

describe('WriteFlashFileService', () => {
    let service: WriteFlashFileService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [WriteFlashFileService],
        }).compile();

        service = module.get<WriteFlashFileService>(WriteFlashFileService);
        service.randomizeWriteTime = false;
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    it('should write and update the file when called', async () => {
        const timestamp = await service.writeNewTimestamp();
        expect(timestamp).toBeGreaterThan(0);

        const file = readFileSync(getters.paths()['myservers-keepalive'], 'utf8').toString();
        expect(file).toBe(new Date(timestamp).toISOString());

        // Now make the file very old
        writeFileSync(getters.paths()['myservers-keepalive'], '2021-01-01T00:00:00.000Z');
        expect(readFileSync(getters.paths()['myservers-keepalive'], 'utf8').toString()).toBe(
            '2021-01-01T00:00:00.000Z'
        );
        await service.handleCron();
        expect(readFileSync(getters.paths()['myservers-keepalive'], 'utf8').toString()).not.toBe(
            '2021-01-01T00:00:00.000Z'
        );

        // Now make the file kind of old (one day )
        writeFileSync(
            getters.paths()['myservers-keepalive'],
            new Date(Date.now() - 1_000 * 60 * 60 * 24).toISOString()
        );
        const now = Date.now();
        await service.handleCron();
        const contents = readFileSync(getters.paths()['myservers-keepalive'], 'utf8').toString();
        expect(new Date(contents).getTime() + 1_000 * 60 * 60 * 12).toBeLessThan(
            new Date(now).getTime()
        );
    });
});
