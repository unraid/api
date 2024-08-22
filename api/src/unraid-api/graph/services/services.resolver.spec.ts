import { Test, TestingModule } from '@nestjs/testing';
import { ServicesResolver } from './services.resolver';

describe('ServicesResolver', () => {
  let resolver: ServicesResolver;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ServicesResolver],
    }).compile();

    resolver = module.get<ServicesResolver>(ServicesResolver);
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });
});
