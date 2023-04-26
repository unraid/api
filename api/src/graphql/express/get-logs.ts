import { apiKeyToUser } from "@app/graphql/index";
import { getters } from "@app/store/index";
import { execa } from "execa";
import { type Response, type Request} from 'express';
import { stat, rm } from "fs/promises";
import path from "path";

export const getLogs = async (req: Request, res: Response) => {
    // @TODO - Clean up this function
    const apiKey = req.headers['x-api-key'];
    const logPath = getters.paths()["log-base"]
    const logToUse = path.join(logPath, 'stdout.log');
    const zipToWrite = path.join(logPath, 'stdout.log.gzip');
    if (
        apiKey &&
        typeof apiKey === 'string' &&
        (await apiKeyToUser(apiKey)).role !== 'guest'
    ) {
        const exists = Boolean(await stat(logToUse).catch(() => null));
        if (exists) {
            try {
                await rm(zipToWrite).catch(() => null)
                await execa('zstd', [
                    '-z',
                    logToUse,
                    '-o',
                    zipToWrite,
                    '-T0',
                    '--format=gzip',
                ]);
                return res.status(200).setHeader('Content-Type', 'application/gzip').sendFile(zipToWrite);
            } catch (error) {
                return res.status(503).send(`Failed: ${error}`);
            }
        } else {
            return res.status(404).send('No Logs Available');
        }
    }

    return res.status(403).send('unauthorized');
};