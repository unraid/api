import { Test, TestingModule } from '@nestjs/testing';
import { DockerContainersResolver } from './docker-containers.resolver';

describe('DockerContainersResolver', () => {
  let resolver: DockerContainersResolver;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DockerContainersResolver],
    }).compile();

    resolver = module.get<DockerContainersResolver>(DockerContainersResolver);
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });
});
