import { apiKeyToUser } from "@app/graphql/index";
import { getters } from "@app/store/index";
import { execa } from "execa";
import { type Response, type Request} from 'express';
import { stat, rm } from "fs/promises";
import path from "path";

export const getLogs = async (req: Request, res: Response) => {
    // @TODO - Clean up this function
    const apiKey = req.headers['x-api-key'];
    const logPath = getters.paths()["log-base"];
    const zipToWrite = path.join(logPath, '../unraid-api.tar.gz');
    if (
        apiKey &&
        typeof apiKey === 'string' &&
        (await apiKeyToUser(apiKey)).role !== 'guest'
    ) {
        const exists = Boolean(await stat(logPath).catch(() => null));
        if (exists) {
            try {
                await execa('tar', [
                    '-czf',
                    zipToWrite,
                    logPath
                ]);
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