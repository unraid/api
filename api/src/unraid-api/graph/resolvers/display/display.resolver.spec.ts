import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { DisplayResolver } from '@app/unraid-api/graph/resolvers/display/display.resolver.js';
import { DisplayService } from '@app/unraid-api/graph/resolvers/info/display/display.service.js';

// Mock the pubsub module
vi.mock('@app/core/pubsub.js', () => ({
    createSubscription: vi.fn().mockReturnValue('mock-subscription'),
    PUBSUB_CHANNEL: {
        DISPLAY: 'display',
    },
}));

describe('DisplayResolver', () => {
    let resolver: DisplayResolver;
    let displayService: DisplayService;

    const mockDisplayData = {
        id: 'display',
        case: {
            url: '',
            icon: 'default',
            error: '',
            base64: '',
        },
        theme: 'black',
        unit: 'C',
        scale: true,
        tabs: false,
        resize: true,
        wwn: false,
        total: true,
        usage: false,
        text: true,
        warning: 40,
        critical: 50,
        hot: 60,
        max: 80,
        locale: 'en_US',
    };

    const mockDisplayService = {
        generateDisplay: vi.fn().mockResolvedValue(mockDisplayData),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                DisplayResolver,
                {
                    provide: DisplayService,
                    useValue: mockDisplayService,
                },
            ],
        }).compile();

        resolver = module.get<DisplayResolver>(DisplayResolver);
        displayService = module.get<DisplayService>(DisplayService);

        // Reset mocks before each test
        vi.clearAllMocks();
    });

    it('should be defined', () => {
        expect(resolver).toBeDefined();
        expect(displayService).toBeDefined();
    });

    describe('display', () => {
        it('should return display info from service', async () => {
            const result = await resolver.display();

            expect(mockDisplayService.generateDisplay).toHaveBeenCalledOnce();
            expect(result).toEqual(mockDisplayData);
        });
    });

    describe('displaySubscription', () => {
        it('should create and return subscription', async () => {
            const { createSubscription, PUBSUB_CHANNEL } = await import('@app/core/pubsub.js');

            const result = await resolver.displaySubscription();

            expect(createSubscription).toHaveBeenCalledWith(PUBSUB_CHANNEL.DISPLAY);
            expect(result).toBe('mock-subscription');
        });
    });
});
