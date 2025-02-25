import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { readFile, writeFile } from 'fs/promises';

import { ONE_DAY_MS, THIRTY_MINUTES_MS } from '@app/consts.js';
import { sleep } from '@app/core/utils/misc/sleep.js';
import { convertToFuzzyTime } from '@app/mothership/utils/convert-to-fuzzy-time.js';
import { getters } from '@app/store/index.js';

@Injectable()
export class WriteFlashFileService {
    constructor() {}
    private readonly logger = new Logger(WriteFlashFileService.name);
    private fileLocation = getters.paths()['myservers-keepalive'];
    public randomizeWriteTime = true;
    public writeNewTimestamp = async (): Promise<number> => {
        const wait = this.randomizeWriteTime ? convertToFuzzyTime(0, THIRTY_MINUTES_MS) : 0;
        await sleep(wait);
        const newDate = new Date();
        try {
            await writeFile(this.fileLocation, newDate.toISOString());
        } catch (error) {
            this.logger.error(error);
        }
        return newDate.getTime();
    };

    public getOrCreateTimestamp = async (): Promise<number> => {
        try {
            const file = (await readFile(this.fileLocation, 'utf-8')).toString();
            return Date.parse(file);
        } catch (error) {
            return await this.writeNewTimestamp();
        }
    };

    @Cron('0 * * * *')
    async handleCron() {
        try {
            const currentDate = new Date().getTime();
            const prevDate = await this.getOrCreateTimestamp();
            if (currentDate - prevDate > ONE_DAY_MS * 7) {
                // Write new timestamp
                await this.writeNewTimestamp();
            }
        } catch (error) {
            // File does not exist, write it
            await this.writeNewTimestamp();
            this.logger.error(error);
        }
    }
}
