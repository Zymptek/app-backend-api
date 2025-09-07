import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SupabaseService } from './supabase/supabase.service';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        AppService,
        SupabaseService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              const config = {
                SUPABASE_URL: 'https://test.supabase.co',
                SUPABASE_ANON_KEY: 'test-anon-key',
                SUPABASE_SERVICE_ROLE_KEY: 'test-service-key',
              };
              return config[key];
            }),
          },
        },
      ],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(appController.getHello()).toBe('Hello World!');
    });
  });

  describe('health/supabase', () => {
    it('should return health status', async () => {
      const result = await appController.checkSupabaseHealth();
      expect(result.status).toBe('ok');
      expect(result.message).toContain('Supabase client initialized successfully');
    });
  });
});
