import { type AppDispatch, type RootState } from '@app/store/index.js';
import { AccessUrl } from '@app/unraid-api/graph/resolvers/connect/connect.model.js';

export interface GenericRemoteAccess {
    beginRemoteAccess({
        getState,
        dispatch,
    }: {
        getState: () => RootState;
        dispatch: AppDispatch;
    }): Promise<AccessUrl | null>;
    stopRemoteAccess({
        getState,
        dispatch,
    }: {
        getState: () => RootState;
        dispatch: AppDispatch;
    }): Promise<void>;
    getRemoteAccessUrl({ getState }: { getState: () => RootState }): AccessUrl | null;
}

export interface IRemoteAccessController extends GenericRemoteAccess {
    extendRemoteAccess({
        getState,
        dispatch,
    }: {
        getState: () => RootState;
        dispatch: AppDispatch;
    }): void;
}
