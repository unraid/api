import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsResolver } from './notifications.resolver';

describe('NotificationsResolver', () => {
  let resolver: NotificationsResolver;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [NotificationsResolver],
    }).compile();

    resolver = module.get<NotificationsResolver>(NotificationsResolver);
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });
});
