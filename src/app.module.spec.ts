import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { AppModule } from './app.module';
import { AppService } from './app.service';
import { AppController } from './app.controller';
import { SupabaseService } from './supabase/supabase.service';
import { PrismaService } from './prisma/prisma.service';
import { SupabaseAuthGuard } from './admin-auth/guards/supabase-auth.guard';
import { AdminRoleGuard } from './admin-auth/guards/admin-role.guard';

describe('AppModule', () => {
  let module: TestingModule;

  beforeEach(async () => {
    // Set up test environment variables
    process.env.SUPABASE_URL = 'https://test.supabase.co';
    process.env.SUPABASE_ANON_KEY = 'test-anon-key';
    process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';

    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
        }),
        AppModule,
      ],
    })
      .overrideProvider(SupabaseService)
      .useValue({
        getClient: jest.fn().mockReturnValue({
          auth: {
            getUser: jest.fn(),
            signInWithPassword: jest.fn(),
            signOut: jest.fn(),
            refreshSession: jest.fn(),
          },
        }),
        getServiceRoleClient: jest.fn(),
      })
      .overrideGuard(SupabaseAuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .overrideGuard(AdminRoleGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();
  });

  afterEach(() => {
    // Clean up environment variables
    delete process.env.SUPABASE_URL;
    delete process.env.SUPABASE_ANON_KEY;
    delete process.env.DATABASE_URL;
  });

  it('should be defined', () => {
    expect(module).toBeDefined();
  });

  it('should provide AppService', () => {
    const appService = module.get<AppService>(AppService);
    expect(appService).toBeDefined();
  });

  it('should provide AppController', () => {
    const appController = module.get<AppController>(AppController);
    expect(appController).toBeDefined();
  });

  it('should provide SupabaseService', () => {
    const supabaseService = module.get<SupabaseService>(SupabaseService);
    expect(supabaseService).toBeDefined();
  });

  it('should provide PrismaService', () => {
    const prismaService = module.get<PrismaService>(PrismaService);
    expect(prismaService).toBeDefined();
  });
});
