import { expect, test } from 'vitest';

import { store } from '@app/store/index.js';

test('Returns paths', async () => {
    const { paths } = store.getState();
    expect(Object.keys(paths)).toMatchSnapshot();

    expect(paths).toMatchObject({
        core: expect.stringContaining('api/src/store/modules'),
        'unraid-api-base': '/usr/local/unraid-api/',
        'unraid-data': expect.stringContaining('api/dev/data'),
        'docker-autostart': '/var/lib/docker/unraid-autostart',
        'docker-socket': '/var/run/docker.sock',
        'parity-checks': expect.stringContaining('api/dev/states/parity-checks.log'),
        htpasswd: '/etc/nginx/htpasswd',
        'emhttpd-socket': '/var/run/emhttpd.socket',
        states: expect.stringContaining('api/dev/states'),
        'dynamix-base': expect.stringContaining('api/dev/dynamix'),
        'dynamix-config': expect.arrayContaining([
            expect.stringContaining('api/dev/dynamix/default.cfg'),
            expect.stringContaining('api/dev/dynamix/dynamix.cfg'),
        ]),
        'myservers-base': '/boot/config/plugins/dynamix.my.servers/',
        'myservers-config': expect.stringContaining('api/dev/Unraid.net/myservers.cfg'),
        'myservers-config-states': expect.stringContaining('api/dev/states/myservers.cfg'),
        'myservers-env': '/boot/config/plugins/dynamix.my.servers/env',
        'myservers-keepalive': './dev/Unraid.net/fb_keepalive',
        'keyfile-base': expect.stringContaining('api/dev/Unraid.net'),
        'machine-id': expect.stringContaining('api/dev/data/machine-id'),
        'log-base': '/var/log/unraid-api',
        'unraid-log-base': '/var/log',
        'var-run': '/var/run',
        'auth-sessions': './dev/sessions',
        'auth-keys': expect.stringContaining('api/dev/keys'),
        passwd: expect.stringContaining('api/dev/passwd'),
        'libvirt-pid': '/var/run/libvirt/libvirtd.pid',
        activationBase: expect.stringContaining('api/dev/activation'),
        webGuiBase: '/usr/local/emhttp/webGui',
        identConfig: '/boot/config/ident.cfg',
        activation: {
            assets: expect.stringContaining('api/dev/activation/assets'),
            logo: expect.stringContaining('api/dev/activation/assets/logo.svg'),
            caseModel: expect.stringContaining('api/dev/activation/assets/case-model.png'),
            banner: expect.stringContaining('api/dev/activation/assets/banner.png'),
        },
        boot: {
            caseModel: expect.stringContaining('api/dev/dynamix/case-model.png'),
        },
        webgui: {
            imagesBase: '/usr/local/emhttp/webGui/images',
            logo: {
                fullPath: '/usr/local/emhttp/webGui/images/UN-logotype-gradient.svg',
                assetPath: '/webGui/images/UN-logotype-gradient.svg',
            },
            caseModel: {
                fullPath: '/usr/local/emhttp/webGui/images/case-model.png',
                assetPath: '/webGui/images/case-model.png',
            },
            banner: {
                fullPath: '/usr/local/emhttp/webGui/images/banner.png',
                assetPath: '/webGui/images/banner.png',
            },
        },
    });
});
