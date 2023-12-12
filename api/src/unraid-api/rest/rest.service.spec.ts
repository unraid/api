import { Test, TestingModule } from '@nestjs/testing';
import { RestService } from './rest.service';

describe('RestService', () => {
  let service: RestService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RestService],
    }).compile();

    service = module.get<RestService>(RestService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
