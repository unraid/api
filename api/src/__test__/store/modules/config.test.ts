import { expect, test, vi } from 'vitest';

import { pubsub, PUBSUB_CHANNEL } from '@app/core/pubsub.js';
import { MinigraphStatus, WAN_ACCESS_TYPE, WAN_FORWARD_TYPE } from '@app/graphql/generated/api/types.js';
import { GraphQLClient } from '@app/mothership/graphql-client.js';
import { stopPingTimeoutJobs } from '@app/mothership/jobs/ping-timeout-jobs.js';
import { setGraphqlConnectionStatus } from '@app/store/actions/set-minigraph-status.js';
import { setupRemoteAccessThunk } from '@app/store/actions/setup-remote-access.js';
import { store } from '@app/store/index.js';
import { MyServersConfigMemory } from '@app/types/my-servers-config.js';

// Mock dependencies
vi.mock('@app/core/pubsub.js', () => ({
    pubsub: {
        publish: vi.fn(),
    },
    PUBSUB_CHANNEL: {
        OWNER: 'OWNER',
        SERVERS: 'SERVERS',
    },
}));

vi.mock('@app/mothership/graphql-client.js', () => ({
    GraphQLClient: {
        clearInstance: vi.fn(),
    },
}));

vi.mock('@app/mothership/jobs/ping-timeout-jobs.js', () => ({
    stopPingTimeoutJobs: vi.fn(),
}));

const createConfigMatcher = (specificValues: Partial<MyServersConfigMemory> = {}) => {
    const defaultMatcher = {
        api: expect.objectContaining({
            extraOrigins: expect.any(String),
            version: expect.any(String),
        }),
        connectionStatus: expect.objectContaining({
            minigraph: expect.any(String),
            upnpStatus: expect.any(String),
        }),
        local: expect.objectContaining({
            sandbox: expect.any(String),
        }),
        nodeEnv: expect.any(String),
        remote: expect.objectContaining({
            accesstoken: expect.any(String),
            allowedOrigins: expect.any(String),
            apikey: expect.any(String),
            avatar: expect.any(String),
            dynamicRemoteAccessType: expect.any(String),
            email: expect.any(String),
            idtoken: expect.any(String),
            localApiKey: expect.any(String),
            refreshtoken: expect.any(String),
            regWizTime: expect.any(String),
            ssoSubIds: expect.any(String),
            upnpEnabled: expect.any(String),
            username: expect.any(String),
            wanaccess: expect.any(String),
            wanport: expect.any(String),
        }),
        status: expect.any(String),
    };

    return expect.objectContaining({
        ...defaultMatcher,
        ...specificValues,
    });
};

test('Before init returns default values for all fields', async () => {
    const state = store.getState().config;
    expect(state).toMatchSnapshot();
}, 10_000);

test('After init returns values from cfg file for all fields', async () => {
    const { loadConfigFile } = await import('@app/store/modules/config.js');

    // Load cfg into store
    await store.dispatch(loadConfigFile());

    // Check if store has cfg contents loaded
    const state = store.getState().config;
    expect(state).toMatchObject(createConfigMatcher());
});

test('updateUserConfig merges in changes to current state', async () => {
    const { loadConfigFile, updateUserConfig } = await import('@app/store/modules/config.js');

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
        createConfigMatcher({
            remote: expect.objectContaining({
                avatar: 'https://via.placeholder.com/200',
            }),
        })
    );
});

test('loginUser updates state and publishes to pubsub', async () => {
    const { loginUser } = await import('@app/store/modules/config.js');
    const userInfo = {
        email: 'test@example.com',
        avatar: 'https://via.placeholder.com/200',
        username: 'testuser',
        apikey: 'test-api-key',
        localApiKey: 'test-local-api-key',
    };

    await store.dispatch(loginUser(userInfo));

    expect(pubsub.publish).toHaveBeenCalledWith(PUBSUB_CHANNEL.OWNER, {
        owner: {
            username: userInfo.username,
            avatar: userInfo.avatar,
        },
    });

    const state = store.getState().config;
    expect(state).toMatchObject(
        createConfigMatcher({
            remote: expect.objectContaining(userInfo),
        })
    );
});

test('logoutUser clears state and publishes to pubsub', async () => {
    const { logoutUser } = await import('@app/store/modules/config.js');

    await store.dispatch(logoutUser({ reason: 'test logout' }));

    expect(pubsub.publish).toHaveBeenCalledWith(PUBSUB_CHANNEL.SERVERS, { servers: [] });
    expect(pubsub.publish).toHaveBeenCalledWith(PUBSUB_CHANNEL.OWNER, {
        owner: {
            username: 'root',
            url: '',
            avatar: '',
        },
    });
    expect(stopPingTimeoutJobs).toHaveBeenCalled();
    expect(GraphQLClient.clearInstance).toHaveBeenCalled();
});

