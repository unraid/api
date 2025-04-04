import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';

import { beforeEach, describe, expect, it } from 'vitest';

import { DockerEventService } from './docker-event.service.js';
import { DockerModule } from './docker.module.js';
import { DockerMutationsResolver } from './docker.mutations.resolver.js';
import { DockerResolver } from './docker.resolver.js';
import { DockerService } from './docker.service.js';

describe('DockerModule', () => {
  it('should compile the module', async () => {
    const module = await Test.createTestingModule({
      imports: [DockerModule],
    }).compile();

    expect(module).toBeDefined();
  });

  it('should provide DockerService', async () => {
    const module = await Test.createTestingModule({
      imports: [DockerModule],
    }).compile();

    const service = module.get<DockerService>(DockerService);
    expect(service).toBeInstanceOf(DockerService);
  });

  it('should provide DockerEventService', async () => {
    const module = await Test.createTestingModule({
      imports: [DockerModule],
    }).compile();

    const service = module.get<DockerEventService>(DockerEventService);
    expect(service).toBeInstanceOf(DockerEventService);
  });

  it('should provide DockerResolver', async () => {
    const module = await Test.createTestingModule({
      imports: [DockerModule],
    }).compile();

    const resolver = module.get<DockerResolver>(DockerResolver);
    expect(resolver).toBeInstanceOf(DockerResolver);
  });

  it('should provide DockerMutationsResolver', async () => {
    const module = await Test.createTestingModule({
      imports: [DockerModule],
    }).compile();

    const resolver = module.get<DockerMutationsResolver>(DockerMutationsResolver);
    expect(resolver).toBeInstanceOf(DockerMutationsResolver);
  });
}); 