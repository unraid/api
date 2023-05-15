import { logger } from '@app/core/log';
import { parseConfig } from '@app/core/utils/misc/parse-config';
import { Importance, NotificationType, type Notification } from '@app/graphql/generated/api/types';
import { NotificationInputSchema } from '@app/graphql/generated/api/operations';
import { type RootState, type AppDispatch } from '@app/store/index';
import { FileLoadStatus } from '@app/store/types';
import {
    type PayloadAction,
    createAsyncThunk,
    createSlice,
} from '@reduxjs/toolkit';

interface NotificationState {
    notifications: Record<string, Notification>;
    status: FileLoadStatus;
}

const notificationInitialState: NotificationState = {
    notifications: {},
    status: FileLoadStatus.UNLOADED,
};

interface NotificationIni {
    timestamp: string;
    event: string;
    subject: string;
    description: string;
    importance: 'normal' | 'alert' | 'warning'
    link?: string;
}

const fileImportanceToGqlImportance = (importance: NotificationIni['importance']): Importance => {
    switch (importance) {
        case 'alert':
            return Importance.ALERT;
        case 'warning': 
        return Importance.WARNING;
        default: return Importance.INFO;
    }
}

export const loadNotification = createAsyncThunk<
    { id: string; notification: Notification },
    { path: string },
    { state: RootState; dispatch: AppDispatch }
>('notifications/loadNotification', ({ path }) => {
    logger.debug('Notification Added %s', path);
    const notificationFile = parseConfig<NotificationIni>({
        filePath: path,
        type: 'ini',
    });

    const notification: Notification = {
        title: notificationFile.event,
        subject: notificationFile.subject,
        description: notificationFile.description,
        importance: fileImportanceToGqlImportance(notificationFile.importance),
        link: notificationFile.link,
        timestamp: notificationFile.timestamp ? new Date(notificationFile.timestamp).toISOString() : null,
        type: NotificationType.UNREAD
    };
    const convertedNotification = NotificationInputSchema().safeParse(notification)

    if (convertedNotification.success) {
        return { id: path, notification: convertedNotification.data };
    }
    throw new Error("Failed to parse notification");
});

export const notificationsStore = createSlice({
    name: 'notifications',
    initialState: notificationInitialState,
    reducers: {
        clearNotification: (state, action: PayloadAction<{ path: string }>) => {
            if (state.notifications[action.payload.path]) {
                delete state.notifications[action.payload.path];
            }
        },
    },
    extraReducers: (builder) => {
        builder.addCase(loadNotification.fulfilled, (state, { payload }) => {
            state.notifications[payload.id] = payload.notification;
        });
    },
});

export const notificationReducer = notificationsStore.reducer;
export const { clearNotification } = notificationsStore.actions;
