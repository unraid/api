import { type CurriedGetDefaultMiddleware } from '@reduxjs/toolkit/dist/getDefaultMiddleware';

export const defaultAppMiddleware = (getDefaultMiddleware: CurriedGetDefaultMiddleware) =>
    getDefaultMiddleware({
        serializableCheck: {
            ignoredPaths: ['minigraph.client', 'minigraph.subscriptions', 'dashboard.publishJob'],
            ignoredActions: [
                'minigraph/addSubscription',
                'minigraph/createNewClient/fulfilled',
                'minigraph/setClient',
            ],
        },
    });
