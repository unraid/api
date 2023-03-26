import { type AccessUrl } from '@app/graphql/generated/client/graphql';
import { type AppDispatch, type RootState } from '@app/store/index';

export interface GenericRemoteAccess {
	beginRemoteAccess({ getState, dispatch }: { getState: () => RootState; dispatch: AppDispatch }): Promise<AccessUrl | null>;
	stopRemoteAccess({ getState, dispatch }: { getState: () => RootState; dispatch: AppDispatch }): Promise<void>;
}

export interface IRemoteAccessController extends GenericRemoteAccess {
	timeout: NodeJS.Timeout | null;
	extendRemoteAccess({ getState, dispatch }: { getState: () => RootState; dispatch: AppDispatch }): void;
}
