import { getBannerPathIfPresent, getCasePathIfPresent } from "@app/core/utils/images/image-file-helpers";
import { apiKeyToUser } from "@app/graphql/index";
import { type Request, type Response } from "express";
export const getImages = async (req: Request, res: Response) => {
    // @TODO - Clean up this function
    const apiKey = req.headers['x-api-key'];
    if (
        apiKey &&
        typeof apiKey === 'string' &&
        (await apiKeyToUser(apiKey)).role !== 'guest'
    ) {
        if (req.params.type === 'banner') {
            const path = await getBannerPathIfPresent();
            if (path) {
                res.sendFile(path);
                return;
            }
        } else if (req.params.type === 'case') {
            const path = await getCasePathIfPresent();
            if (path) {
                res.sendFile(path);
                return;
            }
        }

        return res.status(404).send('no customization of this type found');
    }

    return res.status(403).send('unauthorized');
};
