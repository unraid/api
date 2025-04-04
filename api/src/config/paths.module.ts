import { Global, Module } from '@nestjs/common';
import { PathsConfig } from './paths.config.js';

@Global()
@Module({
    providers: [PathsConfig],
    exports: [PathsConfig],
})
export class PathsModule {} 