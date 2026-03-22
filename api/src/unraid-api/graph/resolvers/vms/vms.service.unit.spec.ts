import { Test, TestingModule } from '@nestjs/testing';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { VmsService } from '@app/unraid-api/graph/resolvers/vms/vms.service.js';

const mockPaths = {
    'libvirt-pid': '/var/run/libvirt/libvirtd.pid',
};

const {
    accessMock,
    connectCloseMock,
    connectListAllDomainsMock,
    connectOpenMock,
    domainGetInfoMock,
    domainLookupByUUIDStringMock,
    watchMock,
    watcherMock,
} = vi.hoisted(() => {
    const watcher = {
        close: vi.fn().mockResolvedValue(undefined),
        on: vi.fn(),
    };

    watcher.on.mockImplementation(() => watcher);

    return {
        accessMock: vi.fn().mockResolvedValue(undefined),
        connectCloseMock: vi.fn().mockResolvedValue(undefined),
        connectListAllDomainsMock: vi.fn(),
        connectOpenMock: vi.fn().mockResolvedValue(undefined),
        domainGetInfoMock: vi.fn(),
        domainLookupByUUIDStringMock: vi.fn(),
        watchMock: vi.fn(() => watcher),
        watcherMock: watcher,
    };
});

vi.mock('@app/store/index.js', () => ({
    getters: {
        paths: () => mockPaths,
    },
}));

vi.mock('fs/promises', () => ({
    access: accessMock,
}));

vi.mock('chokidar', () => ({
    watch: watchMock,
}));

vi.mock('@unraid/libvirt', () => ({
    ConnectListAllDomainsFlags: {
        ACTIVE: 1,
        INACTIVE: 2,
    },
    DomainState: {
        RUNNING: 1,
        BLOCKED: 2,
        PAUSED: 3,
        SHUTDOWN: 4,
        SHUTOFF: 5,
        CRASHED: 6,
        PMSUSPENDED: 7,
    },
    Hypervisor: vi.fn().mockImplementation(() => ({
        connectClose: connectCloseMock,
        connectListAllDomains: connectListAllDomainsMock,
        connectOpen: connectOpenMock,
        domainGetInfo: domainGetInfoMock,
        domainLookupByUUIDString: domainLookupByUUIDStringMock,
    })),
}));

interface MockDomain {
    create: ReturnType<typeof vi.fn>;
    destroy: ReturnType<typeof vi.fn>;
    getInfo: ReturnType<typeof vi.fn>;
    getName: ReturnType<typeof vi.fn>;
    getUUIDString: ReturnType<typeof vi.fn>;
    resume: ReturnType<typeof vi.fn>;
    shutdown: ReturnType<typeof vi.fn>;
    suspend: ReturnType<typeof vi.fn>;
}

const createMockDomain = (overrides: Partial<MockDomain> = {}): MockDomain => ({
    create: vi.fn().mockResolvedValue(undefined),
    destroy: vi.fn().mockResolvedValue(undefined),
    getInfo: vi.fn().mockResolvedValue({ state: 5 }),
    getName: vi.fn().mockResolvedValue('alpha'),
    getUUIDString: vi.fn().mockResolvedValue('uuid-1'),
    resume: vi.fn().mockResolvedValue(undefined),
    shutdown: vi.fn().mockResolvedValue(undefined),
    suspend: vi.fn().mockResolvedValue(undefined),
    ...overrides,
});

describe('VmsService unit', () => {
    let service: VmsService;

    beforeEach(async () => {
        accessMock.mockReset();
        accessMock.mockResolvedValue(undefined);
        connectCloseMock.mockReset();
        connectCloseMock.mockResolvedValue(undefined);
        connectListAllDomainsMock.mockReset();
        connectOpenMock.mockReset();
        connectOpenMock.mockResolvedValue(undefined);
        domainGetInfoMock.mockReset();
        domainLookupByUUIDStringMock.mockReset();
        watchMock.mockClear();
        watcherMock.close.mockClear();
        watcherMock.on.mockClear();
        watcherMock.on.mockImplementation(() => watcherMock);

        const module: TestingModule = await Test.createTestingModule({
            providers: [VmsService],
        }).compile();

        service = module.get<VmsService>(VmsService);
    });

    it('re-initializes libvirt on demand when availability state is stale', async () => {
        connectListAllDomainsMock.mockResolvedValue([createMockDomain()]);

        const domains = await service.getDomains();

        expect(connectOpenMock).toHaveBeenCalledTimes(1);
        expect(connectListAllDomainsMock).toHaveBeenCalledWith(3);
        expect(domains).toEqual([
            {
                id: 'uuid-1',
                name: 'alpha',
                state: 'SHUTOFF',
                uuid: 'uuid-1',
            },
        ]);
    });

    it('retries listing domains after a dropped libvirt connection', async () => {
        connectListAllDomainsMock
            .mockRejectedValueOnce(new Error('virConnectListAllDomains failed: client socket is closed'))
            .mockResolvedValueOnce([createMockDomain()]);

        await service.onApplicationBootstrap();
        const domains = await service.getDomains();

        expect(connectOpenMock).toHaveBeenCalledTimes(2);
        expect(connectCloseMock).toHaveBeenCalledTimes(1);
        expect(connectListAllDomainsMock).toHaveBeenCalledTimes(2);
        expect(domains).toHaveLength(1);
    });

    it('finishes shutdown polling with the original hypervisor even if shared state is reset', async () => {
        vi.useFakeTimers();

        const domain = createMockDomain({
            getInfo: vi.fn().mockResolvedValue({ state: 1 }),
        });

        domainLookupByUUIDStringMock.mockResolvedValue(domain);
        domainGetInfoMock
            .mockImplementationOnce(async () => {
                Reflect.set(service, 'hypervisor', null);
                Reflect.set(service, 'isVmsAvailable', false);
                return { state: 1 };
            })
            .mockResolvedValueOnce({ state: 5 });

        await service.onApplicationBootstrap();

        const stopPromise = service.stopVm('uuid-1');
        await vi.advanceTimersByTimeAsync(1_000);

        await expect(stopPromise).resolves.toBe(true);
        expect(domain.shutdown).toHaveBeenCalledTimes(1);
        expect(domainGetInfoMock).toHaveBeenCalledTimes(2);

        vi.useRealTimers();
    });
});
