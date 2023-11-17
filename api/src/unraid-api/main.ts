import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';
import {
    FastifyAdapter,
    type NestFastifyApplication,
} from '@nestjs/platform-fastify';

export async function bootstrapNestServer(port: string): Promise<NestFastifyApplication> {
    const app = await NestFactory.create<NestFastifyApplication>(
        AppModule,
        new FastifyAdapter({ logger: false }),
        { cors: true }
    );
    await app.listen(port, '0.0.0.0');
    console.log('listening on port: ' + port);
    return app;
}

