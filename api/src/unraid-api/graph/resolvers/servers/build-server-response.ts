import { type SliceState } from '@app/store/modules/emhttp.js';
import {
    ProfileModel,
    Server,
    ServerStatus,
} from '@app/unraid-api/graph/resolvers/servers/server.model.js';

type BuildServerResponseOptions = {
    apikey?: string;
    comment?: string;
    name?: string;
    owner?: Partial<ProfileModel>;
};

const DEFAULT_OWNER: ProfileModel = {
    id: 'local',
    username: 'root',
    url: '',
    avatar: '',
};

export const buildServerResponse = (
    emhttpState: SliceState,
    { apikey = '', comment, name, owner }: BuildServerResponseOptions = {}
): Server => {
    const lanip = emhttpState.networks?.[0]?.ipaddr?.[0] ?? '';
    const port = emhttpState.var?.port ?? '';
    const defaultUrl = emhttpState.nginx?.defaultUrl?.trim() || undefined;

    return {
        id: 'local',
        owner: {
            ...DEFAULT_OWNER,
            ...owner,
        },
        guid: emhttpState.var?.regGuid ?? '',
        apikey,
        name: name ?? emhttpState.var?.name ?? 'Local Server',
        comment: comment ?? emhttpState.var?.comment,
        status: ServerStatus.ONLINE,
        wanip: '',
        lanip,
        localurl: lanip ? `http://${lanip}${port ? `:${port}` : ''}` : '',
        remoteurl: '',
        defaultUrl,
    };
};
