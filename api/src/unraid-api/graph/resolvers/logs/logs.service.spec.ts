import { Test, TestingModule } from '@nestjs/testing';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { LogsService } from '@app/unraid-api/graph/resolvers/logs/logs.service.js';
import { SubscriptionTrackerService } from '@app/unraid-api/graph/services/subscription-tracker.service.js';

describe('LogsService', () => {
    let service: LogsService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                LogsService,
                {
                    provide: SubscriptionTrackerService,
                    useValue: {
                        getSubscriberCount: vi.fn().mockReturnValue(0),
                        registerTopic: vi.fn(),
                    },
                },
            ],
        }).compile();

        service = module.get<LogsService>(LogsService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });
});
