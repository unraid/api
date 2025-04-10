import { createAsyncThunk } from '@reduxjs/toolkit';

import { type AppDispatch, type RootState } from '@app/store/index.js';
import { type MyServersConfig } from '@app/types/my-servers-config.js';
import {
    DynamicRemoteAccessType,
    SetupRemoteAccessInput,
    WAN_ACCESS_TYPE,
    WAN_FORWARD_TYPE,
} from '@app/unraid-api/graph/resolvers/connect/connect.model.js';

const getDynamicRemoteAccessType = (
    accessType: WAN_ACCESS_TYPE,
    forwardType?: WAN_FORWARD_TYPE | undefined | null
): DynamicRemoteAccessType => {
    // If access is disabled or always, DRA is disabled
    if (accessType === WAN_ACCESS_TYPE.DISABLED || accessType === WAN_ACCESS_TYPE.ALWAYS) {
        return DynamicRemoteAccessType.DISABLED;
    }
    // if access is enabled and forward type is UPNP, DRA is UPNP, otherwise it is static
    return forwardType === WAN_FORWARD_TYPE.UPNP
        ? DynamicRemoteAccessType.UPNP
        : DynamicRemoteAccessType.STATIC;
};

export const setupRemoteAccessThunk = createAsyncThunk<
    Pick<MyServersConfig['remote'], 'wanaccess' | 'wanport' | 'dynamicRemoteAccessType' | 'upnpEnabled'>,
    SetupRemoteAccessInput,
    { state: RootState; dispatch: AppDispatch }
>('config/setupRemoteAccess', async (payload) => {
    if (payload.accessType === WAN_ACCESS_TYPE.DISABLED) {
        return {
            wanaccess: 'no',
            wanport: '',
            dynamicRemoteAccessType: DynamicRemoteAccessType.DISABLED,
            upnpEnabled: 'no',
        };
    }

    if (payload.forwardType === WAN_FORWARD_TYPE.STATIC && !payload.port) {
        throw new Error('Missing port for WAN forward type STATIC');
    }

    return {
        wanaccess: payload.accessType === WAN_ACCESS_TYPE.ALWAYS ? 'yes' : 'no',
        wanport: payload.forwardType === WAN_FORWARD_TYPE.STATIC ? String(payload.port) : '',
        dynamicRemoteAccessType: getDynamicRemoteAccessType(payload.accessType, payload.forwardType),
        upnpEnabled: payload.forwardType === WAN_FORWARD_TYPE.UPNP ? 'yes' : 'no',
    };
});
