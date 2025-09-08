import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { AdminAuthService } from './admin-auth.service';
import { AdminAuthController } from './admin-auth.controller';
import { AdminAuthModule } from './admin-auth.module';
import { SupabaseService } from '../supabase/supabase.service';
import { PrismaService } from '../prisma/prisma.service';

describe('AdminAuthModule', () => {
  let module: TestingModule;

  beforeEach(async () => {
    // Set up test environment variables
    process.env.SUPABASE_URL = 'https://test.supabase.co';
    process.env.SUPABASE_ANON_KEY = 'test-anon-key';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key';
    process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';

    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
        }),
        AdminAuthModule,
      ],
      providers: [
        {
          provide: SupabaseService,
          useValue: {
            getClient: jest.fn(),
            getServiceRoleClient: jest.fn(),
          },
        },
        {
          provide: PrismaService,
          useValue: {
            user: {
              findFirst: jest.fn(),
              findUnique: jest.fn(),
              update: jest.fn(),
            },
          },
        },
      ],
    }).compile();
  });

  afterEach(() => {
    // Clean up environment variables
    delete process.env.SUPABASE_URL;
    delete process.env.SUPABASE_ANON_KEY;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    delete process.env.DATABASE_URL;
  });

  it('should be defined', () => {
    expect(module).toBeDefined();
  });

  it('should provide AdminAuthService', () => {
    const authService = module.get<AdminAuthService>(AdminAuthService);
    expect(authService).toBeDefined();
  });

  it('should provide AdminAuthController', () => {
    const authController = module.get<AdminAuthController>(AdminAuthController);
    expect(authController).toBeDefined();
  });
});
