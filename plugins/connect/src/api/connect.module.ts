import { Module } from '@nestjs/common';
import { ConnectService } from './connect.service.js';
import { ConnectResolver } from './connect.resolver.js';
import { ConnectController } from './connect.controller.js';
import { ConnectPlugin } from './index.js';

@Module({
    providers: [
        ConnectPlugin,
        {
            provide: 'STORE',
            useFactory: (plugin: ConnectPlugin) => plugin.getStore(),
            inject: [ConnectPlugin],
        },
        {
            provide: ConnectService,
            useFactory: (store) => new ConnectService(store),
            inject: ['STORE'],
        },
        ConnectResolver,
    ],
    controllers: [ConnectController],
    exports: [ConnectPlugin],
})
export class ConnectModule {} 