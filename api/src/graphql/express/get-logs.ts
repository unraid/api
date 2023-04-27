import { report } from '@app/cli/commands/report';
import { logger } from '@app/core/log';
import { apiKeyToUser } from '@app/graphql/index';
import { getters } from '@app/store/index';
import { execa } from 'execa';
import { type Response, type Request } from 'express';
import { stat, writeFile } from 'fs/promises';
import { join } from 'path';

const saveApiReport = async (pathToReport: string) => {
    try {
        const apiReport = await report('-vv', '--json');
        logger.debug('Report object %o', apiReport);
        await writeFile(
            pathToReport,
            JSON.stringify(apiReport, null, 2),
            'utf-8'
        );
    } catch (error) {
        logger.warn('Could not generate report for zip with error %o', error);
    }
};

export const getLogs = async (req: Request, res: Response) => {
    const apiKey = req.headers['x-api-key'];
    const logPath = getters.paths()['log-base'];
    try {
        await saveApiReport(join(logPath, 'report.json'));
    } catch (error) {
        logger.warn('Could not generate report for zip with error %o', error);
    }
    const zipToWrite = join(logPath, '../unraid-api.tar.gz');
    if (
        apiKey &&
        typeof apiKey === 'string' &&
        (await apiKeyToUser(apiKey)).role !== 'guest'
    ) {
        const exists = Boolean(await stat(logPath).catch(() => null));
        if (exists) {
            try {
                await execa('tar', ['-czf', zipToWrite, logPath]);
                return res.status(200).sendFile(zipToWrite);
            } catch (error) {
                return res.status(503).send(`Failed: ${error}`);
            }
        } else {
            return res.status(404).send('No Logs Available');
        }
    }

    return res.status(403).send('unauthorized');
};
