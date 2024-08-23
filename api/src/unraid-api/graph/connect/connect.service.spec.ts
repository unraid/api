import { Test, TestingModule } from '@nestjs/testing';
import { ConnectService } from './connect.service';

describe('ConnectService', () => {
  let service: ConnectService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ConnectService],
    }).compile();

    service = module.get<ConnectService>(ConnectService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
