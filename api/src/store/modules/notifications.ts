import type { PayloadAction } from '@reduxjs/toolkit';
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';

import type { Notification } from '@app/graphql/generated/api/types.js';
import { logger } from '@app/core/log.js';
import { pubsub, PUBSUB_CHANNEL } from '@app/core/pubsub.js';
import { type NotificationIni } from '@app/core/types/states/notification.js';
import { parseConfig } from '@app/core/utils/misc/parse-config.js';
import { NotificationSchema } from '@app/graphql/generated/api/operations.js';
import { Importance, NotificationType } from '@app/graphql/generated/api/types.js';
import { type AppDispatch, type RootState } from '@app/store/index.js';

interface NotificationState {
    notifications: Record<string, Notification>;
}

const notificationInitialState: NotificationState = {
    notifications: {},
};

const fileImportanceToGqlImportance = (importance: NotificationIni['importance']): Importance => {
    switch (importance) {
        case 'alert':
            return Importance.ALERT;
        case 'warning':
            return Importance.WARNING;
        default:
            return Importance.INFO;
    }
};

const parseNotificationDateToIsoDate = (unixStringSeconds: string | undefined): string | null => {
    if (unixStringSeconds && !isNaN(Number(unixStringSeconds))) {
        return new Date(Number(unixStringSeconds) * 1_000).toISOString();
    }
    return null;
};

export const loadNotification = createAsyncThunk<
    { id: string; notification: Notification },
    { path: string },
    { state: RootState; dispatch: AppDispatch }
>('notifications/loadNotification', ({ path }) => {
    const notificationFile = parseConfig<NotificationIni>({
        filePath: path,
        type: 'ini',
    });

    const notification: Notification = {
        id: path,
        title: notificationFile.event,
        subject: notificationFile.subject,
        description: notificationFile.description ?? '',
        importance: fileImportanceToGqlImportance(notificationFile.importance),
        link: notificationFile.link,
        timestamp: parseNotificationDateToIsoDate(notificationFile.timestamp),
        type: NotificationType.UNREAD,
    };
    const convertedNotification = NotificationSchema().parse(notification);

    if (convertedNotification) {
        pubsub.publish(PUBSUB_CHANNEL.NOTIFICATION, { notificationAdded: convertedNotification });
        return { id: path, notification: convertedNotification };
    }
    throw new Error('Failed to parse notification');
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
        clearAllNotifications: (state) => {
            state.notifications = {};
        },
    },
    extraReducers: (builder) => {
        builder.addCase(loadNotification.fulfilled, (state, { payload }) => {
            state.notifications[payload.id] = payload.notification;
        });
        builder.addCase(loadNotification.rejected, (_, action) => {
            logger.debug('Failed to load notification with error %o', action.error);
        });
    },
});

export const notificationReducer = notificationsStore.reducer;
export const { clearNotification, clearAllNotifications } = notificationsStore.actions;
