import { Module } from '@nestjs/common';

import { ConnectModule } from './unraid-connect/connect.module.js';

export const adapter = 'nestjs';
@Module({ imports: [ConnectModule] })
class ConnectPluginModule {}
export const ApiModule = ConnectPluginModule;
