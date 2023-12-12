import { Test, TestingModule } from '@nestjs/testing';
import { FlashResolver } from './flash.resolver';

describe('FlashResolver', () => {
  let resolver: FlashResolver;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FlashResolver],
    }).compile();

    resolver = module.get<FlashResolver>(FlashResolver);
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });
});
