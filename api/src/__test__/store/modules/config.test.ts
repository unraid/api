import { expect, test } from 'vitest';

import { store } from '@app/store';
import { MyServersConfigMemory } from '@app/types/my-servers-config';

test('Before init returns default values for all fields', async () => {
    const state = store.getState().config;
    expect(state).toMatchSnapshot();
}, 10_000);

test('After init returns values from cfg file for all fields', async () => {
    const { loadConfigFile } = await import('@app/store/modules/config');

    // Load cfg into store
    await store.dispatch(loadConfigFile());

    // Check if store has cfg contents loaded
    const state = store.getState().config;
    expect(state).toMatchObject(
        expect.objectContaining({
            api: {
                extraOrigins: expect.stringMatching('https://google.com,https://test.com'),
                version: expect.any(String),
            },
            connectionStatus: {
                minigraph: 'PRE_INIT',
                upnpStatus: '',
            },
            local: {},
            nodeEnv: 'test',
            notifier: {
                apikey: 'unnotify_30994bfaccf839c65bae75f7fa12dd5ee16e69389f754c3b98ed7d5',
            },
            remote: {
                accesstoken: '',
                allowedOrigins: '',
                apikey: '_______________________BIG_API_KEY_HERE_________________________',
                avatar: 'https://via.placeholder.com/200',
                dynamicRemoteAccessType: 'DISABLED',
                email: 'test@example.com',
                idtoken: '',
                localApiKey: '_______________________LOCAL_API_KEY_HERE_________________________',
                refreshtoken: '',
                regWizTime: '1611175408732_0951-1653-3509-FBA155FA23C0',
                ssoSubIds: '',
                upnpEnabled: 'no',
                username: 'zspearmint',
                wanaccess: 'yes',
                wanport: '8443',
            },
            status: 'LOADED',
            upc: {
                apikey: 'unupc_fab6ff6ffe51040595c6d9ffb63a353ba16cc2ad7d93f813a2e80a5810',
            },
        })
    );
});

test('updateUserConfig merges in changes to current state', async () => {
    const { loadConfigFile, updateUserConfig } = await import('@app/store/modules/config');

    // Load cfg into store
    await store.dispatch(loadConfigFile());

    // Update store
    store.dispatch(
        updateUserConfig({
            remote: { avatar: 'https://via.placeholder.com/200' },
        })
    );

    const state = store.getState().config;
    expect(state).toMatchObject(
        expect.objectContaining({
            api: {
                extraOrigins: expect.stringMatching('https://google.com,https://test.com'),
                version: expect.any(String),
            },
            connectionStatus: {
                minigraph: 'PRE_INIT',
                upnpStatus: '',
            },
            local: {},
            nodeEnv: 'test',
            notifier: {
                apikey: 'unnotify_30994bfaccf839c65bae75f7fa12dd5ee16e69389f754c3b98ed7d5',
            },
            remote: {
                accesstoken: '',
                allowedOrigins: '',
                apikey: '_______________________BIG_API_KEY_HERE_________________________',
                avatar: 'https://via.placeholder.com/200',
                dynamicRemoteAccessType: 'DISABLED',
                email: 'test@example.com',
                idtoken: '',
                localApiKey: '_______________________LOCAL_API_KEY_HERE_________________________',
                refreshtoken: '',
                regWizTime: '1611175408732_0951-1653-3509-FBA155FA23C0',
                ssoSubIds: '',
                upnpEnabled: 'no',
                username: 'zspearmint',
                wanaccess: 'yes',
                wanport: '8443',
            },
            status: 'LOADED',
            upc: {
                apikey: 'unupc_fab6ff6ffe51040595c6d9ffb63a353ba16cc2ad7d93f813a2e80a5810',
            },
        } as MyServersConfigMemory)
    );
});
