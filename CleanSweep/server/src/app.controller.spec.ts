import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SubscriptionService } from './common/subscription.service';
import { AuditLogService } from './common/audit-log.service';
import { KindeAuthGuard } from './auth/kinde-auth.guard';
import { ConfigService } from '@nestjs/config';

describe('AppController', () => {
  let appController: AppController;

  const mockAppService = {
    getHello: jest.fn().mockReturnValue('Hello World!'),
  };

  const mockSubscriptionService = {
    isPro: jest.fn().mockResolvedValue(true),
    setTier: jest.fn().mockResolvedValue(true),
  };

  const mockAuditLogService = {
    getLogs: jest.fn().mockResolvedValue([]),
  };

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        { provide: AppService, useValue: mockAppService },
        { provide: SubscriptionService, useValue: mockSubscriptionService },
        { provide: AuditLogService, useValue: mockAuditLogService },
        { provide: ConfigService, useValue: { get: jest.fn().mockReturnValue('https://mock.kinde.com') } },
      ],
    })
      .overrideGuard(KindeAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('should be defined', () => {
      expect(appController).toBeDefined();
    });

    it('should return user info from getMe', async () => {
      const mockUser = { id: 'usr_123', email: 'user@test.com' };
      const me = await appController.getMe(mockUser);
      expect(me).toEqual({
        id: 'usr_123',
        email: 'user@test.com',
        subscriptionTier: 'PRO',
      });
    });
  });
});
