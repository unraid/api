import { Test, type TestingModule } from '@nestjs/testing';
import { ConnectResolver } from './connect.resolver';

describe('ConnectResolver', () => {
  let resolver: ConnectResolver;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ConnectResolver],
    }).compile();

    resolver = module.get<ConnectResolver>(ConnectResolver);
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });
});
