import { type AccessUrl } from '@app/graphql/generated/api/types';
import { type AppDispatch, type RootState } from '@app/store/index';

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
