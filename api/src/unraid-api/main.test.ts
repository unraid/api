import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const createMock = vi.fn();
const fastifyAdapterConstructor = vi.fn().mockImplementation((options) => ({
    options,
}));

vi.mock('@nestjs/core', () => ({
    NestFactory: {
        create: createMock,
    },
}));

vi.mock('@nestjs/platform-fastify/index.js', () => ({
    FastifyAdapter: fastifyAdapterConstructor,
}));

vi.mock('@app/unraid-api/app/app.module.js', () => ({
    AppModule: class AppModule {},
}));

vi.mock('@app/unraid-api/exceptions/graphql-exceptions.filter.js', () => ({
    GraphQLExceptionsFilter: class GraphQLExceptionsFilter {},
}));

vi.mock('@app/unraid-api/exceptions/http-exceptions.filter.js', () => ({
    HttpExceptionFilter: class HttpExceptionFilter {},
}));

vi.mock('@app/core/log.js', () => ({
    apiLogger: {
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
    },
}));

vi.mock('@app/environment.js', () => ({
    LOG_LEVEL: 'INFO',
    PORT: '3001',
}));

describe('bootstrapNestServer', () => {
    const originalProcessSend = process.send;

    beforeEach(() => {
        vi.resetModules();
        vi.clearAllMocks();
        process.send = vi.fn().mockReturnValue(true) as typeof process.send;
    });

    afterEach(() => {
        process.send = originalProcessSend;
    });

    it('creates the Fastify adapter with an explicit trustProxy policy', async () => {
        const server = {
            register: vi.fn().mockResolvedValue(undefined),
            addHook: vi.fn(),
            listen: vi.fn().mockResolvedValue('http://0.0.0.0:3001'),
        };

        const emitter = {
            emit: vi.fn(),
        };

        const app = {
            enableShutdownHooks: vi.fn(),
            useGlobalPipes: vi.fn(),
            getHttpAdapter: vi.fn().mockReturnValue({
                getInstance: vi.fn().mockReturnValue(server),
            }),
            enableCors: vi.fn(),
            useLogger: vi.fn(),
            useGlobalInterceptors: vi.fn(),
            flushLogs: vi.fn(),
            useGlobalFilters: vi.fn(),
            init: vi.fn().mockResolvedValue(undefined),
            get: vi.fn((token: unknown) => {
                if (token === EventEmitter2) {
                    return emitter;
                }

                if (token === ConfigService) {
                    return {
                        get: vi.fn(),
                    };
                }

                return {};
            }),
        };

        createMock.mockResolvedValue(app);

        const { bootstrapNestServer } = await import('@app/unraid-api/main.js');
        await bootstrapNestServer();

        expect(fastifyAdapterConstructor).toHaveBeenCalledWith({
            trustProxy: '127.0.0.1/8,::1/128',
        });
    });
});
