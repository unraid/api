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
        dynamixCaseModelConfig: '/boot/config/plugins/dynamix/case-model.cfg',
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
        webguiImagesBase: '/usr/local/emhttp/webGui/images',
        identConfig: '/boot/config/ident.cfg',
        activationAssets: expect.stringContaining('api/dev/activation/assets'),
        partnerLogoSource: expect.stringContaining('api/dev/activation/assets/logo.svg'),
        partnerLogoTarget: '/usr/local/emhttp/webGui/images/partner-logo.svg',
        caseModelSource: expect.stringContaining('api/dev/activation/assets/case-model.png'),
        caseModelTarget: '/usr/local/emhttp/webGui/images/case-model.png',
        partnerBannerSource: expect.stringContaining('api/dev/activation/assets/banner.png'),
        partnerBannerTarget: '/usr/local/emhttp/webGui/images/banner.png',
    });
});
