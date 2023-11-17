import { Test, TestingModule } from '@nestjs/testing';
import { DisplayResolver } from './display.resolver';

describe('DisplayResolver', () => {
  let resolver: DisplayResolver;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DisplayResolver],
    }).compile();

    resolver = module.get<DisplayResolver>(DisplayResolver);
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });
});