test('updateAccessTokens updates token fields', async () => {
    const { updateAccessTokens } = await import('@app/store/modules/config.js');
    const tokens = {
        accesstoken: 'new-access-token',
        refreshtoken: 'new-refresh-token',
        idtoken: 'new-id-token',
    };

    store.dispatch(updateAccessTokens(tokens));

    const state = store.getState().config;
    expect(state).toMatchObject(
        createConfigMatcher({
            remote: expect.objectContaining(tokens),
        })
    );
});

test('updateAllowedOrigins updates extraOrigins', async () => {
    const { updateAllowedOrigins } = await import('@app/store/modules/config.js');
    const origins = ['https://test1.com', 'https://test2.com'];

    store.dispatch(updateAllowedOrigins(origins));

    const state = store.getState().config;
    expect(state.api.extraOrigins).toBe(origins.join(', '));
});

test('setUpnpState updates upnp settings', async () => {
    const { setUpnpState } = await import('@app/store/modules/config.js');

    store.dispatch(setUpnpState({ enabled: 'yes', status: 'active' }));

    const state = store.getState().config;
    expect(state.remote.upnpEnabled).toBe('yes');
    expect(state.connectionStatus.upnpStatus).toBe('active');
});

test('setWanPortToValue updates wanport', async () => {
    const { setWanPortToValue } = await import('@app/store/modules/config.js');

    store.dispatch(setWanPortToValue(8443));

    const state = store.getState().config;
    expect(state.remote.wanport).toBe('8443');
});

test('setWanAccess updates wanaccess', async () => {
    const { setWanAccess } = await import('@app/store/modules/config.js');

    store.dispatch(setWanAccess('yes'));

    const state = store.getState().config;
    expect(state.remote.wanaccess).toBe('yes');
});

test('addSsoUser adds user to ssoSubIds', async () => {
    const { addSsoUser } = await import('@app/store/modules/config.js');

    store.dispatch(addSsoUser('user1'));
    store.dispatch(addSsoUser('user2'));

    const state = store.getState().config;
    expect(state.remote.ssoSubIds).toBe('user1,user2');
});

test('removeSsoUser removes user from ssoSubIds', async () => {
    const { addSsoUser, removeSsoUser } = await import('@app/store/modules/config.js');

    store.dispatch(addSsoUser('user1'));
    store.dispatch(addSsoUser('user2'));
    store.dispatch(removeSsoUser('user1'));

    const state = store.getState().config;
    expect(state.remote.ssoSubIds).toBe('user2');
});

test('removeSsoUser with null clears all ssoSubIds', async () => {
    const { addSsoUser, removeSsoUser } = await import('@app/store/modules/config.js');

    store.dispatch(addSsoUser('user1'));
    store.dispatch(addSsoUser('user2'));
    store.dispatch(removeSsoUser(null));

    const state = store.getState().config;
    expect(state.remote.ssoSubIds).toBe('');
});

test('setLocalApiKey updates localApiKey', async () => {
    const { setLocalApiKey } = await import('@app/store/modules/config.js');

    store.dispatch(setLocalApiKey('new-local-api-key'));

    const state = store.getState().config;
    expect(state.remote.localApiKey).toBe('new-local-api-key');
});

test('setLocalApiKey with null clears localApiKey', async () => {
    const { setLocalApiKey } = await import('@app/store/modules/config.js');

    store.dispatch(setLocalApiKey(null));

    const state = store.getState().config;
    expect(state.remote.localApiKey).toBe('');
});

test('setGraphqlConnectionStatus updates minigraph status', async () => {
    store.dispatch(setGraphqlConnectionStatus({ status: MinigraphStatus.CONNECTED, error: null }));

    const state = store.getState().config;
    expect(state.connectionStatus.minigraph).toBe(MinigraphStatus.CONNECTED);
});

test('setupRemoteAccessThunk.fulfilled updates remote access settings', async () => {
    const remoteAccessSettings = {
        accessType: WAN_ACCESS_TYPE.DYNAMIC,
        forwardType: WAN_FORWARD_TYPE.UPNP,
    };

    await store.dispatch(setupRemoteAccessThunk(remoteAccessSettings));

    const state = store.getState().config;
    expect(state.remote).toMatchObject({
        wanaccess: 'no',
        dynamicRemoteAccessType: 'UPNP',
        wanport: '',
        upnpEnabled: 'yes',
    });
});
